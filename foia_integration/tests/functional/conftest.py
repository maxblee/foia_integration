"""General configuration (mostly shared pytest fixtures) for functional tests."""
import os

from allauth.socialaccount.models import SocialApp, SocialAccount
from django.core.management import call_command
from django.contrib.sites.models import Site
import faker
import pytest

if (
    os.environ.get("GOOGLE_APP_CLIENT") is None
    or os.environ.get("GOOGLE_APP_SECRET") is None
):
    import dotenv

    dotenv.load_dotenv()

CLIENT_ID = os.environ["GOOGLE_APP_CLIENT"]
CLIENT_SECRET = os.environ["GOOGLE_APP_SECRET"]


@pytest.fixture
def selenium(selenium):
    """Selenium browser."""
    selenium.implicitly_wait(2)
    return selenium


@pytest.fixture
def base_db():
    """Sets up a database that can be used in functional tests.

    This consists of adding state-level static data and configuring the
    Google Account.
    """
    # add state public records data
    call_command("loaddata", "foia/initial_data/pra_models.json")
    # configure site
    site = Site.objects.get(id=1)
    site.name = "localhost"
    site.domain = "127.0.0.1"
    site.save()
    # configure Google account
    google = SocialApp.objects.create(
        provider="google", name="Google API", client_id=CLIENT_ID, secret=CLIENT_SECRET
    )
    google.sites.add(site)
    google.save()


@pytest.fixture
def fake():
    """A faker Faker object, for random data generation."""
    return faker.Faker()


@pytest.fixture
def create_user(django_user_model, client, fake):
    """Creates a fake user for the test client."""
    username = fake.pystr()
    email = fake.email()
    user = django_user_model.objects.create(username=username, email=email)
    pwd = fake.pystr()
    user.set_password(pwd)
    user.save()
    return {"user": user, "username": username, "password": pwd}


@pytest.fixture
def login_client(client, create_user):
    """Generates a fake user and logs the user in."""
    client.login(username=create_user["username"], password=create_user["password"])
    return client


@pytest.fixture
def mock_google_login(client, create_user, django_user_model):
    """Mocks a Google log-in.

    This can't be used to actually run GMail's service, but it
    can allow for occasional function-based tests that
    require a GMail login but don't use the API.
    """
    user = django_user_model.objects.get(username=create_user["username"])
    SocialAccount.objects.create(provider="google", user=user, uid="fake_id")
    client.login(username=create_user["username"], password=create_user["password"])
    return client, user
