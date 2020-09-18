import functools
import os
import pathlib
import shutil
import time
from urllib.parse import urljoin, urlsplit

import pytest
from django.urls import reverse
from faker import Faker
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from foia.models import Entity, Source, State, RequestItem, RequestContent
from tests.functional.common import login_google
from tests import shared

request_form = reverse("foia-request")
fake = Faker()

TMP_PATH = pathlib.Path(".")


@pytest.fixture
def mock_successful_file_upload():
    header = (
        "agencyMunicipality",
        "agencyZip",
        "agencyStreetAddress",
        "recipientFirstName",
        "recipientLastName",
        "foiaEmail",
    )
    data_choices = (
        "{{city}}",
        "{{postcode}}",
        "{{street_address}}",
        "{{first_name}}",
        "{{last_name}}",
        "{{email}}",
    )
    csv_contents = fake.csv(header=header, data_columns=data_choices, num_rows=15)
    with open(TMP_PATH / "tmp.csv", "w") as f:
        f.write(csv_contents)
    yield os.path.abspath(TMP_PATH / "tmp.csv")
    os.remove(TMP_PATH / "tmp.csv")


@pytest.fixture
def copy_mock_file(mock_successful_file_upload):
    new_file = os.path.abspath(TMP_PATH / "tmp2.csv")
    shutil.copyfile(mock_successful_file_upload, new_file)
    yield new_file
    os.remove(new_file)


@pytest.fixture
def mock_wrong_field():
    header = ("agencyMunicipality", "nonsense")
    data_choices = ("{{city}}", "{{email}}")
    csv_contents = fake.csv(header=header, data_columns=data_choices, num_rows=15)
    with open(TMP_PATH / "tmp.csv", "w") as f:
        f.write(csv_contents)
    yield os.path.abspath(TMP_PATH / "tmp.csv")
    os.remove(TMP_PATH / "tmp.csv")


def mock_template(
    browser,
    state="generic",
    message="Dear {{Recipient Name}}:\nI hereby request the following records:\n{{Requested Records}}",
):
    state_xpath = f"//*[@id='state-selection']//option[@value='{state}']"
    browser.find_element_by_xpath(state_xpath).click()
    browser.find_element_by_id("template-input").send_keys(message)
    browser.find_element_by_xpath("//input[@type='submit']").click()


def add_template_info(browser, url):
    """Uploads a template for the user."""
    browser.get(urljoin(url, request_form))
    login_google(browser, go_home=False)
    WebDriverWait(browser, 10).until(
        EC.presence_of_element_located((By.ID, "foia-template"))
    )
    mock_template(browser)


def generate_fake_agency_info(fake_gen, idx):
    """Generates fake information about an agency
    given a faker Faker object and an index (the idx of the recipient)
    """

    # first instantiate the dictionary without the id field exactly right
    # then change
    missing_idx = shared.generate_fake_foia_recipient(fake_gen)
    return {f"id_{k}-{idx}": v for k, v in missing_idx.items()}


def send_agency_info(browser, agency_data):
    for field, value in agency_data.items():
        browser.find_element_by_id(field).send_keys(value)


def check_agency_info(browser, expected_data):
    for field, value in expected_data.items():
        input_item = browser.find_element_by_id(field)
        assert input_item.get_attribute("value") == value


def test_redirected_if_no_template(selenium, live_server, base_db):
    """If a user is logged in but hasn't uploaded a template,
    they should be redirected so they can properly submit the form."""
    selenium.get(urljoin(live_server.url, request_form))
    login_google(selenium, go_home=False)
    # without wait, gets caught up before url gets to template page
    try:
        WebDriverWait(selenium, 10).until(
            EC.presence_of_element_located((By.ID, "foia-template"))
        )
    except NoSuchElementException:
        pytest.fail("Could not find template form field")
    redirect_url = urlsplit(selenium.current_url)
    assert redirect_url.path == reverse("template")
    mock_template(selenium)
    # TODO: I'd like to test to make sure the message comes across but
    # that's failing in selenium (and selenium only); likely something to do with cookies
    try:
        WebDriverWait(selenium, 10).until(
            EC.presence_of_element_located((By.ID, "foia-request-items"))
        )
    except NoSuchElementException:
        pytest.fail("Did not redirect to request form")


def test_successful_file_upload(
    selenium, live_server, base_db, mock_successful_file_upload
):
    """You should be able to add recipients by uploading a file,
    assuming you've entered appropriate fields.

    This simply tests that you can upload a file
    """
    add_template_info(selenium, live_server.url)
    csv_input = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "csv_upload"))
    )
    csv_input.send_keys(mock_successful_file_upload)
    assert len(selenium.find_elements_by_class_name("recipient__item")) == 15


def test_unsuccessful_file_upload(selenium, live_server, base_db, mock_wrong_field):
    """If you have a wrong field in your csv (not supported), you should get a rejection message."""
    add_template_info(selenium, live_server.url)
    csv_input = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "csv_upload"))
    )
    assert len(selenium.find_elements_by_class_name("recipient__item")) == 1
    csv_input.send_keys(mock_wrong_field)
    assert len(selenium.find_elements_by_class_name("recipient__item")) == 1


