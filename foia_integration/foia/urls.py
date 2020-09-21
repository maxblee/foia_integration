"""URLS for the FOIA path.

This includes HTML views (listed first) and API views.
"""
from django.urls import path, re_path
from . import views, api

urlpatterns = [
    path("", views.app_index, name="index"),
    path("template-builder", views.template_render, name="template"),
    path("foia-request", views.file_requests, name="foia-request"),
    # API Calls
    re_path(r"^api/current-user/states$", api.get_states),
    # get a user's template (if any) given the state
    re_path(
        r"^api/current-user/template/(?P<state_abbr>[A-Za-z]{2})$", api.get_template
    ),
    re_path(
        r"^api/current-user/foia/(?P<req_type>(?:send|save|schedule))$",
        api.send_requests,
    ),
    # autocomplete
    re_path(r"^api/current-user/autocomplete/agencies$", api.agency_by_name),
    re_path(r"api/current-user/autocomplete/sources$", api.sources_by_agency),
]
