from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore, register_events
from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
import us

# Create your models here.
class State(models.Model):
    """Represents a state (or the federal government) for a FOIA request."""

    abbr = models.CharField(
        "abbreviation",
        max_length=2,
        help_text="The 2-letter state (or federal) abbreviation",
        unique=True,
    )
    public_records_act_name = models.CharField(
        "name of state public records act", max_length=200
    )
    maximum_response_time = models.PositiveSmallIntegerField(
        help_text="What is the maximum time allowed for an initial response?",
        blank=True,
        null=True,
    )
    maximum_extension_time = models.PositiveSmallIntegerField(
        help_text="What is the maximum amount of time allowed for an extension?",
        blank=True,
        null=True,
    )
    business_days = models.BooleanField(
        "Response time is in Business Days",
        help_text="Is the maximum response time in business days or calendar days?",
        blank=True,
        null=True,
    )
    business_days_extension = models.BooleanField(
        "Extension time is in Business Days",
        help_text="Is the maximum time allowed for an extension in business days or calendar days?",
        blank=True,
        null=True,
    )

    @property
    def info(self):
        """Gets basic information for the state/federal government."""
        if self.abbr == "US":
            return us.unitedstatesofamerica
        return us.states.lookup(self.abbr)

    def state_lookup(self, lookup_field):
        """Looks up information about a state.

        Allows for easy configuration between a state and the federal government."""
        if hasattr(self.info, lookup_field):
            return getattr(self.info, lookup_field)
        return None

    @property
    def describe_response_time(self):
        num_days = self.maximum_response_time
        business_days = self.business_days
        if num_days is None or business_days is None:
            response_time = ""
        elif business_days:
            response_time = f" within {num_days} business days"
        else:
            response_time = f" within {num_days} days"
        return f"I look forward to hearing from you{response_time}."

    @property
    def foia_guide(self):
        """Returns the Reporter's Committe for the Freedom of the Press
        Open Government Guide for the state or federal government."""
        state_cleaned = "-".join(self.info.name.lower().split())
        if self.state_lookup("is_territory"):
            return None
        elif self.abbr == "US":
            return "https://www.rcfp.org/foia/"
        else:
            return f"https://www.rcfp.org/open-government-guide/{state_cleaned}/"

    def __str__(self):
        return self.info.name

    class Meta:
        ordering = ["abbr"]


class PRATemplate(models.Model):
    template_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE
    )
    state = models.ForeignKey(State, on_delete=models.CASCADE, null=True, blank=True)
    template = models.JSONField("JSON version of public records template")
    upload_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        user = self.template_user.username
        state = "General" if self.state is None else self.state.info.name
        upload = str(self.upload_date)
        return f"{user} {state} Template ({upload})"


class Entity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # Require a unique constraint because we have to look up from a select/datalist
    # and we want to know we're filing the right thing.
    name = models.CharField(max_length=200, unique=True)
    street_address = models.CharField(max_length=200, blank=True)
    municipality = models.CharField(max_length=100, blank=True)
    # allow for nulls to let people store e.g. foreign companies
    state = models.ForeignKey(State, blank=True, null=True, on_delete=models.CASCADE)
    zip_code = models.CharField(
        max_length=10,
        validators=[
            RegexValidator(
                regex=r"^[0-9]{5}\-?(?:[0-9]{4})?$",
                message="The ZIP code does not match a NNNNN or NNNNN-NNNN format",
            )
        ],
        blank=True,
    )
    # again, allow for blanks to allow people to use this tool to manage sources, contacts, etc
    pra_email = models.EmailField(
        "Public Records Email", null=True, blank=True, unique=True
    )
    is_agency = models.BooleanField(
        "Is the entity a public body (i.e. subject to public records law)?",
        default=True,
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "entities"


class Source(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    title = models.CharField(max_length=200, blank=True)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, null=True, blank=True)
    is_records_officer = models.BooleanField(
        "Is this person a public records officer?", default=False
    )

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @cached_property
    def unique_representation(self):
        first_lower = "-".join(self.first_name.lower().split())
        last_lower = "-".join(self.last_name.lower().split())
        name_matches = Source.objects.filter(
            user=self.user,
            first_name__iexact=self.first_name,
            last_name__iexact=self.last_name,
        ).count()
        suffix = "" if name_matches <= 1 else f".{name_matches}"
        return f"{first_lower}.{last_lower}{suffix}"

    def __str__(self):
        return self.full_name


class RequestContent(models.Model):
    """A class for representing the core
    content of a PRA request.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject_line = models.CharField(max_length=80)
    content = models.TextField()
    expedited_processing = models.TextField(
        verbose_name="justification for expedited processing", blank=True
    )
    fee_waiver = models.TextField(verbose_name="fee waiver justification", blank=True)
    date_filed = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "FOIA Request Body"
        verbose_name_plural = "FOIA Request Bodies"
        ordering = ("-date_filed",)

    def __str__(self):
        return self.subject_line


class RequestItem(models.Model):
    """Represents a single FOIA request"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    request_info = models.ForeignKey(RequestContent, on_delete=models.CASCADE)
    agency = models.ForeignKey(Entity, on_delete=models.CASCADE)
    recipient = models.ForeignKey(
        Source, on_delete=models.SET_NULL, null=True, blank=True
    )
    template = models.ForeignKey(
        PRATemplate, on_delete=models.SET_NULL, null=True, blank=True
    )
    # mostly exists to check to see if any requests failed/need to be resent
    request_sent = models.BooleanField(default=False)

    @cached_property
    def readable_name(self):
        return f"{self.request_info.subject_line}: {self.agency.name}"

    def __str__(self):
        return self.readable_name

class Contact(models.Model):
    """Represents an attempted or actual contact.

    An abstract model for emails, phone calls,
    and in-person visits."""

    class UserRole(models.TextChoices):
        """Represents the role a user took
        (e.g. initiated, followed-up, received)"""
        USER_INITIATED = "i", _("Initiated Contact")
        USER_FOLLOW_UP = "f", _("Followed Up")
        USER_RESPONSE = "r", _("Responded to Contact")
        RECIPIENT_INITIATED = "ri", _("Source initiated contact")
        RECIPIENT_NOTIFICATION = "rn", _("Source sent notification")
        RECIPIENT_RESPONSE = "rr", _("Source responded")
        RECIPIENT_FOLLOW_UP = "rf", _("Source followed up")

    class ContactMethod(models.TextChoices):
        EMAIL = "r", _("E-mail")
        PHONE = "p", _("Phone")
        MESSAGING = "m", _("Messaging system (not email)")
        OTHER = "o", _("Other")

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    contact_type = models.CharField(max_length=2, choices=UserRole.choices)
    contact_method = models.CharField(max_length=1, choices=ContactMethod.choices)
    responding_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True)
    contact_date = models.DateTimeField(default=timezone.now)
    related_request = models.ForeignKey(RequestItem, null=True, on_delete=models.SET_NULL)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        abstract = True

class GMailContact(Contact):

    thread_id = models.CharField(max_length=64)