def test_csv_upload_field_maintenance(
    selenium, live_server, base_db, mock_successful_file_upload, copy_mock_file
):
    """Users should expect the following things when they upload a csv:

    It should not remove their existing data
    They should be able to add more data afterward
    They should be able to upload another file afterward.
    """
    # First add an agency and add existing data
    add_template_info(selenium, live_server.url)
    time.sleep(1)
    csv_input = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "csv_upload"))
    )
    first_agency = generate_fake_agency_info(fake, 0)
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "recipient-0"))
    )
    send_agency_info(selenium, first_agency)
    csv_input.send_keys(copy_mock_file)
    time.sleep(1)
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "recipient-1"))
    )
    assert len(selenium.find_elements_by_class_name("recipient__item")) == 16
    # now see if you can add an item
    add_item = selenium.find_elements_by_class_name("add__item")[-1]
    selenium.execute_script("arguments[0].scrollIntoView(true)", add_item)
    add_item.click()
    selenium.execute_script("window.scrollTo(0, document.body.scrollHeight)")
    next_agency = generate_fake_agency_info(fake, 16)
    send_agency_info(selenium, next_agency)
    assert len(selenium.find_elements_by_class_name("recipient__item")) == 17
    selenium.execute_script("arguments[0].scrollIntoView(true)", csv_input)
    # see if you can upload multiple files
    csv_input.send_keys(mock_successful_file_upload)
    time.sleep(1)
    WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "recipient-17"))
    )
    assert len(selenium.find_elements_by_class_name("recipient__item")) == 32


def test_add_and_delete_buttons(
    selenium, live_server, base_db, mock_successful_file_upload
):
    """Tests to make sure that you can add and delete items properly.

    Specifically, you should be able to add an additional item without losing your info
    You should be able to delete your item and still have the other info
    You should only be able to add the bottom item
    You should be able to delete any item except for the first (if there's only one)
    """
    add_template_info(selenium, live_server.url)
    del_selectors = functools.partial(
        selenium.find_elements_by_css_selector, ".delete__item button"
    )
    add_selectors = functools.partial(
        selenium.find_elements_by_css_selector, ".add__item button"
    )
    containers = functools.partial(
        selenium.find_elements_by_class_name, "recipient__item"
    )
    WebDriverWait(selenium, 10).until(EC.presence_of_element_located((By.ID, "add-0")))
    # at the start, there should be 1 container, 1 add button, and no delete buttons
    assert len(containers()) == 1
    assert len(del_selectors()) == 0
    assert len(add_selectors()) == 1
    # now, we'll add our initial data and make sure that's been entered
    first_agency = generate_fake_agency_info(fake, 0)
    send_agency_info(selenium, first_agency)
    check_agency_info(selenium, first_agency)
    add_selectors()[0].click()
    # our original data should still be in the same place it was
    check_agency_info(selenium, first_agency)
    # but our only add container should be at the bottom, we should have 2 containers,
    # and we should have 2 delete options
    assert len(containers()) == 2
    assert len(add_selectors()) == 1
    assert add_selectors()[0].get_attribute("id") == "add-1"
    assert len(del_selectors()) == 2
    # now, we'll add information for a second one
    second_agency = generate_fake_agency_info(fake, 1)
    send_agency_info(selenium, second_agency)
    check_agency_info(selenium, second_agency)
    # and we'll delete item number 1
    del_selectors()[0].click()
    # now, we should have 1 container, no delete containers, 1 add container,
    # and the info from the second agency should be in the first location
    assert len(containers()) == 1
    assert len(add_selectors()) == 1
    assert len(del_selectors()) == 0
    expected_data = {k.replace("-1", "-0"): v for k, v in second_agency.items()}
    check_agency_info(selenium, expected_data)


def test_can_view_preview(selenium, live_server, base_db):
    """Tests to make sure you can view the preview for a specific state.
    Additionally makes sure that when you add information, the preview updates.
    """
    add_template_info(selenium, live_server.url)
    time.sleep(1)
    WebDriverWait(selenium, 10).until(
        EC.element_to_be_clickable((By.ID, "expand-0"))
    ).click()
    expected_message = (
        "Dear Public Records Officer:\nI hereby request the following records:"
    )
    # information updates asyncronously so need wait
    time.sleep(1)
    assert selenium.find_element_by_id("template-0").text == expected_message
    agency_info = generate_fake_agency_info(fake, 0)
    send_agency_info(selenium, agency_info)
    recipient_name = f"{agency_info['id_recipientFirstName-0']} {agency_info['id_recipientLastName-0']}"
    expected_message = (
        f"Dear {recipient_name}:\nI hereby request the following records:"
    )
    assert selenium.find_element_by_id("template-0").text == expected_message
    selenium.find_element_by_id("id_requestedRecords").send_keys("Everything")
    expected_message += "\nEverything"
    assert selenium.find_element_by_id("template-0").text == expected_message


