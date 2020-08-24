from django.http import JsonResponse, Http404
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from foia.models import PRATemplate, State
from foia.utils import auth

@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_template(request, state_abbr):
    """Gets the user's most recent template from a requested state
    or, if that is unavailable, the user's most recent generic template.
    """
    expected_state = State.objects.filter(abbr=state_abbr)
    if not expected_state.exists():
        return Response({
            "status": 404, 
            "message": f"Could not find state with abbreviation {state_abbr}"
        }, status=status.HTTP_404_NOT_FOUND)
    expected_state = expected_state.first()
    # first try to see if the user has templates for the state
    state_templates = PRATemplate.objects.filter(
        state=expected_state,
        template_user=request.user
    ).order_by("-upload_date")
    if state_templates.exists():
        template = state_templates.first()
    # then, try to see if the user has uploaded *any* templates
    else:
        generic_template = PRATemplate.objects.filter(
            state=None,
            template_user=request.user
        ).order_by("-upload_date")
        if not generic_template.exists():
            return Response(
                {"status": 404, "message": "Could not find template"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        template = generic_template.first()
    json_template = template.template
    json_template["state"] = state_abbr
    max_resp = expected_state.maximum_response_time
    if expected_state.business_days:
        response_time = f"{max_resp} business days"
    else:
        response_time = f"{max_resp} days"
    json_template["praName"] = expected_state.public_records_act_name
    json_template["maxRespTime"] = response_time
    response = JsonResponse(json_template)
    return response