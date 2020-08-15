from django.shortcuts import render

from foia.utils import auth
# Create your views here.
def app_index(request):
    extra_context = {}
    gmail_service = auth.get_user_service(request)
    extra_context["has_google_service"] = gmail_service is not None
    if gmail_service is not None:
        service, uid = gmail_service
        new_messages = service.users().messages().list(userId=uid, q="is:unread").execute()
        extra_context["num_unread"] = new_messages["resultSizeEstimate"]
    return render(request, "foia/index.html", extra_context)