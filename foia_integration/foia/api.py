import collections
import logging
import time

from django.core.exceptions import ValidationError
from django.forms import model_to_dict
from django.http import JsonResponse
from django.utils import timezone
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response

from foia.scheduler import scheduler
from foia.models import PRATemplate, State, Entity, Source, RequestContent, RequestItem, GMailContact
from foia.utils import auth, common_queries, templating

logger = logging.getLogger("foia_send")
logger.setLevel(logging.DEBUG)
fh = logging.FileHandler("reports/foia_sending.log")
fh.setLevel(logging.DEBUG)
logger.addHandler(fh)


# for creating sources, etc and marking whether they're new (need to be saved)
entity_item = collections.namedtuple("entity_item", "entity newly_created")


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_states(request):
    """Returns a list of states ordered mostly by abbreviation."""
    return JsonResponse({"states": common_queries.order_states()})


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def get_template(request, state_abbr):
    """Gets the user's most recent template from a requested state
    or, if that is unavailable, the user's most recent generic template.
    """
    expected_state = State.objects.filter(abbr=state_abbr)
    if not expected_state.exists():
        return Response(
            {
                "status": 404,
                "message": f"Could not find state with abbreviation {state_abbr}",
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    expected_state = expected_state.first()
    template = templating.get_template_from_state(request.user, expected_state)
    if template is None:
        return Response(
                {"status": 404, "message": "Could not find template"},
                status=status.HTTP_404_NOT_FOUND,
            )
    json_template = template.template
    json_template["maxRespTime"] = expected_state.describe_response_time
    json_template["praName"] = expected_state.public_records_act_name
    json_template["state"] = expected_state.abbr
    response = JsonResponse(json_template)
    return response


# Entity autocomplete API
def find_valid_entities(request):
    # prefetch state objects for performance later
    return (
        Entity.objects.select_related("state")
        .filter(user=request.user, is_agency=True)
        .exclude(pra_email__isnull=True)
        .exclude(pra_email__exact="")
    )


def agencies_from_results(filtered_agencies, **kwargs):
    """Returns a list of matching agencies, plus additional values."""
    value_results = filtered_agencies.values(
        "name", "street_address", "municipality", "state__abbr", "zip_code", "pra_email"
    )
    agencies = [
        {
            "agencyName": k["name"],
            "agencyStreetAddress": k["street_address"],
            "agencyMunicipality": k["municipality"],
            "agencyState": k["state__abbr"],
            "agencyZip": k["zip_code"],
            "foiaEmail": k["pra_email"],
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
        "agencyMunicipality": "municipality",
    }
    if "q" in params and "field" in params and params["field"] in field_mapping:
        lookup = f"{field_mapping[params['field']]}__istartswith"
        query = {lookup: params["q"]}
        valid_agencies = find_valid_entities(request).filter(**query)
        results = agencies_from_results(
            valid_agencies,
            queryField=templating.TEMPLATE_TO_DESC[params["field"]],
            query=params["q"],
            numResults=valid_agencies.count(),
        )
        return Response(results)
    return Response(
        {
            "status": 400,
            "message": "Invalid query. Must pass 'q' and 'field' parameters with valid values.",
        },
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["GET"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([IsAuthenticated])
def sources_by_agency(request):
    """Finds a list of sources from an agency email address."""
    params = request.query_params
    if "agency" not in params:
        return Response(
            {
                "status": 400,
                "message": "You must pass an agency email using the 'agency' param",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    source_entity = Entity.objects.filter(user=request.user, pra_email=params["agency"])
    if not source_entity.exists():
        return Response(
            {"status": 404, "message": "Could not find matching agency"},
            status=status.HTTP_404_NOT_FOUND,
        )
    # sorted by email which is unique
    source_entity = source_entity.first()
    sources = Source.objects.filter(
        entity=source_entity, is_records_officer=True, user=request.user
    )
    source_results = [
        {
            "name": source.full_name,
            "firstName": source.first_name,
            "lastName": source.last_name,
            "unique": source.unique_representation,
        }
        for source in sources
    ]
    return Response(
        {
            "results": source_results,
            "numResults": sources.count(),
            "agencyEmail": params["agency"],
        }
    )


@api_view(["POST"])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@permission_classes([auth.GooglePermission])
def send_requests(request, req_type):
    data = request.data
    if not _foia_request_is_valid_format(data):
        return Response(
            {"status": "error", "message": "Data was not formatted properly"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    agencies, sources, recipient_errors = _get_recipients(
        data["recipientContent"], data["numItems"], request.user
    )
    request_info, request_errors = _get_request_content(
        data["requestContent"], request.user
    )
    if _request_is_valid(recipient_errors, request_errors):
        _save_requests(request_info, agencies, sources, request.user)
    else:
        recipient_error_mapping = {
            **templating.SOURCE_MODEL_TO_FIELD,
            **templating.ENTITY_MODEL_TO_FIELD,
        }
        request_error_dict = {
            templating.REQUEST_MODEL_TO_FIELD[k]: v for k, v in request_errors.items()
        }
        recipient_error_dict = [
            {recipient_error_mapping[k]: v for k, v in recipient_error.items()}
            for recipient_error in recipient_errors
        ]
        return Response(
            {
                "status": "error",
                "requestErrors": request_error_dict,
                "recipientErrors": recipient_error_dict,
            }
        )
    if req_type == "send":
        scheduler.add_job(file_requests, "date", args=[request, request_info.requestitem_set.all()])
    return Response({"status": "ok",})

def file_requests(user, pra_requests):
    """Sends the public records requests that you just saved."""
    service, uid = auth.get_user_service(user)
    for request_item in pra_requests:
        raw_message = templating.form_email(request_item)
        sent_message = (
            service.users()
            .messages()
            .send(userId=uid, body=raw_message)
            .execute()
        )
        if "error" in sent_message:
            logger.error(f"{timezone.now()}\n{sent_message}\n\n")
        else:
            request_item.request_sent = True
            request_item.save()
            GMailContact.objects.create(
                user=user,
                contact_type=GMailContact.UserRole.USER_INITIATED,
                contact_method=GMailContact.ContactMethod.EMAIL,
                related_request=request_item,
                thread_id=sent_message["threadId"]
            )
            # reduce likelihood of rate limiting
            time.sleep(0.5)

def _foia_request_is_valid_format(data):
    recipient_mapping = set(templating.SOURCE_MAPPING.keys()) | set(
        templating.ENTITY_MAPPING.keys()
    )
    if not isinstance(data, dict):
        return False
    if frozenset(data.keys()) != frozenset(
        {"recipientContent", "numItems", "requestContent"}
    ):
        return False
    if not isinstance(data["numItems"], int):
        return False
    if data["numItems"] < 0:
        return False
    if not isinstance(data["requestContent"], dict):
        return False
    if frozenset(data["requestContent"].keys()) != frozenset(
        templating.REQUEST_MAPPING.keys()
    ):
        return False
    if not all([isinstance(val, str) for val in data["requestContent"].values()]):
        return False
    if not isinstance(data["recipientContent"], list):
        return False
    if not all([isinstance(item, dict) for item in data["recipientContent"]]):
        return False
    if not all(
        [set(item.keys()) == recipient_mapping for item in data["recipientContent"]]
    ):
        return False
    if not all(
        [
            all([isinstance(item, str) for item in recipient.values()])
            for recipient in data["recipientContent"]
        ]
    ):
        return False
    return True


def _save_requests(request_content, agencies, sources, user):
    request_content.save()
    for agency, source in zip(agencies, sources):
        if agency.newly_created:
            agency.entity.save()
        if source is not None and source.newly_created:
            source_entity = Source.objects.create(
                user=user,
                entity=agency.entity,
                is_records_officer=True,
                **source.entity,
            )
            source = entity_item(source_entity, source.newly_created)
        source_obj = source.entity if source is not None else source
        RequestItem.objects.create(
            user=user,
            request_info=request_content,
            agency=agency.entity,
            recipient=source_obj,
        )


def _request_is_valid(recipient_errors, request_errors):
    """Determines whether form items were properly submitted
    for the request form."""
    # first check to see if any of the recipient data is invalid
    if not all([recipient == {} for recipient in recipient_errors]):
        return False
    return request_errors == {}


def _get_request_content(request_info, user):
    """Generate a request model for the user."""
    request_fields = {
        val: request_info[key] for key, val in templating.REQUEST_MAPPING.items()
    }
    try:
        request_record = RequestContent(user=user, **request_fields)
        request_record.full_clean()
        errors = {}
    except ValidationError as e:
        errors = e.message_dict
        request_record = None
    return request_record, errors


def _get_recipients(recipient_info, num_items, user):
    entities = []
    sources = []
    errors = []
    # creating this object to prevent us from having to save an existing entity
    for i in range(num_items):
        agency_errors = {}
        agency_dict = {
            value: recipient_info[i][key]
            for key, value in templating.ENTITY_MAPPING.items()
        }
        agency_dict["user"] = user
        state = State.objects.get(abbr=agency_dict["state"])
        agency_dict["state"] = state
        # this model isn't required in general but is obviously needed for sending requests
        sel_agency, entity_errors = _get_agency_from_dict(agency_dict)
        agency_errors.update(entity_errors)
        sel_source, source_errors = _get_source_from_info(
            recipient_info[i]["recipientFirstName"],
            recipient_info[i]["recipientLastName"],
            sel_agency,
            user,
        )
        agency_errors.update(source_errors)
        entities.append(sel_agency)
        sources.append(sel_source)
        errors.append(agency_errors)
    return entities, sources, errors


def _get_agency_from_dict(agency_dict):
    """Returns an Optional[get_entity] object based on the value of
    the agency."""
    agency_errors = {}
    # Entity doesn't require pra_email field but it's needed to send emails obv
    if agency_dict["pra_email"] == "":
        agency_errors["pra_email"] = ["This field cannot be blank"]
    email_exists = Entity.objects.filter(pra_email=agency_dict["pra_email"])
    if email_exists.exists():
        sel_entity = entity_item(entity=email_exists.first(), newly_created=False)
    else:
        try_entity = Entity(**agency_dict)
        try:
            try_entity.full_clean()
            sel_entity = entity_item(entity=try_entity, newly_created=True)
        except ValidationError as e:
            agency_errors.update(e.message_dict)
            sel_entity = None
    # need to set entity to none if it validates but pra_email doesn't exist
    sel_entity = sel_entity if agency_errors == {} else None
    return sel_entity, agency_errors


def _get_source_from_info(first_name, last_name, rel_entity, user):
    """Takes a dictionary of first and last name and a
    related entity object (from _get_entity_from_dict)
    and returns a source entity_item or None."""
    source_errors = {}
    if first_name == "" and last_name == "":
        sel_source = None
    elif rel_entity is not None:
        source_obj = Source(
            entity=rel_entity.entity,
            first_name=first_name,
            last_name=last_name,
            user=user,
        )
        model_source_dict = model_to_dict(
            source_obj, fields=["entity", "first_name", "last_name"]
        )
        source_filter = Source.objects.filter(**model_source_dict)
        # need both guards because it's possible you have
        # a source unaffiliated with an entity with same name
        if rel_entity.newly_created or not source_filter.exists():
            try:
                source_obj.full_clean()
                # send back to dict because entity has not been created
                source_dict = model_to_dict(
                    source_obj, fields=["first_name", "last_name"]
                )
                sel_source = entity_item(entity=source_dict, newly_created=True)
            except ValidationError as e:
                source_errors.update(e.message_dict)
                sel_source = None
        else:
            sel_source = entity_item(entity=source_filter.first(), newly_created=False)
    else:
        sel_source = None
        try:
            Source(user=user, first_name=first_name, last_name=last_name).full_clean()
        except ValidationError as e:
            source_errors.update(e.message_dict)
    return sel_source, source_errors
