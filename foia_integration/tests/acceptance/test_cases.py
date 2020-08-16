import os

from django.test import TestCase
from allauth.socialaccount.models import SocialApp
from dotenv import load_dotenv
from django.contrib.sites.models import Site

load_dotenv()


class GoogleAuthTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        # must create Google app in order to do any testing of it
        # `get_user_service` also fails if you don't do this
        # because it assumes that you've linked the site to Google
        client_id = os.environ["GOOGLE_APP_CLIENT"]
        client_secret = os.environ["GOOGLE_APP_SECRET"]
        google_api = SocialApp.objects.create(
            provider="google",
            name="Google API",
            client_id=client_id,
            secret=client_secret,
        )
        google_api.save()