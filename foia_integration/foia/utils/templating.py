import base64
from email.mime.text import MIMEText
import re

from django.core.exceptions import ObjectDoesNotExist

from foia.models import PRATemplate
from foia.utils import auth

DESC_TO_TEMPLATE = {
    "Requested Records": "requestedRecords",
    "Recipient Name": "recipientName",
    "Public Records Act Name": "praName",
    "Expedited Processing Justification": "expeditedProcessing",
    "Fee Waiver Justification": "feeWaiver",
    "Maximum Response Time": "maxRespTime",
    "Agency Name": "agencyName",
    "Agency Street Address": "agencyStreetAddress",
    "Agency Full Address": "agencyFullAddress",
    "Agency Municipality": "agencyMunicipality",
    "Agency State": "agencyState",
    "Agency ZIP Code": "agencyZip",
    "Subject Line": "subject",
    "Agency Public Records Email Address": "foiaEmail",
}

TEMPLATE_TO_DESC = {v: k for k, v in DESC_TO_TEMPLATE.items()}
# map template fields to fields used in foia.models.Entity
ENTITY_MAPPING = {
    "agencyName": "name",
    "agencyStreetAddress": "street_address",
    "agencyMunicipality": "municipality",
    "agencyState": "state",
    "agencyZip": "zip_code",
    "foiaEmail": "pra_email",
}
ENTITY_MODEL_TO_FIELD = {v: k for k, v in ENTITY_MAPPING.items()}

REQUEST_MAPPING = {
    "subject": "subject_line",
    "requestedRecords": "content",
    "expeditedProcessing": "expedited_processing",
    "feeWaiver": "fee_waiver",
}
REQUEST_MODEL_TO_FIELD = {v: k for k, v in REQUEST_MAPPING.items()}

SOURCE_MAPPING = {"recipientFirstName": "first_name", "recipientLastName": "last_name"}
SOURCE_MODEL_TO_FIELD = {v: k for k, v in SOURCE_MAPPING.items()}

STATE_MAPPING = {"maxRespTime": "describe_response_time", "praName": "public_records_act_name"}

def encode_template(template_str: str):
    json_format = {"boilerplate": "", "template": []}
    last_idx = 0
    for template_item in re.finditer(r"\{\{([\w\s]+)\}\}", template_str):
        cleaned_text = " ".join(template_item.group(1).strip().split()).title()
        if cleaned_text not in DESC_TO_TEMPLATE:
            raise KeyError("You must enter a valid template value.")
        json_format["boilerplate"] += template_str[last_idx : template_item.start()]
        template_data = {
            "text": cleaned_text,
            "field": DESC_TO_TEMPLATE[cleaned_text],
            "position": len(json_format["boilerplate"]),
        }
        json_format["template"].append(template_data)
        last_idx = template_item.end()
    json_format["boilerplate"] += template_str[last_idx:]
    if not any(
        [item["field"] == "requestedRecords" for item in json_format["template"]]
    ):
        raise KeyError("You must put the requested records somewhere in your template.")
    return json_format

def get_template_from_state(user, state):
    """Given a user and a state (an actual State model),
    returns the appropriate template."""
     # first try to see if the user has templates for the state
    user_templates_for_state = PRATemplate.objects.filter(
        state=state, template_user=user
    ).order_by("-upload_date")
    if user_templates_for_state.exists():
        template = user_templates_for_state.first()
    # then, try to see if the user has uploaded *any* templates
    else:
        generic_templates = PRATemplate.objects.filter(
            state=None, template_user=user
        ).order_by("-upload_date")
        if not generic_templates.exists():
            return None
        template = generic_templates.first()
    return template

def generate_request_body(request):
    """Takes a RequestItem object and extracts the email content."""
    template = get_template_from_state(request.user, request.agency.state)
    if template is None:
        raise ObjectDoesNotExist("Could not find template for this state")
    template_content = template.template
    last_index = 0
    request_body = ""
    for tag in template_content["template"]:
        request_body += template_content["boilerplate"][last_index:tag["position"]]
        field = tag["field"]
        if field in ENTITY_MAPPING:
            field_val = getattr(request.agency, ENTITY_MAPPING[field])
        elif field in SOURCE_MAPPING:
            if hasattr(request.recipient, SOURCE_MAPPING[field]):
                field_val = getattr(request.recipient, SOURCE_MAPPING[field])
            else:
                field_val = "Public Records Officer"
        elif field in REQUEST_MAPPING:
            field_val = getattr(request.request_info, REQUEST_MAPPING[field], None)
        elif field in STATE_MAPPING:
            field_val = getattr(request.agency.state, STATE_MAPPING[field], None)
        elif field == "recipientName":
            if request.recipient is not None:
                field_val = request.recipient.full_name
            else:
                field_val = "Public Records Officer"
        request_body += field_val
        last_index = tag["position"]
    request_body += template_content["boilerplate"][last_index:]
    return request_body

def form_email(request):
    email_body = generate_request_body(request)
    message = MIMEText(email_body)
    message["to"] = request.agency.pra_email
    message["subject"] = request.request_info.subject_line
    message["from"] = request.user.email
    raw_message = {"raw": base64.urlsafe_b64encode(message.as_bytes()).decode()}
    return raw_message