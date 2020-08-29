from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models
import us

# Create your models here.
class State(models.Model):
    """Represents a state (or the federal government) for a FOIA request."""
    abbr = models.CharField(
        "abbreviation", 
        max_length=2, 
        help_text="The 2-letter state (or federal) abbreviation",
        unique=True
    )
    public_records_act_name = models.CharField("name of state public records act", max_length=200)
    maximum_response_time = models.PositiveSmallIntegerField(
        help_text="What is the maximum time allowed for an initial response?",
        blank=True,
        null=True
    )
    maximum_extension_time = models.PositiveSmallIntegerField(
        help_text="What is the maximum amount of time allowed for an extension?",
        blank=True,
        null=True
    )
    business_days = models.BooleanField(
        "Response time is in Business Days",
        help_text="Is the maximum response time in business days or calendar days?",
        blank=True,
        null=True
    )
    business_days_extension = models.BooleanField(
        "Extension time is in Business Days",
        help_text="Is the maximum time allowed for an extension in business days or calendar days?",
        blank=True,
        null=True
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
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
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
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE
    )
    # Require a unique constraint because we have to look up from a select/datalist
    # and we want to know we're filing the right thing.
    name = models.CharField(max_length=200, unique=True)
    street_address = models.CharField(max_length=200, blank=True)
    municipality = models.CharField(max_length=100, blank=True)
    # allow for nulls to let people store e.g. foreign companies
    state = models.ForeignKey(State, blank=True, null=True, on_delete=models.CASCADE)
    zip_code = models.CharField(
        max_length=10,
        validators=[RegexValidator(
            regex=r"^[0-9]{5}\-?(?:[0-9]{4})?$", 
            message="The ZIP code does not match a NNNNN or NNNNN-NNNN format",
            )],
        blank=True
    )
    # again, allow for blanks to allow people to use this tool to manage sources, contacts, etc
    pra_email = models.EmailField("Public Records Email", null=True, blank=True, unique=True)
    is_agency = models.BooleanField("Is the entity a public body (i.e. subject to public records law)?", default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "entities"