from django.apps import AppConfig
from django.conf import settings

class FoiaConfig(AppConfig):
    name = "foia"

    def ready(self):
        from foia import scheduler
        if settings.SCHEDULER_AUTOSTART:
            scheduler.start()