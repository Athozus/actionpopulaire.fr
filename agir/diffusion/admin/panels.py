import time
from datetime import timedelta

from django.utils import timezone

from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import path
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.timezone import make_aware, get_current_timezone

from agir.diffusion.admin.actions import (
    create_diffusion_with_segment,
    trigger_diffusion,
    update_diffusion,
    get_diffusion_informations,
)
from agir.diffusion.admin.views import segment_sms_people_size
from agir.diffusion.models import SMSDiffusion
from django.contrib import messages

from agir.lib.sms.common import SfrStatusCode

STOP_SUBSCRIBE = "STOP au <#shortcode#>"


@admin.register(SMSDiffusion)
class SMSDiffusionAdmin(admin.ModelAdmin):
    list_display = ["title", "start_date", "segment", "creator"]
    readonly_fields = (
        "created",
        "modified",
        "creator",
        "segment_size",
        "program",
        "info",
        "creator",
        "broadcast_id",
    )
    fields = (
        "title",
        "message",
        "segment",
        "segment_size",
        "start_date",
        "program",
        "info",
        "broadcast_id",
    )
    autocomplete_fields = ("segment",)

    @admin.display(description="Informations")
    def info(self, obj: SMSDiffusion):
        if not obj or not obj.pk or not obj.broadcast_id:
            return "-"
        result = get_diffusion_informations(obj)
        return format_html(
            "<p>État : <b>{}</b></p><p>Détails : {}</p>",
            SfrStatusCode[result["statusCode"]].value,
            result,
        )

    @admin.display(description="Actions")
    def program(self, obj: SMSDiffusion):
        if not obj or not obj.pk:
            return "-"

        if obj.broadcast_id:
            info = get_diffusion_informations(obj)
            status_code = info["statusCode"]
            if (
                status_code == SfrStatusCode.BR_FINISHED.name
                or status_code == SfrStatusCode.BR_RUNNING.name
            ):
                return "-"

        return (
            (
                format_html(
                    "<input type='submit' "
                    "name='_program' "
                    "style='border-radius:8px;background:#571aff;font-weight:bold;' "
                    "value='💬 &ensp;{}' />",
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

        if obj.segment is None:
            return "Vous devez d'abord sélectionner un segment pour estimer le nombre de personne."

        return mark_safe(
            f"""
                <span id="segment-size" 
                      hx-get="/admin/diffusion/smsdiffusion/{obj.id}/segment/size/" 
                      hx-trigger="load"
                      hx-swap="innerHTML">
                      Chargement..
                </span>
            """
        )

    def get_urls(self):
        return [
            path(
                "<int:pk>/segment/size/",
                segment_sms_people_size,
                name="{}_{}_segment_size".format(
                    self.opts.app_label, self.opts.model_name
                ),
            ),
        ] + super().get_urls()

    def save_model(self, request, obj, form, change):
        obj.creator = request.user.person
        obj.end_date = obj.start_date + timedelta(days=1)
        obj.save()

    def response_change(self, request, obj: SMSDiffusion):
        has_stop_code = STOP_SUBSCRIBE in obj.message

        if "_program" in request.POST and has_stop_code:
            messages.add_message(
                request, messages.INFO, "Le message a bien été programmé !"
            )
            create_diffusion_with_segment(obj)
            # wait to be sure diffusion created with contacts
            time.sleep(1)
            trigger_diffusion(obj)
            return HttpResponseRedirect(".")

        if "_send" in request.POST and has_stop_code:
            try:
                obj.start_date = timezone.now()
                obj.end_date = timezone.now() + timedelta(days=1)
                obj.save()
                if not obj.broadcast_id:
                    create_diffusion_with_segment(obj)
                else:
                    update_diffusion(obj)
                trigger_diffusion(obj)
                messages.add_message(
                    request=request,
                    level=messages.INFO,
                    message="Le sms va bien être envoyé !",
                )
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

    class Media:
        js = ("admin/js/diffusion.js",)