def test_preview_button_shows_different_results_by_state(
    selenium, live_server, base_db
):
    """This makes sure the button previewing the requests
    shows different previews for different states (e.g. different public
    records law names)"""
    add_template_info(selenium, live_server.url)
    selenium.get(urljoin(live_server.url, reverse("template")))
    mock_template(
        selenium,
        state="AK",
        message="Pursuant to The Alaska Public Records Act, I would like {{Requested Records}}",
    )
    selenium.get(urljoin(live_server.url, request_form))
    selenium.find_element_by_id("expand-0").click()
    time.sleep(0.3)
    generic_message = (
        "Dear Public Records Officer:\nI hereby request the following records:"
    )
    assert selenium.find_element_by_id("template-0").text == generic_message
    selenium.find_element_by_xpath(
        "//*[@id='id_agencyState-0']//option[@value='AK']"
    ).click()
    # the event only triggers on blur, so need to move out of focus
    selenium.find_element_by_id("recipient-0").click()
    time.sleep(0.3)
    ak_message = "Pursuant to The Alaska Public Records Act, I would like "
    assert selenium.find_element_by_id("template-0").text == ak_message


@pytest.mark.django_db
def test_can_autocomplete_agencies(selenium, live_server, base_db, django_user_model):
    """If you've added agencies and sources into your database,
    you should be able to add them using autocomplete."""
    add_template_info(selenium, live_server.url)
    agency_info = generate_fake_agency_info(fake, 0)
    agency_name = agency_info["id_agencyName-0"]
    entity_object = Entity.objects.create(
        user=django_user_model.objects.first(),
        name=agency_name,
        street_address=agency_info["id_agencyStreetAddress-0"],
        municipality=agency_info["id_agencyMunicipality-0"],
        state=fake.random_element(State.objects.all()),
        zip_code=agency_info["id_agencyZip-0"],
        pra_email=agency_info["id_foiaEmail-0"],
    )
    Source.objects.create(
        user=django_user_model.objects.first(),
        first_name=agency_info["id_recipientFirstName-0"],
        last_name=agency_info["id_recipientLastName-0"],
        entity=entity_object,
        is_records_officer=True,
    )
    name_elem = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "id_agencyName-0"))
    )
    # idk why i also have to add time here; guessing it should be something other than presence_of_element
    time.sleep(1)
    # just send the first letter of the name; should be enough
    name_elem.send_keys(agency_name[:1])
    name_elem.send_keys(Keys.DOWN)
    name_elem.send_keys(Keys.ENTER)
    missing_recipient = {k: v for k, v in agency_info.items() if "recipient" not in k}
    check_agency_info(selenium, missing_recipient)
    first_name = WebDriverWait(selenium, 10).until(
        EC.presence_of_element_located((By.ID, "id_recipientFirstName-0"))
    )
    first_name.send_keys(Keys.DOWN)
    first_name.send_keys(Keys.ENTER)
    check_agency_info(selenium, agency_info)


def test_can_save_request(selenium, live_server, base_db, django_user_model):
    """After filling out a form, you should be able to save a
    record of it (without sending the requests)."""
    add_template_info(selenium, live_server.url)
    agency_info = generate_fake_agency_info(fake, 0)
    time.sleep(1)
    request = {"subject": "Example request", "content": "All your data"}
    selenium.find_element_by_id("id_subject-line").send_keys(request["subject"])
    selenium.find_element_by_id("id_requestedRecords").send_keys(request["content"])
    send_agency_info(selenium, agency_info)
    selenium.find_element_by_id("id_save-requests").click()
    WebDriverWait(selenium, 10).until(EC.url_changes(live_server.url))
    time.sleep(1)
    assert Entity.objects.count() == 1
    assert Source.objects.count() == 1
    assert RequestContent.objects.count() == 1
    assert RequestItem.objects.count() == 1


def test_save_submission_errors(selenium, live_server, base_db):
    """If you try submitting the form but have an error (e.g. a missing required field)
    you should not be able to submit the form, but you should also get
    to keep your data."""
    add_template_info(selenium, live_server.url)
    # have to have explicit timer because god forbid selenium's wait functions actually work
    time.sleep(1)
    WebDriverWait(selenium, 10).until(
        EC.element_to_be_clickable((By.ID, "id_save-requests"))
    ).click()
    time.sleep(0.3)
    form_errors = selenium.find_elements_by_class_name("form__error__item")
    assert len(form_errors) == 4
    expected_errors = [
        "Subject",
        "Records Sought",
        "Agency Name",
        "Public Records Email",
    ]
    for form_error, field in zip(form_errors, expected_errors):
        assert form_error.find_element_by_xpath("ancestor::label").text.startswith(
            field
        )


def test_can_submit_request(selenium, live_server, base_db):
    """You should be able to actually submit the request."""
    pytest.fail()
