from django.http import JsonResponse, Http404
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response

from foia.models import PRATemplate, State, Entity
from foia.utils import auth, common_queries
from foia.utils.templating import TEMPLATE_TO_DESC

@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_states(request):
    """Returns a list of states ordered mostly by abbreviation."""
    return JsonResponse({"states":common_queries.order_states()})

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

# Entity autocomplete API
def find_valid_entities(request):
    # prefetch state objects for performance later
    return Entity.objects.select_related("state").filter(
        user=request.user,
        is_agency=True
    ).exclude(pra_email__isnull=True).exclude(
        pra_email__exact=""
    )

def agencies_from_results(filtered_agencies, **kwargs):
    """Returns a list of matching agencies, plus additional values."""
    value_results = filtered_agencies.values(
        "name", 
        "street_address",
        "municipality",
        "state__abbr",
        "zip_code",
        "pra_email"
    )
    agencies = [
        {
            "agencyName": k["name"],
            "agencyStreetAddress": k["street_address"],
            "agencyMunicipality": k["municipality"],
            "agencyState": k["state__abbr"],
            "agencyZip": k["zip_code"],
            "foiaEmail": k["pra_email"]
        }
        for k in value_results
    ]
    json_res = {"results": agencies}
    json_res.update(kwargs)
    return json_res

@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def agency_by_name(request):
    """Finds a list of agencies by the starting characters of
    a name."""
    params = request.query_params
    field_mapping = {
        "agencyName": "name",
        "foiaEmail": "pra_email",
        "agencyStreetAddress": "street_address",
        "agencyZip": "zip_code",
        "agencyMunicipality": "municipality"
    }
    if 'q' in params and 'field' in params and params["field"] in field_mapping:
        lookup = f"{field_mapping[params['field']]}__istartswith"
        query = {lookup: params["q"]}
        valid_agencies = find_valid_entities(request).filter(**query)
        results = agencies_from_results(
            valid_agencies,
            queryField=TEMPLATE_TO_DESC[params["field"]],
            query=params["q"],
            numResults=valid_agencies.count()
        )
        return Response(results)
    return Response({
        "status": 400,
        "message": f"Invalid query. Must pass 'q' and 'field' parameters with valid values."
    }, status=status.HTTP_404_NOT_FOUND)
    