"""The core configuration for the FOIA App."""
from django.apps import AppConfig
from django.conf import settings


class FoiaConfig(AppConfig):
    """Configuration object for the FOIA App."""

    name = "foia"

    def ready(self):
        """When the App launches, starts a scheduler."""
        from foia import scheduler
        scheduler.start()
