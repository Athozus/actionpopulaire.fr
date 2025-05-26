from agir.groups.admin import MembershipRemoveRequestAdmin
from django.db.models import Q
from django.http import HttpResponseForbidden
from numpy.lib.utils import source
from rest_framework.generics import (
    CreateAPIView,
    RetrieveAPIView,
    ListAPIView,
    UpdateAPIView,
)
from rest_framework import serializers
from django.urls import resolve

from agir.authentication.view_mixins import (
    HardLoginRequiredMixin,
)
from agir.groups.models import MembershipRemoveRequest
from agir.groups.models import SupportGroup
from agir.groups.tasks import (
    send_notifications_remove_request_referent,
    send_email_remove_request_ga,
)
from agir.lib.http import HttpResponseUnauthorized
from agir.people.models import Person
from agir.lib.rest_framework_permissions import (
    GlobalOrObjectPermissions,
    IsPersonPermission,
)

__all__ = [
    "MembershipRemoveRequestCreateAPIView",
    "MembershipRemoveRequestDetailAPIView",
    "MembershipRemoveRequestListAPIView",
    "MembershipRemoveRequestUpdateAPIView",
]

from weasyprint.css.validation.properties import other_colors


class MembershipRemoveRequestSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    supportgroupId = serializers.PrimaryKeyRelatedField(
        source="supportgroup",
        label="Groupe d'action",
        queryset=SupportGroup.objects.all(),
    )
    personId = serializers.PrimaryKeyRelatedField(
        source="person", label="Membre", queryset=Person.objects.all(), write_only=True
    )
    person = serializers.SerializerMethodField(read_only=True)
    reason = serializers.CharField(
        source="reason_type", label="Raison", allow_null=False, allow_blank=False
    )
    creator = serializers.CharField(
        source="created_by.id", label="Createur.ice", read_only=True
    )

    def get_person(self, instance):
        if instance.person is not None:
            return {
                "id": instance.person.id,
                "displayName": instance.person.display_name,
                "firstName": instance.person.first_name,
            }

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user.person
        return super().create(validated_data)

    class Meta:
        model = MembershipRemoveRequest
        partial = True
        fields = [
            "id",
            "supportgroupId",
            "personId",
            "details",
            "person",
            "reason",
            "status",
            "creator",
        ]


class MembershipRemoveRequestPermissions(GlobalOrObjectPermissions):
    perms_map = {"OPTIONS": [], "GET": [], "POST": [], "PATCH": []}
    object_perms_map = {
        "OPTIONS": [],
        "GET": ["groups.view_membership_remove_request"],
        "POST": ["groups.add_membership_remove_request"],
        "PATCH": ["groups.validate_membership_remove_request"],
    }


class MembershipRemoveRequestUpdateAPIView(UpdateAPIView):
    queryset = MembershipRemoveRequest.objects.exclude(
        status__exact=MembershipRemoveRequest.Status.DONE
    )
    model = MembershipRemoveRequest
    permission_classes = (IsPersonPermission, MembershipRemoveRequestPermissions)
    serializer_class = MembershipRemoveRequestSerializer

    def patch(self, request, *args, **kwargs):
        # we only allow patch to validate the request from the other referent

        current_url = resolve(request.path_info).url_name
        current_remove_request = self.get_object()

        if request.user == current_remove_request.created_by:
            return HttpResponseForbidden()

        if (
            current_remove_request.status
            == MembershipRemoveRequest.Status.AWAIT_PEER_REVIEW
        ):
            if current_url.endswith("validate"):
                request.data["status"] = (
                    MembershipRemoveRequest.Status.AWAIT_ADMIN_REVIEW
                )
                send_email_remove_request_ga.delay(current_remove_request.id)
            elif current_url.endswith("refuse"):
                request.data["status"] = MembershipRemoveRequest.Status.REFUSED
            return super().partial_update(request, *args, **kwargs)
        return HttpResponseForbidden()


class MembershipRemoveRequestCreateAPIView(CreateAPIView, UpdateAPIView):
    permission_classes = (IsPersonPermission, MembershipRemoveRequestPermissions)
    queryset = MembershipRemoveRequest.objects.all()
    model = MembershipRemoveRequest
    serializer_class = MembershipRemoveRequestSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        current_group = SupportGroup.objects.get(
            pk=self.request.data.get("supportgroupId")
        )
        other_referent = [
            p for p in current_group.referents if p != instance.created_by
        ]
        if len(other_referent) > 0:
            send_notifications_remove_request_referent.delay(
                other_referent[0].id, current_group.id, instance.id
            )


class MembershipRemoveRequestListAPIView(ListAPIView, HardLoginRequiredMixin):
    permission_classes = (IsPersonPermission,)
    model = MembershipRemoveRequest
    serializer_class = MembershipRemoveRequestSerializer
    permission_classes = (IsPersonPermission, MembershipRemoveRequestPermissions)

    def get_queryset(self):
        return (
            MembershipRemoveRequest.objects.filter(
                supportgroup__id=self.kwargs.get("pk")
            )
            .select_related("person")
            .exclude(
                status__in=[
                    MembershipRemoveRequest.Status.DONE,
                    MembershipRemoveRequest.Status.REFUSED,
                ]
            )
        )


class MembershipRemoveRequestDetailAPIView(RetrieveAPIView, HardLoginRequiredMixin):
    queryset = MembershipRemoveRequest.objects.all()
    model = MembershipRemoveRequest
    serializer_class = MembershipRemoveRequestSerializer
    permission_classes = (IsPersonPermission, MembershipRemoveRequestPermissions)

    def get_queryset(self):
        return MembershipRemoveRequest.objects.select_related("person").exclude(
            status__in=[
                MembershipRemoveRequest.Status.DONE,
                MembershipRemoveRequest.Status.REFUSED,
            ]
        )
