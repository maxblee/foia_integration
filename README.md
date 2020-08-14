## Notes
https://requests-oauthlib.readthedocs.io/en/latest/oauth2_workflow.html
https://stackoverflow.com/questions/30278892/django-allauth-get-credentials-to-make-further-requests-on-behalf-of-the-user

Here's the code, minus handling of refresh tokens

```python
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from google.oauth2.credentials import Credentials
import googleapiclient

def get_api_results(request):
    google_api = SocialApp.objects.get(provider="google")
    client_id = google_api.client_id
    client_secret = google_api.secret
    # need to use filter to check if exists
    user = SocialAccount.objects.filter(provider="google", user_id=request.user.id)
    if user.exists():
        # NOTE: I don't believe there are cases where the user would have multiple accounts with the same provider but idk for sure
        google_user = user.first()
        # The SocialToken is unique on account_id + usr_id
        # However, this should have error handling to handle cases where the user has an account with the provider but doesn't have a token
        social_token = SocialToken.objects.get(app_id=google_api.id, account_id=google_user.id)
        auth_token = social_token.token
        refresh_token = social_token.token_secret
        token_url = "https://accounts.google.com/o/oauth2/token"
        scopes = ["https://mail.google.com"]
        # TODO: Figure out how to get that damn redirect
        creds = Credentials(
            auth_token, 
            refresh_token=refresh_token,
            token_uri=token_url,
            client_id=client_id, 
            client_secret=client_secret, 
            scopes=scopes
        )
        service = googleapiclient.discovery.build("gmail", "v1", credentials=creds)
        return service
```