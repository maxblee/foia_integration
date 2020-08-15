from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from google.oauth2.credentials import Credentials
import googleapiclient.discovery
from django.http import HttpRequest
from typing import Any, Dict, Optional

def get_user_service(request: HttpRequest) -> Optional[googleapiclient.discovery.Resource]:
    """Gets a GMAIL Service object given.

    Args:
        request: A request from the initial view (whatever that is)
    Returns:
        None if the user was not authenticated or if the user was not a Google user.
    """
    if not request.user.is_authenticated:
        return None
    google_api = SocialApp.objects.get(provider="google")
    client_id = google_api.client_id
    client_secret = google_api.secret
    # need to use filter to check if exists; if the user doesn't exist
    user = SocialAccount.objects.filter(provider="google", user_id=request.user.id)
    if not user.exists():
        return None
    # NOTE: I don't believe there are cases where the user would have multiple accounts with the same provider but idk for sure
    google_user = user.first()
    social_token = SocialToken.objects.filter(app_id=google_api.id, account_id=google_user.id)
    if not social_token.exists():
        return None
    # The SocialToken is unique on account_id + usr_id
    social_token = social_token.first()
    auth_token = social_token.token
    refresh_token = social_token.token_secret
    token_url = "https://accounts.google.com/o/oauth2/token"
    scopes = ["https://mail.google.com"]
    creds = Credentials(
        auth_token, 
        refresh_token=refresh_token,
        token_uri=token_url,
        client_id=client_id, 
        client_secret=client_secret, 
        scopes=scopes
    )
    # TODO: Have better/more clear error handling for this, at least at view level
    service = googleapiclient.discovery.build("gmail", "v1", credentials=creds)
    return service, google_user.uid