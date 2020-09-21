"""Handles `apscheduler` configuration for `foia`.

This deals with setting up settings to be able to schedule
requests.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import register_events

from django.conf import settings

scheduler = BackgroundScheduler(settings.SCHEDULER_CONFIG)


def start():
    """Starts the scheduler."""
    if settings.DEBUG:
        logging.basicConfig()
        logging.getLogger("apscheduler").setLevel(logging.DEBUG)

    register_events(scheduler)

    scheduler.start()
    print("Launching scheduler")
