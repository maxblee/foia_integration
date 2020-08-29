from django.urls import path, re_path
from . import views, api

urlpatterns = [
    path("", views.app_index, name="index"),
    path("template-builder", views.template_render, name="template"),
    path("foia-request", views.file_requests, name="foia-request"),
    # API Calls
    re_path(r"^api/current-user/states$", api.get_states),
    re_path(r"^api/current-user/template/(?P<state_abbr>[A-Za-z]{2})$", api.get_template),
    # autocomplete
    re_path(r"^api/current-user/autocomplete/agencies$", api.agency_by_name)
]
