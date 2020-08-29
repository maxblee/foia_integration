import json

from django.test import Client, TestCase
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.test import APITestCase
from rest_framework import status
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from faker import Faker

from foia.models import PRATemplate, State, Entity

class FoiaAPITestCase(APITestCase):
    """A base class used by all of the API tests."""
    fixtures = ["foia/initial_data/pra_models.json"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fake = Faker()

    def setupUser(self):
        username = "sample_user"
        self.user = User.objects.create(
            username=username,
            email="example@example.com"
        )
        pwd = "test_password"
        self.user.set_password(pwd)
        self.user.save()
        self.client.login(username=username,password=pwd)

def create_template(user, state=None):
    template = {
            "boilerplate": "I want ",
            "template": [{
                "text": "Requested Records", 
                "field": "requestedRecords",
                "position": 7
            }]
        }
    state = State.objects.get(abbr=state) if state is not None else state
    return PRATemplate.objects.create(
        template_user=user,
        state=state,
        template=template
    )

class TemplateTestCase(FoiaAPITestCase):
    """Tests the API calls related to filing a FOIA request."""

    def create_template(self, state=None):
        return create_template(self.user, state=state)

    def test_forbidden_if_not_logged_in(self):
        response = self.client.get("/api/current-user/template/AK")
        self.assertEqual(
            response.status_code, 
            status.HTTP_403_FORBIDDEN
        )

    def test_unk_state_produces_404(self):
        """Test that passing in a state abbreviation that doesn't
        exist produces a 404 error.
        """
        self.setupUser()
        response = self.client.get("/api/current-user/template/ZZ")
        self.assertEqual(
            response.status_code, 
            status.HTTP_404_NOT_FOUND
        )

    def test_known_no_template_produces_404(self):
        self.setupUser()
        response = self.client.get("/api/current-user/template/AZ")
        self.assertEqual(
            response.status_code, 
            status.HTTP_404_NOT_FOUND
        )

    def test_generic_template_passes(self):
        self.setupUser()
        generic_template = self.create_template()
        response = self.client.get("/api/current-user/template/VA")
        self.assertEqual(
            response.status_code, 
            status.HTTP_200_OK
        )
        expected_result = generic_template.template
        expected_result.update({
            "praName": "Virginia Freedom of Information Act",
            "maxRespTime": "5 business days",
            "state": "VA"
        })
        # response comes as string; have to parse it to dict
        self.assertEqual(json.loads(response.content), expected_result)

    def test_state_template_passes(self):
        self.setupUser()
        state_template = self.create_template(state="VA")
        response = self.client.get("/api/current-user/template/VA")
        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        expected_result = state_template.template
        expected_result.update({
            "praName": "Virginia Freedom of Information Act",
            "maxRespTime": "5 business days",
            "state": "VA"
        })
        self.assertEqual(json.loads(response.content), expected_result)

class AgencyTestCase(FoiaAPITestCase):
    def add_agencies(self):
        self.setupUser()
        for _ in range(20):
            municipality = self.fake.city()
            name = f"City of {municipality}"
            street_address = self.fake.street_address()
            zip_code = self.fake.postcode()
            pra_email = self.fake.email()
            if not Entity.objects.filter(
                Q(name=name) | Q(pra_email=pra_email)
            ).exists():
                Entity.objects.get_or_create(
                    user=self.user,
                    name=name,
                    municipality=municipality,
                    street_address=street_address,
                    zip_code=zip_code,
                    pra_email=pra_email
                )

    def test_login_required(self):
        response = self.client.get("/api/current-user/autocomplete/agencies")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_noquery_fails(self):
        self.add_agencies()
        response = self.client.get("/api/current-user/autocomplete/agencies", {"field": "agencyName"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_no_agency_fails(self):
        self.add_agencies()
        response = self.client.get("/api/current-user/autocomplete/agencies", {"q": "city"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_wrong_agency_field_fails(self):
        self.add_agencies()
        response = self.client.get("/api/current-user/autocomplete/agencies", {"field": "nonsense", "q":"city"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_agency_fields_succeed(self):
        self.add_agencies()
        field_mapping = {
            "agencyName":"name", 
            "foiaEmail":"pra_email", 
            "agencyStreetAddress":"street_address", 
            "agencyZip":"zip_code", 
            "agencyMunicipality":"municipality"
        }
        sample_response = Entity.objects.values(*field_mapping.values()).first()
        expected_json = {
            field: sample_response[field_mapping[field]] 
            for field in field_mapping
        }
        # add in this field (which isn't part of query)
        expected_json["agencyState"] = None
        for field in field_mapping.keys():
            response = self.client.get(
                "/api/current-user/autocomplete/agencies",
                {"q": sample_response[field_mapping[field]], "field": field}
            )
            # some of these will have empty responses but that's ok
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            json_content = response.json()
            self.assertTrue(all([x in json_content for x in ("results", "queryField", "query", "numResults")]))
            self.assertIn(expected_json, json_content["results"])
