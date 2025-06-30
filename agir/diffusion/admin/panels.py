from datetime import timedelta

from django.utils import timezone

from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import path
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.timezone import get_current_timezone

from agir.diffusion.admin.actions import (
    trigger_diffusion,
    update_diffusion,
    get_diffusion_informations,
    create_dmc_diffusion_with_segment,
)
from agir.diffusion.admin.views import segment_sms_people_size, diffusion_status
from agir.diffusion.models import SMSDiffusion
from django.contrib import messages

from agir.lib.sms import SMSException
from agir.lib.sms.common import SfrStatusCode

STOP_SUBSCRIBE = "STOP au <#shortcode#>"

import logging

logger = logging.getLogger(__name__)


@admin.register(SMSDiffusion)
class SMSDiffusionAdmin(admin.ModelAdmin):
    list_display = ["title", "start_date", "status", "segment", "creator"]
    readonly_fields = (
        "created",
        "modified",
        "creator",
        "segment_size",
        "test_recipient_size",
        "test_action_button",
        "actions_button",
        "info",
        "creator",
        "broadcast_id",
    )
    fieldsets = (
        (
            "Paramètre du message",
            {
                "fields": (
                    "title",
                    "sender",
                    "message",
                )
            },
        ),
        (
            "Paramètres de test",
            {
                "fields": (
                    "test_segment",
                    "test_recipient_size",
                    "test_action_button",
                )
            },
        ),
        (
            "Paramètre d'envoi",
            {
                "fields": (
                    "segment",
                    "segment_size",
                    "start_date",
                    "end_date",
                    "actions_button",
                )
            },
        ),
        (
            "Paramètre SFR",
            {
                "fields": (
                    "info",
                    "broadcast_id",
                )
            },
        ),
    )
    autocomplete_fields = ("segment", "test_segment")

    @admin.display(description="Nombre de personne qui vont reçevoir le SMS de test")
    def test_recipient_size(self, obj: SMSDiffusion):
        if not obj or not obj.pk:
            return "-"
        return self.display_segment_size(
            obj.pk, obj.test_segment.id if obj.test_segment else None, True
        )

    @admin.display(description="Actions de test")
    def test_action_button(self, obj: SMSDiffusion):
        if not obj or not obj.pk or not obj.test_segment:
            return "-"

        return format_html(
            "<input type='submit' "
            "name='_send_test' "
            "class='action-test'"
            "style='border-radius:8px;background:#571aff;font-weight:bold;' "
            "value='💬 &ensp;{}' />",
            "Envoyer",
        )

    def get_info(self, obj: SMSDiffusion):
        if not obj or not obj.pk or not obj.broadcast_id:
            return None
        try:
            self.informations = get_diffusion_informations(obj)
        except SMSException:
            logger.error(f"Cannot fetch diffusion {obj.id}")
            return None
        return self.informations

    @admin.display(description="Status")
    def status(self, obj: SMSDiffusion):
        if not obj or not obj.pk:
            return "-"

        return mark_safe(
            f"""
                <span id="diffusion-status-{obj.id}" 
                      hx-get="/admin/diffusion/smsdiffusion/{obj.id}/status/" 
                      hx-trigger="load"
                      hx-swap="innerHTML">
                      Chargement..
                </span>
            """
        )

    @admin.display(description="Informations")
    def info(self, obj: SMSDiffusion):
        current_info = self.get_info(obj)
        if current_info is None:
            return "-"

        return format_html(
            "<p>État : <b>{}</b></p><p>Détails : {}</p>",
            SfrStatusCode[current_info["statusCode"]].value,
            current_info,
        )

    @admin.display(description="Actions")
    def actions_button(self, obj: SMSDiffusion):
        if not obj or not obj.pk:
            return "-"

        current_info = self.get_info(obj)
        if current_info:
            status_code = current_info["statusCode"]
            if (
                status_code == SfrStatusCode.BR_FINISHED.name
                or status_code == SfrStatusCode.BR_RUNNING.name
                or status_code == SfrStatusCode.BR_LOADING.name
                or status_code == SfrStatusCode.BR_STOPPED.name
                or status_code == SfrStatusCode.BR_STOP_BEING.name
            ):
                return "-"

        return (
            (
                format_html(
                    "<input type='submit' "
                    "name='_program' "
                    "class='action'"
                    "style='border-radius:8px;background:#571aff;font-weight:bold;' "
                    "value='🗓️ &ensp;{}' />",
                    "Programmer",
                )
                if not obj.broadcast_id
                else format_html(
                    "<span>Envoi programmé pour le <b>{}</b> !</span><br /><br />",
                    obj.start_date.astimezone(get_current_timezone()).strftime(
                        "%d/%m/%Y à %HH%M"
                    ),
                )
            )
            + format_html(
                " <input type='submit' "
                "name='_send' "
                "class='action'"
                "style='border-radius:8px;background:#571aff;font-weight:bold;' "
                "value='💬 &ensp;{}' />",
                "Envoyer maintenant !",
            )
            + format_html(
                "<div class='help' style='margin: 4px 0 0; padding: 0;'>"
                "Attention : cliquer sur ces boutons recharge la page sans sauvegarder vos modifications courantes."
                "<br />"
                "</div>"
            )
        )

    @admin.display(description="Nombre de personnes ciblées")
    def segment_size(self, obj):
        if not obj or not obj.pk:
            return "-"

        return self.display_segment_size(
            obj.pk, obj.segment.id if obj.segment else None
        )

    def display_segment_size(self, diffusion_id, segment_id, test=False):
        if segment_id is None:
            return "Vous devez d'abord sélectionner un segment pour estimer le nombre de personne."

        return mark_safe(
            f"""
                <span id="segment-size{'-test' if test else ''}" 
                      hx-get="/admin/diffusion/smsdiffusion/{diffusion_id}/segment/{segment_id}/size/" 
                      hx-trigger="load"
                      hx-swap="innerHTML">
                      Chargement..
                </span>
            """
        )

    def get_urls(self):
        return [
            path(
                "<int:pk>/segment/<int:segment_id>/size/",
                segment_sms_people_size,
                name="{}_{}_segment_size".format(
                    self.opts.app_label, self.opts.model_name
                ),
            ),
            path(
                "<int:pk>/status/",
                diffusion_status,
                name="{}_{}_status".format(self.opts.app_label, self.opts.model_name),
            ),
        ] + super().get_urls()

    def save_model(self, request, obj, form, change):
        obj.creator = request.user.person
        obj.end_date = obj.start_date + timedelta(days=1)
        obj.save()

    def send_test(self, request, obj: SMSDiffusion):
        obj.start_date = timezone.now()
        obj.end_date = timezone.now() + timedelta(hours=1)
        obj.title = f"TEST - {obj.title}"
        broadcast_id = create_dmc_diffusion_with_segment(obj, obj.test_segment)
        trigger_diffusion(broadcast_id)
        messages.add_message(
            request, messages.INFO, "Message envoyé au segment de test !"
        )
        return HttpResponseRedirect(".")

    def send(self, request, obj: SMSDiffusion):
        obj.start_date = timezone.now()
        obj.end_date = timezone.now() + timedelta(hours=2)
        obj.save()
        if not obj.broadcast_id:
            broadcast_id = create_dmc_diffusion_with_segment(obj, obj.segment)
            trigger_diffusion(broadcast_id)
            obj.broadcast_id = broadcast_id
            obj.save()
        else:
            update_diffusion(obj)

        messages.add_message(
            request=request,
            level=messages.INFO,
            message="Le sms est en cours d'envoie !",
        )
        return HttpResponseRedirect(".")

    def program(self, request, obj: SMSDiffusion):
        messages.add_message(
            request, messages.INFO, "Le message a bien été programmé !"
        )
        broadcast_id = create_dmc_diffusion_with_segment(obj, obj.segment)
        obj.broadcast_id = broadcast_id
        trigger_diffusion(obj.broadcast_id)
        obj.save()
        return HttpResponseRedirect(".")

    def response_change(self, request, obj: SMSDiffusion):
        has_stop_code = STOP_SUBSCRIBE in obj.message

        try:
            if "_program" in request.POST and has_stop_code:
                return self.program(request, obj)
            if "_send_test" in request.POST and has_stop_code:
                return self.send_test(request, obj)
            if "_send" in request.POST and has_stop_code:
                return self.send(request, obj)
        except Exception as e:
            messages.add_message(
                request=request,
                level=messages.WARNING,
                message=str(e),
            )
            return HttpResponseRedirect(".")

        if not has_stop_code:
            messages.add_message(
                request=request,
                level=messages.WARNING,
                message="Vous devez ajouter le shortcode STOP au message avant de pouvoir l'envoyer !",
            )

        return super().response_change(request, obj)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.prefetch_related("creator__emails", "test_segment", "segment")

    class Media:
        js = ("admin/js/diffusion.js",)
