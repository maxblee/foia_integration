import re

DESC_TO_TEMPLATE = {'Requested Records': 'requestedRecords',
 'Recipient Name': 'recipientName',
 'Public Records Act Name': 'praName',
 'Expedited Processing Justification': 'expeditedProcessing',
 'Fee Waiver Justification': 'feeWaiver',
 'Maximum Response Time': 'maxRespTime',
 'Agency Name': 'agencyName',
 'Agency Street Address': 'agencyStreetAddress',
 'Agency Full Address': 'agencyFullAddress',
 'Agency Municipality': 'agencyMunicipality',
 'Agency State': 'agencyState',
 'Agency ZIP Code': 'agencyZip',
 'Subject Line': 'subject',
 'Agency Public Records Email Address': 'foiaEmail'}

TEMPLATE_TO_DESC = {v:k for k, v in DESC_TO_TEMPLATE.items()}

def encode_template(template_str: str):
    json_format = {
        "boilerplate": "",
        "template":[]
    }
    last_idx = 0
    for template_item in re.finditer(r"\{\{([\w\s]+)\}\}", template_str):
        cleaned_text = " ".join(template_item.group(1).strip().split()).title()
        if cleaned_text not in DESC_TO_TEMPLATE:
            valid_vals = ", ".join(DESC_TO_TEMPLATE.keys())
            raise KeyError(
                f"You must enter a valid template value. Valid options are: {valid_vals}"
            )
        json_format["boilerplate"] += template_str[last_idx:template_item.start()]
        template_data = {
            "text": cleaned_text,
            "field": DESC_TO_TEMPLATE[cleaned_text],
            "position": len(json_format["boilerplate"])
        }
        json_format["template"].append(template_data)
        last_idx = template_item.end()
    json_format["boilerplate"] += template_str[last_idx:]
    if not any([item["field"] == "requestedRecords" for item in json_format["template"]]):
        raise KeyError("You must put the requested records somewhere in your template.")
    return json_format
        