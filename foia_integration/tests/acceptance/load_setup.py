import django
from dotenv import load_dotenv

def setup():
    django.setup()
    load_dotenv()