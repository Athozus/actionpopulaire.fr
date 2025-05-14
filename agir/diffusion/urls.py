from django.urls import path

from .views import api

urlpatterns = [
    path("api/diffusion/sms/stop", api.PushCraView.as_view(), name="api_sms_stop")
]
