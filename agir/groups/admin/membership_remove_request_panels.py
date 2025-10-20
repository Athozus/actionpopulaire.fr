from django.utils.html import format_html

from . import views
from .filters import SupportGroupSearchFilter
from .. import models
from django.contrib import admin

from ..models import MembershipRemoveRequest
from ...lib.admin.utils import display_link, admin_url

from django.urls import path


Status_couleur = {
    MembershipRemoveRequest.Status.AWAIT_PEER_REVIEW: "#f39c12",
    MembershipRemoveRequest.Status.AWAIT_ADMIN_REVIEW: "#DFB5FF",
    MembershipRemoveRequest.Status.DONE: "#16a460",
    MembershipRemoveRequest.Status.REFUSED: "#ff5e35",
}


@admin.register(models.MembershipRemoveRequest)
class MembershipRemoveRequestAdmin(admin.ModelAdmin):
    ordering = ("-created",)
    list_display = [
        "created",
        "resolved_date",
        "status_colored",
        "created_by",
        "person",
        "group_link",
    ]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "created",
                    "status",
                    "created_by",
                    "person",
                    "supportgroup",
                    "details",
                    "reason_type",
                    "resolved_date",
                    "request_actions",
                )
            },
        ),
    )
    readonly_fields = (
        "created",
        "created_by",
        "details",
        "supportgroup",
        "person",
        "resolved_date",
        "request_actions",
    )

    search_fields = ("created_by__search", "person__search", "supportgroup__name")

    date_hierarchy = "created"

    list_filter = ("created", SupportGroupSearchFilter, "status", "reason_type")

    @admin.display(description="Status", ordering="status")
    def status_colored(self, obj):
        return format_html(
            '<span style="padding: 3px;font-weight:bold;background-color: {};">{}</span>',
            Status_couleur[obj.status],
            MembershipRemoveRequest.Status(obj.status).label.upper(),
        )

    @admin.display(description="Groupe", ordering="supportgroup")
    def group_link(self, obj):
        return display_link(obj.supportgroup)

    @admin.display(description="Actions")
    def request_actions(self, obj):

        if not obj.status == MembershipRemoveRequest.Status.AWAIT_ADMIN_REVIEW:
            return "-"

        button = (
            "<a "
            "class='button'"
            "style='display:inline-flex;align-items:center;height:35px;background:{color};padding:0 15px;' "
            "href='{url}'>{label}</a><div class='help' style='margin: 0; padding: 0;'>"
            "Attention : cette action est définitive, vous ne pouvez pas revenir en arrière !"
            "</div>"
        )

        kwargs = {
            "label": "✖ Supprimer du groupe",
            "url": admin_url(
                "{}_{}_delete_member".format(self.opts.app_label, self.opts.model_name),
                kwargs={
                    "pk": obj.id,
                    "group_id": obj.supportgroup.id,
                    "member_id": obj.person.id,
                },
            ),
            "color": "#f45d48",
        }

        return format_html(button, **kwargs)

    def get_urls(self):
        return [
            path(
                "<uuid:pk>/delete_member/groups/<uuid:group_id>/member/<uuid:member_id>",
                self.admin_site.admin_view(self.delete_member),
                name="{}_{}_delete_member".format(
                    self.opts.app_label, self.opts.model_name
                ),
            ),
        ] + super().get_urls()

    def delete_member(self, request, pk, group_id, member_id):
        return views.delete_member_from_group(self, request, pk, group_id, member_id)

    class Media:
        pass
