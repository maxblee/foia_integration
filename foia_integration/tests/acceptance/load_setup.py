import django
from dotenv import load_dotenv

def setup():
    load_dotenv()
    django.setup()
