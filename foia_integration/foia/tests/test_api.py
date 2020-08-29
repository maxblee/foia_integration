import json

from django.test import Client, TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken

from foia.models import PRATemplate, State

class FoiaAPITestCase(APITestCase):
    """A base class used by all of the API tests."""
    fixtures = ["foia/initial_data/pra_models.json"]

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

class FileRequestTest(FoiaAPITestCase):
    """Tests the API calls related to filing a FOIA request."""

    def create_template(self, state=None):
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
            template_user=self.user,
            state=state,
            template=template
        )

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
