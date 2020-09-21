"""Tests the template building app at '/template-builder'."""
from urllib.parse import urljoin

import bs4
from django.urls import reverse
import pytest
from selenium.webdriver.common.keys import Keys

from foia.models import PRATemplate, State
from tests.functional.common import login_google

TEMPLATES = [
    (
        "generic",
        "Dear Public Records Officer:\nI am requesting the following records under {{Public Records Act Name}}:\n{{Requested Records}}",
        "Public Records Act Name",
    ),
    (
        "US",
        "Dear FOIA Officer:\nI am requesting the following records under the Freedom of Information Act:\n{{Requested Records}}\n{{Fee Waiver Justification}}",
        "Fee Waiver Justification",
    ),
    (
        "AZ",
        "Dear {{Recipient Name}}:\nI am requesting the following records under the Arizona Public Records Law, §39-121 et seq.:\n{{Requested Records}}",
        "Recipient Name",
    ),
]
template_path = reverse("template")


@pytest.mark.parametrize("state,language,unique_field", TEMPLATES)
def test_user_can_create_templates(
    state, language, unique_field, mock_google_login, live_server, base_db
):
    """Tests the base functionality of the templating tool: That someone who is logged in can create a template."""
    client, user = mock_google_login
    response = client.post(
        urljoin(live_server.url, template_path),
        {"state": state, "template-text": language},
    )
    assert response.status_code == 200
    expected_state = None if state == "generic" else State.objects.get(abbr=state)
    results = PRATemplate.objects.filter(template_user=user, state=expected_state)
    assert results.count() == 1
    assert unique_field in {
        item["text"] for item in results.first().template["template"]
    }


@pytest.mark.parametrize(
    "template",
    [
        "",
        "Dear Person:",
        "Dear {{Recipient Name}}",
        "Dear {{fake}}, I want {{Requested Records}}",
    ],
)
def test_template_errors(template, mock_google_login, live_server, base_db):
    """Submitting a bad form results in an error.

    These errors include submitting the form without
    specifying where requested records go, submitting it
    with a field that doesn't exist, or submitting an empty string.
    """
    client, user = mock_google_login
    response = client.post(
        urljoin(live_server.url, template_path),
        {"state": "generic", "template-text": template},
    )
    # form should fail to do anything
    assert PRATemplate.objects.filter(template_user=user, state=None).count() == 0
    response_html = bs4.BeautifulSoup(response.content, "html.parser")
    assert len(response_html.select("div.form__errors div.form__error__item")) >= 1


def test_long_input_extends_container_height(selenium, live_server, base_db):
    """If a user enters a ton of text into the template container, the container should expand in size."""
    selenium.get(urljoin(live_server.url, template_path))
    login_google(selenium, go_home=False)
    input_elem = selenium.find_element_by_id("template-input")
    start_height = input_elem.get_attribute("clientHeight")
    for _ in range(20):
        input_elem.send_keys(Keys.ENTER)
    end_height = input_elem.get_attribute("clientHeight")
    assert float(start_height) < float(end_height)


def test_entering_text_updates_preview(selenium, live_server, base_db):
    """Entering keys in text should update the preview for the test.

    Specifically: you should be able to add and delete items using keys
    or the buttons and make the input reflect that.
    """
    selenium.get(urljoin(live_server.url, template_path))
    login_google(selenium, go_home=False)
    text_input = selenium.find_element_by_id("template-input")
    # typing letters adds them to presentation field
    text_input.send_keys("Pur")
    presentation = selenium.find_element_by_css_selector(
        "#foia-template div.presentation__area"
    )
    assert presentation.text == "Pur"
    # deleting letters removes them from presentation field
    text_input.send_keys(Keys.BACKSPACE)
    text_input.send_keys(Keys.BACKSPACE)
    assert presentation.text == "P"
    # clicking on buttons adds them to presentation field + input
    selenium.find_element_by_xpath("//button[@data-field='requestedRecords']").click()
    assert presentation.text == "PRequested Records"
    assert text_input.get_attribute("value") == "P{{Requested Records}}"
    assert (
        presentation.find_element_by_css_selector("span.template__highlight").text
        == "Requested Records"
    )
    # deleting from span removes highlighted text
    text_input.send_keys(Keys.BACKSPACE)
    assert presentation.text == "P{{Requested Records}"
    assert (
        len(presentation.find_elements_by_css_selector("span.template__highlight")) == 0
    )
    # this tests the efficacy of the regular expression testing
    # (makes sure that you can have incomplete regex phrases like P{{Requested Records})
    # without screwing future things up
    selenium.find_element_by_xpath("//button[@data-field='subject']").click()
    assert presentation.text == "P{{Requested Records}Subject Line"
    highlights = presentation.find_elements_by_css_selector("span.template__highlight")
    assert len(highlights) == 1
    assert highlights[0].text == "Subject Line"
