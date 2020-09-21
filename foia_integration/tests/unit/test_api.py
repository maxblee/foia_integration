"""Unit tests of the API."""
import json
import os

from allauth.socialaccount.models import SocialApp, SocialAccount
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.test import APITestCase
from rest_framework import status
from faker import Faker

from foia.utils import templating
from foia.models import PRATemplate, State, Entity, RequestContent, RequestItem, Source
from tests import shared

if (
    os.environ.get("GOOGLE_APP_CLIENT") is None
    or os.environ.get("GOOGLE_APP_SECRET") is None
):
    import dotenv

    dotenv.load_dotenv()

CLIENT_ID = os.environ["GOOGLE_APP_CLIENT"]
CLIENT_SECRET = os.environ["GOOGLE_APP_SECRET"]


class FoiaAPITestCase(APITestCase):
    """A base class used by all of the API tests."""

    fixtures = ["foia/initial_data/pra_models.json"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fake = Faker()

    def setUp(self):
        """Creates a SocialApp application linking to Google."""
        SocialApp.objects.create(
            provider="google",
            name="Google API",
            client_id=CLIENT_ID,
            secret=CLIENT_SECRET,
        )

    def setupUser(self, link_google=False):
        """Sets up a user, optionally logging them into a fake Google account.

        Args:
            link_google: True if you want to link the user to a Google account.
        """
        username = "sample_user"
        self.user = User.objects.create(username=username, email="example@example.com")
        pwd = "test_password"
        self.user.set_password(pwd)
        self.user.save()
        if link_google:
            self.setupGoogle()
        self.client.login(username=username, password=pwd)

    def setupGoogle(self):
        """Sets up a Google account for a user."""
        if not hasattr(self, "user"):
            self.setupUser(link_google=True)
        SocialAccount.objects.create(provider="google", user=self.user, uid="fake_id")


def create_template(user, state=None):
    """Creates a public records request template."""
    template = {
        "boilerplate": "I want ",
        "template": [
            {"text": "Requested Records", "field": "requestedRecords", "position": 7}
        ],
    }
    state = State.objects.get(abbr=state) if state is not None else state
    return PRATemplate.objects.create(
        template_user=user, state=state, template=template
    )


class TemplateTestCase(FoiaAPITestCase):
    """Tests the API calls related to filing a FOIA request."""

    def create_template(self, state=None):
        """A thin wrapper over `create_template`."""
        return create_template(self.user, state=state)

    def test_forbidden_if_not_logged_in(self):
        """Makes sure that people who are not logged in can't access template-based APIs."""
        response = self.client.get("/api/current-user/template/AK")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_unk_state_produces_404(self):
        """Test that passing in a state abbreviation that doesn't exist produces a 404 error."""
        self.setupUser()
        response = self.client.get("/api/current-user/template/ZZ")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_known_no_template_produces_404(self):
        """Tests that you get a 404 error if you haven't passed in a template."""
        self.setupUser()
        response = self.client.get("/api/current-user/template/AZ")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_generic_template_passes(self):
        """Creating a generic template should allow users to retrieve templates for state requests."""
        self.setupUser()
        generic_template = self.create_template()
        response = self.client.get("/api/current-user/template/VA")
        assert response.status_code == status.HTTP_200_OK
        expected_result = generic_template.template
        expected_result.update(
            {
                "praName": "Virginia Freedom of Information Act",
                "maxRespTime": "I look forward to hearing from you within 5 business days.",
                "state": "VA",
            }
        )
        # response comes as string; have to parse it to dict
        assert json.loads(response.content) == expected_result

    def test_state_template_passes(self):
        """Tests the state template."""
        self.setupUser()
        state_template = self.create_template(state="CA")
        response = self.client.get("/api/current-user/template/CA")
        assert response.status_code == status.HTTP_200_OK
        expected_result = state_template.template
        expected_result.update(
            {
                "praName": "California Public Records Act",
                "maxRespTime": "I look forward to hearing from you within 10 days.",
                "state": "CA",
            }
        )
        assert json.loads(response.content) == expected_result


class AgencyTestCase(FoiaAPITestCase):
    """Tests the agency autocomplete API."""

    def add_agencies(self):
        """Adds 20 fake agencies to the test client database."""
        self.setupUser()
        for _ in range(20):
            municipality = self.fake.city()
            name = f"City of {municipality}"
            street_address = self.fake.street_address()
            zip_code = self.fake.postcode()
            pra_email = self.fake.email()
            state = self.fake.random_element(State.objects.all())
            if not Entity.objects.filter(
                Q(name=name) | Q(pra_email=pra_email)
            ).exists():
                Entity.objects.get_or_create(
                    user=self.user,
                    name=name,
                    municipality=municipality,
                    street_address=street_address,
                    zip_code=zip_code,
                    pra_email=pra_email,
                    state=state,
                )

    def test_login_required(self):
        """Makes sure login is required for autocomplete API."""
        response = self.client.get("/api/current-user/autocomplete/agencies")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_noquery_fails(self):
        """Makes sure you have to pass data to the autocomplete agency API."""
        self.add_agencies()
        response = self.client.get(
            "/api/current-user/autocomplete/agencies", {"field": "agencyName"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_no_agency_fails(self):
        """Makes sure you need to pass an agency parameter to autocomplete API."""
        self.add_agencies()
        response = self.client.get(
            "/api/current-user/autocomplete/agencies", {"q": "city"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_wrong_agency_field_fails(self):
        """Makes sure you have to pass an existing field into the autocomplete API."""
        self.add_agencies()
        response = self.client.get(
            "/api/current-user/autocomplete/agencies",
            {"field": "nonsense", "q": "city"},
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_agency_fields_succeed(self):
        """Tests a successful autocomplete request."""
        self.add_agencies()
        field_mapping = {
            k: v for k, v in templating.ENTITY_MAPPING.items() if v != "state"
        }
        sample_response = Entity.objects.values(*field_mapping.values()).first()
        expected_json = {
            field: sample_response[field_mapping[field]] for field in field_mapping
        }
        # add in this field (which isn't part of query)
        expected_json["agencyState"] = Entity.objects.get(
            pra_email=expected_json["foiaEmail"]
        ).state.abbr
        for field in field_mapping.keys():
            response = self.client.get(
                "/api/current-user/autocomplete/agencies",
                {"q": sample_response[field_mapping[field]], "field": field},
            )
            # some of these will have empty responses but that's ok
            assert response.status_code == status.HTTP_200_OK
            json_content = response.json()
            assert all(
                [
                    x in json_content
                    for x in ("results", "queryField", "query", "numResults")
                ]
            )
            assert expected_json in json_content["results"]


class SourceAgencyRequest(FoiaAPITestCase):
    """Tests the API call that gets public records sources for an entity."""

    def setUpEntity(self):
        """Sets up a fake entity."""
        recipient = shared.generate_fake_foia_recipient(self.fake)
        recipient["agencyState"] = self.fake.random_element(State.objects.all()).abbr
        entity_dict = {v: recipient[k] for k, v in templating.ENTITY_MAPPING.items()}
        entity_dict["state"] = State.objects.get(abbr=entity_dict["state"])
        entity = Entity.objects.create(user=self.user, **entity_dict)
        return entity

    def setUpSource(self, entity, is_records_officer=True):
        """Sets up a fake source.

        Args:
            entity: An Entity object.
            is_records_officer: Whether the source is a records officer.
        """
        recipient = shared.generate_fake_foia_recipient(self.fake)
        return Source.objects.create(
            user=self.user,
            entity=entity,
            first_name=recipient["recipientFirstName"],
            last_name=recipient["recipientLastName"],
            is_records_officer=is_records_officer,
        )

    def send_get(self, params):
        """Runs a GET method no the autocomplete sources API."""
        url = "/api/current-user/autocomplete/sources"
        return self.client.get(url, params)

    def test_sources_bad_request(self):
        """Makes sure if you don't have agency parameter, url fails."""
        self.setupUser()
        no_params = self.send_get({})
        assert no_params.status_code == status.HTTP_400_BAD_REQUEST
        bad_params = self.send_get({"bad_param": "not good"})
        assert bad_params.status_code == status.HTTP_400_BAD_REQUEST

    def test_sources_request(self):
        """Tests successful sources autocomplete API."""
        self.setupUser()
        first_entity = self.setUpEntity()
        resp = self.send_get({"agency": first_entity.pra_email})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["numResults"] == 0
        self.setUpSource(first_entity)
        resp = self.send_get({"agency": first_entity.pra_email})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["numResults"] == 1
        self.setUpSource(first_entity)
        resp = self.send_get({"agency": first_entity.pra_email})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["numResults"] == 2
        self.setUpSource(first_entity, is_records_officer=False)
        resp = self.send_get({"agency": first_entity.pra_email})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["numResults"] == 2


class FoiaRequestTestCase(FoiaAPITestCase):
    """Tests the API for filing/saving FOIA Requests."""

    def build_post_data(self, request=None, recipients=None):
        """Builds data for client.post.

        Both request and recipients will be set to defaults
        if set to None.

        Args:
            request: The requestContent value of the POST request
            recipients: The recipientContent of the POST request
        """
        if request is None:
            request = {k: "" for k in templating.REQUEST_MAPPING}
        if recipients is None:
            recipients = [{k: "" for k in templating.ENTITY_MAPPING}]
            # agency state required to be set (otherwise will get an error)
            recipients[0]["agencyState"] = "US"
            recipients[0].update({k: "" for k in templating.SOURCE_MAPPING})
        return json.dumps(
            {
                "recipientContent": recipients,
                "requestContent": request,
                "numItems": len(recipients),
            }
        )

    def send_post(self, post_data, post_type="save"):
        """Sends the POST request."""
        url = f"/api/current-user/foia/{post_type}"
        return self.client.post(url, post_data, content_type="application/json")

    def generate_recipient(self):
        """Generates a fake recipient for the request."""
        recipient = shared.generate_fake_foia_recipient(self.fake)
        recipient["agencyState"] = self.fake.random_element(State.objects.all()).abbr
        return recipient

    def valid_request(self):
        """A mock (valid) public records requestContent object."""
        return {
            "subject": "Example Requests",
            "requestedRecords": "Everything",
            "expeditedProcessing": "",
            "feeWaiver": "",
        }

    def test_api_requires_google(self):
        """Makes sure you need a Google login to use the API."""
        post_data = self.build_post_data()
        no_login = self.send_post(post_data)
        assert no_login.status_code == status.HTTP_403_FORBIDDEN
        self.setupUser()
        no_google = self.send_post(post_data)
        assert no_google.status_code == status.HTTP_403_FORBIDDEN
        self.setupGoogle()
        logged_in = self.send_post(post_data)
        assert logged_in.status_code == status.HTTP_200_OK

    def test_blank_form_causes_submission_error(self):
        """Makes sure submitting a blank FOIA request form raises errors."""
        post_data = self.build_post_data()
        self.setupUser(link_google=True)
        response = self.send_post(post_data).data
        assert response["status"] == "error"
        request_errors = frozenset(response["requestErrors"].keys())
        assert request_errors == frozenset({"subject", "requestedRecords"})
        recipient_errors = frozenset(response["recipientErrors"][0].keys())
        assert recipient_errors == frozenset({"foiaEmail", "agencyName"})

    def check_results(self, recipient, request):
        """A generic method for validating a particular request."""
        agency = Entity.objects.get(pra_email=recipient["foiaEmail"])
        source = Source.objects.get(
            entity=agency,
            first_name=recipient["recipientFirstName"],
            last_name=recipient["recipientLastName"],
        )
        request_info = RequestContent.objects.get(
            subject_line=request["subject"], content=request["requestedRecords"]
        )
        request = RequestItem.objects.filter(
            request_info=request_info, agency=agency, recipient=source
        )
        assert request.exists()
        return request.first()

    def test_sending_form_creates_new_records(self):
        """The save request option should create a database records of a new request."""
        self.setupUser(link_google=True)
        assert Entity.objects.count() == 0
        recipient = self.generate_recipient()
        request = self.valid_request()
        post_data = self.build_post_data(request, [recipient])
        response = self.send_post(post_data).data
        assert response["status"] == "ok"
        assert Entity.objects.count() == 1
        assert Source.objects.count() == 1
        assert RequestContent.objects.count() == 1
        assert RequestItem.objects.count() == 1
        self.check_results(recipient, request)

    def test_sending_multiple_recipients_saves_multiple_requests(self):
        """If you send multiple recipients through the form, you should create multiple RequestItems."""
        self.setupUser(link_google=True)
        recipients = [self.generate_recipient(), self.generate_recipient()]
        request = self.valid_request()
        post_data = self.build_post_data(request, recipients)
        response = self.send_post(post_data).data
        assert response["status"] == "ok"
        assert Entity.objects.count() == 2
        assert Source.objects.count() == 2
        assert RequestContent.objects.count() == 1
        assert RequestItem.objects.count() == 2
        for recipient in recipients:
            self.check_results(recipient, request)

    def test_successful_entity_but_source_error(self):
        """If you have an entity that exists but have an error in the form submission, you should get specified source errors."""
        self.setupUser(link_google=True)
        recipient = self.generate_recipient()
        # first name is required
        recipient["recipientFirstName"] = ""
        request = self.valid_request()
        post_data = self.build_post_data(request, [recipient])
        response = self.send_post(post_data).data
        assert response["status"] == "error"
        assert response["requestErrors"] == {}
        expected_error = frozenset({"recipientFirstName"})
        assert frozenset(response["recipientErrors"][0].keys()) == expected_error

    def test_existing_entity(self):
        """Searching for an existing entity should save a record to the existing entity."""
        self.setupUser(link_google=True)
        recipient = self.generate_recipient()
        entity_dict = {v: recipient[k] for k, v in templating.ENTITY_MAPPING.items()}
        entity_dict["state"] = State.objects.get(abbr=entity_dict["state"])
        entity = Entity.objects.create(user=self.user, **entity_dict)
        Source.objects.create(
            user=self.user,
            entity=entity,
            first_name=recipient["recipientFirstName"],
            last_name=recipient["recipientLastName"],
        )
        request = self.valid_request()
        post_data = self.build_post_data(request, [recipient])
        response = self.send_post(post_data).data
        assert response["status"] == "ok"
        created_request = self.check_results(recipient, request)
        assert created_request.agency == entity

    def test_nonexistent_entity_but_existing_source(self):
        """If the entity is nonexistent for some reason, the source should be nonexistent + you should get helpful messages about the source errors."""
        self.setupUser(link_google=True)
        recipient = self.generate_recipient()
        for field in ["recipientFirstName", "foiaEmail"]:
            recipient[field] = ""
        request = self.valid_request()
        post_data = self.build_post_data(request, [recipient])
        response = self.send_post(post_data).data
        assert response["status"] == "error"
        error_fields = frozenset({"recipientFirstName", "foiaEmail"})
        assert frozenset(response["recipientErrors"][0].keys()) == error_fields

    def test_bad_request(self):
        """Bad requests should return 400 errors."""
        self.setupUser(link_google=True)
        blank_request = json.loads(self.build_post_data())
        bogus_formatting = [
            ["apple"],
            "not even json",
            {"nonsense": "yup"},
        ]
        for formatting_error in bogus_formatting:
            format_prob = self.send_post(json.dumps(formatting_error))
            assert format_prob.status_code == status.HTTP_400_BAD_REQUEST
        num_items_string = blank_request.copy()
        num_items_string["numItems"] = "not a number"
        num_items_formatting = self.send_post(json.dumps(num_items_string))
        assert num_items_formatting.status_code == status.HTTP_400_BAD_REQUEST
        num_items_negative = blank_request.copy()
        num_items_negative["numItems"] = -1
        negative_items = self.send_post(json.dumps(num_items_negative))
        assert negative_items.status_code == status.HTTP_400_BAD_REQUEST

        good_recipient = self.generate_recipient()
        good_request = self.valid_request()

        bad_requests = [
            {"bad request": "i know"},
            [good_request.copy()],
            {k: 1 for k in good_request},
        ]
        bad_recipients = [
            # should be a list
            self.generate_recipient(),
            [bad_requests[0].copy()],
            [self.generate_recipient(), ["apple"]],
            [{k: 1 for k in self.generate_recipient()}],
        ]
        for recipient in bad_recipients:
            post_data = self.build_post_data(good_request, recipient)
            response = self.send_post(post_data)
            assert response.status_code == status.HTTP_400_BAD_REQUEST
        for request in bad_requests:
            post_data = self.build_post_data(request, [good_recipient])
            response = self.send_post(post_data)
            assert response.status_code == status.HTTP_400_BAD_REQUEST
