"""This is a set of tools and mappings for handling template-filling.

The mappings are designed for a few purposes. `DESC_TO_TEMPLATE`
is build to map things from human-readable names for the web app
to names that can easily be parsed as JSON (e.g. "Requested Records" to "requestedRecords").

The other maps are built to convert from JSON files and Javascript
objects that are used in front-facing web apps into field names
that can be parsed in `models.py`.

In addition, the module has a number of functions designed to fill
in templates with values.
"""
import base64
from email.mime.text import MIMEText
import re

from django.core.exceptions import ObjectDoesNotExist

from foia.models import PRATemplate

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

STATE_MAPPING = {
    "maxRespTime": "describe_response_time",
    "praName": "public_records_act_name",
}


def encode_template(template_str):
    """Converts a string template from /template-builder to a JSON object.

    This JSON object is ultimately used as the template record
    in the PRATemplate model.

    Args:
        template_str: A string template (the literal text of the textarea
        in /template-builder)

    Returns:
        A dictionary in the following form:
        {
            "boilerplate": "Text that appears in every request",
            "template": [
                {
                    "text": "The human-readable name of the field (e.g. "Requested Records"),
                    "field": "The machine name of the field (e.g. "requestedRecords"),
                    "position": "The index of the boilerplate where this field should go."
                }
            ]
        }

    Raises:
        KeyError: If one or more fields does not exist or if the template
        does not include a slot for the requested records.
    """
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
    """Returns the template for a user in a given state.

    This corresponds to the most recent template the user created
    *in that state* or, if the user has not created any templates
    for that state, the most recent generic template the user created.

    Args:
        user: The Django user model
        state: A State from `models.py`.

    Returns:
        A `PRATemplate` object
    """
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
    """Takes a RequestItem object and returns the text of the email.

    Args:
        request: A RequestItem object
    Returns:
        The string text of the email body.
    """
    template = get_template_from_state(request.user, request.agency.state)
    if template is None:
        raise ObjectDoesNotExist("Could not find template for this state")
    template_content = template.template
    last_index = 0
    request_body = ""
    for tag in template_content["template"]:
        request_body += template_content["boilerplate"][last_index : tag["position"]]
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
    """Forms a MIME email message from a request.

    Args:
        request: A RequestItem object.

    Returns:
        An email object, formatted to be used by GMAIL's API.
    """
    email_body = generate_request_body(request)
    message = MIMEText(email_body)
    pra_name = request.agency.state.public_records_act_name
    message["to"] = request.agency.pra_email
    message["subject"] = f"{pra_name} Request: {request.request_info.subject_line}"
    message["from"] = request.user.email
    raw_message = {"raw": base64.urlsafe_b64encode(message.as_bytes()).decode()}
    return raw_message
