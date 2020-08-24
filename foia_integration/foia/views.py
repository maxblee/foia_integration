import functools

from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import render

from foia.utils import auth, templating
from foia.models import State, PRATemplate
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
        new_messages = service.users().messages().list(userId=uid, q="is:unread").execute()
        extra_context["num_unread"] = new_messages["resultSizeEstimate"]
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
                template_user=request.user,
                state=state,
                template=template_json
            )
        # pass template error to user
        except KeyError as e:
            context["form_error"] = str(e)
    states = sorted([
        {"abbr": state.abbr, "name": state.info.name} 
        for state in State.objects.all()
    ], key=functools.cmp_to_key(state_ordering))
    context["states"] = states
    return render(request, "foia/template-builder.html", context)

@user_passes_test(auth.user_has_gmail, login_url="/")
def file_requests(request):
    context = {}
    return render(request, "foia/foia-request.html", context)

def state_ordering(a, b):
    """Order states by abbreviation, but with United States at top"""
    if a["abbr"] == "US":
        return -1
    elif b["abbr"] == "US":
        return 1
    elif a["abbr"] > b["abbr"]:
        return 1
    elif a["abbr"] < b["abbr"]:
        return -1
    return 0