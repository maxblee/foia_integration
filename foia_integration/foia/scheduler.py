import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.executors.pool import ProcessPoolExecutor, ThreadPoolExecutor
from django_apscheduler.jobstores import register_events

from django.conf import settings

scheduler = BackgroundScheduler(settings.SCHEDULER_CONFIG)

def start():
    if settings.DEBUG:
        logging.basicConfig()
        logging.getLogger("apscheduler").setLevel(logging.DEBUG)
    
    register_events(scheduler)

    scheduler.start()
    print("Launching scheduler")