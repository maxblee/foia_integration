import collections
import re
from urllib.parse import urlencode

from django.core.exceptions import ValidationError
from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import user_passes_test
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from google.auth.exceptions import RefreshError

from foia.utils import auth, templating, common_queries
from foia.models import State, PRATemplate, Entity, Source

# Create your views here.


def app_index(request):
    """The index page"""
    extra_context = {}
    gmail_service = auth.get_user_service(request)
    if request.user.is_authenticated:
        extra_context["num_overdue"] = "TODO"
    extra_context["has_google_service"] = gmail_service is not None
    if gmail_service is not None:
        service, uid = gmail_service
        try:
            new_messages = (
                service.users().messages().list(userId=uid, q="is:unread").execute()
            )
            extra_context["num_unread"] = new_messages["resultSizeEstimate"]
        # if you stay latent for a long time, your Google token can expire
        # TODO: Probably should replace this with an attempt first to refresh the token
        except RefreshError:
            logout(request)
            messages.info(request, "Google token expired.")
            return HttpResponseRedirect("/?next=/")
    return render(request, "foia/index.html", extra_context)


@user_passes_test(auth.user_has_gmail, login_url="/")
def template_render(request):
    """Renders the template builder"""
    context = {}
    if request.POST:
        template_text = request.POST.get("template-text")
        raw_state = request.POST.get("state")
        state = State.objects.get(abbr=raw_state) if raw_state != "generic" else None
        try:
            template_json = templating.encode_template(template_text)
            PRATemplate.objects.create(
                template_user=request.user, state=state, template=template_json
            )
            next_page = request.GET.get("next")
            # allow for redirects, e.g. from send_requests page
            if next_page:
                return HttpResponseRedirect(next_page)
        # pass template error to user
        except KeyError as e:
            # python's KeyError adds quotes around error messages to deal with empty strings
            # but those won't look good on a web page
            error_message = re.sub(r"^\'|\'$", "", str(e))
            context["form_error"] = error_message
    states = common_queries.order_states()
    context["states"] = states
    return render(request, "foia/template-builder.html", context)


@user_passes_test(auth.user_has_gmail, login_url="/")
def file_requests(request):
    context = {}
    # the Django docs discourage using slices for single item val
    user_templates = PRATemplate.objects.filter(template_user=request.user)[:1]
    if user_templates.count() == 0:
        current_url = reverse("foia-request")
        query = {"next": current_url}
        template_url = reverse("template")
        messages.info(
            request, "In order to send a request, you need to add a template."
        )
        # allow for literal '/' (see https://github.com/django/django/blob/master/django/contrib/auth/views.py#L184)
        return HttpResponseRedirect(f"{template_url}?{urlencode(query, safe='/')}")
    return render(request, "foia/foia-request.html", context)
