from datetime import timedelta

from agir.lib.models import TimeStampedModel
from django.contrib.gis.db import models
from django.utils import timezone


def get_default_end_date():
    return timedelta(hours=2) + timezone.now()


class SMSDiffusion(TimeStampedModel):
    start_date = models.DateTimeField(
        "Date d'envoie",
        help_text="Date à laquelle les messages vont commencer à être envoyé.",
        default=timezone.now,
        blank=True,
    )
    end_date = models.DateTimeField(
        verbose_name="Date de fin de l'envoi",
        help_text="Date maximale d'envoie, utile pour de grand segment, ne pas toucher si vous êtes pas sûre.",
        null=True,
        blank=True,
        default=get_default_end_date,
    )

    segment = models.ForeignKey(
        to="mailing.Segment",
        on_delete=models.CASCADE,
        related_name="smsdiffusion_segment",
        related_query_name="notification",
        null=True,
        blank=True,
        help_text="Segment auquel ce message sera envoyé.",
    )

    test_segment = models.ForeignKey(
        to="mailing.Segment",
        verbose_name="Segment",
        on_delete=models.SET_NULL,
        related_name="+",
        related_query_name="+",
        null=True,
        blank=True,
        help_text="Segment des personnes pour tester le SMS",
    )

    title = models.CharField(
        verbose_name="Titre",
        max_length=200,
        blank=False,
    )

    message = models.TextField(
        verbose_name="Message",
        max_length=500,
        help_text="SMS à envoyer",
        blank=False,
    )
    creator = models.ForeignKey(
        "people.Person",
        verbose_name="Créateur·ice",
        on_delete=models.SET_NULL,
        related_name="smsdiffusion_person",
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"Diffusion {self.title}"

    # used to know if the Diffusion has been created with SFR remote service
    broadcast_id = models.IntegerField(default=0, verbose_name="Identifiant SFR")

    class Meta:
        verbose_name = "SMS Diffusion"
        verbose_name_plural = "SMS Diffusion"
