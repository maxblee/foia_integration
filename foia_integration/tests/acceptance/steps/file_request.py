import os

from behave import given, when, then
from django.contrib.auth.models import User

from allauth.socialaccount.models import SocialAccount
from foia.models import PRATemplate, State, Entity
import sys; sys.path.append("..")
import browser_handling

def generate_fake_agency_info(fake, idx):
    """Generates fake information about an agency
    given a faker Faker object and an index (the idx of the recipient)
    """
    municipality = fake.city()
    # first instantiate the dictionary without the id field exactly right
    # then change
    missing_idx = {
        "recipientFirstName": fake.first_name(),
        "recipientLastName": fake.last_name(),
        "agencyName": f"City of {municipality}",
        "foiaEmail": fake.email(),
        "agencyStreetAddress": fake.street_address(),
        "agencyZip": fake.postcode(),
        "agencyMunicipality": municipality
    }
    return {f"id_{k}-{idx}": v for k, v in missing_idx.items()}

def send_agency_info(browser, agency_data):
    for field, value in agency_data.items():
        browser.find_element_by_id(field).send_keys(value)

def check_agency_info(browser, expected_data):
    for field, value in expected_data.items():
        input_item = browser.find_element_by_id(field)
        assert input_item.get_attribute("value") == value

@given("Jason is logged in through Google")
def google_login(context):
    context.browser.get("http://127.0.0.1:8000/")
    browser_handling.login_google(context.browser, go_home=True)

@given("Jason has created templates for filing requests")
def created_template(context):
    context.browser.get("http://127.0.0.1:8000/template-builder")
    context.browser.find_element_by_id("template-input").send_keys(
        """Dear {{Recipient Name}}:\r\nUnder the {{Public Records Act Name}}, I am requesting {{Requested Records}}.
        """
    )
    context.browser.find_element_by_xpath("//input[@type='submit']").click()
    context.browser.find_element_by_xpath("//option[@value='AK']").click()
    context.browser.find_element_by_id("template-input").send_keys(
        """In accordance with the Alaska Public Records Act,  AS § 40.25. 110 et seq., I am requesting {{Requested Records}}."""
    )
    context.browser.find_element_by_xpath("//input[@type='submit']").click()

@given("Jason already has agency information saved")
def save_agency_info(context):
    assert False

@when("Jason visits the request filing page")
def visit_filing_page(context):
    context.browser.get("http://127.0.0.1:8000/foia-request")
    

@when("Jason adds information about an agency")
def add_agency_info(context):
    context.agency_data = generate_fake_agency_info(context.fake, 0)
    send_agency_info(context.browser, context.agency_data)
    context.browser.find_element_by_css_selector(
        ".form__field select option[value='AK']"
    ).click()

@when("Jason adds information about the records he seeks")
def add_record_info(context):
    context.records = context.fake.sentence()
    context.browser.find_element_by_id("id_requestedRecords").send_keys(context.records)

@when("Jason starts to fill out information about the agency")
def starts_agency_fill(context):
    pass

@then("Jason should be able to add new agencies and recipients")
def can_add_agencies(context):
    check_agency_info(context.browser, context.agency_data)
    context.browser.find_element_by_id("add-0").click()
    assert len(context.browser.find_elements_by_id("recipient-1")) == 1
    check_agency_info(context.browser, context.agency_data)

@then("Jason should be able to delete agencies and recipients he added")
def can_remove_agencies(context):
    agency_2 = generate_fake_agency_info(context.fake, 1)
    send_agency_info(context.browser, agency_2)
    context.browser.find_element_by_id("delete-0").click()
    expected_data = {k.replace("-1", "-0"):v for k, v in agency_2.items()}
    check_agency_info(context.browser, expected_data)


@then("Jason should be able to preview the request")
def can_preview_request(context):
    context.browser.find_element_by_id("expand-0").click()
    preview_content = context.browser.find_element_by_id("template-0")
    import time; time.sleep(1)
    assert preview_content.text != ""
    expected_text = "In accordance with the Alaska Public Records Act,  AS § 40.25. 110 et seq., I am requesting {}.".format(
        context.records
    )
    assert preview_content.text == expected_text

@then("Jason should be able to select the agency from a dropdown menu")
def autocomplete_dropdown(context):
    pass