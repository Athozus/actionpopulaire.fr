from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from slugify import slugify

from agir.api import settings
from agir.lib.models import BaseAPIResource, DescriptionMixin, DescriptionField
from django.db import models

__all__ = ["BannerAnnouncement", "AnnouncementAnswer"]


class AnnouncementActivity(BaseAPIResource):
    STATE_DISPLAYED = "D"
    STATE_CLOSED = "C"
    STATE_CHOICES = (
        (STATE_DISPLAYED, "Présentée au destinataire"),
        (STATE_CLOSED, "Le destinataire a fermé l'annonce"),
    )
    banner_announcement = models.ForeignKey(
        "BannerAnnouncement",
        blank=False,
        related_name="activities",
        on_delete=models.CASCADE,
    )
    person = models.ForeignKey("people.person", blank=False, on_delete=models.CASCADE)
    state = models.CharField(
        "Etat", max_length=1, choices=STATE_CHOICES, default=STATE_DISPLAYED
    )

    class Meta:
        indexes = (
            models.Index(
                fields=("person", "banner_announcement"),
                name="banner_announcement_person",
            ),
        )
        constraints = [
            models.UniqueConstraint(
                fields=["person", "banner_announcement"],
                name="unique_person_banner_announcement",
            ),
        ]


class AnnouncementAnswer(models.Model):
    name = models.CharField(max_length=50, unique=True, blank=False)

    class Meta:
        verbose_name = "Réponse - Bannière d'annonce"
        verbose_name_plural = "Réponses - Bannières d'annonce"

    def __str__(self):
        return self.name


class BannerAnnouncementAnswerTag(models.Model):
    answer = models.ForeignKey(
        to="AnnouncementAnswer",
        related_name="answer",
        blank=False,
        on_delete=models.CASCADE,
    )
    tag = models.ForeignKey(
        to="people.PersonTag",
        related_name="banner_announcement_answer_persontag",
        blank=False,
        on_delete=models.CASCADE,
    )


class BannerAnnouncement(BaseAPIResource, DescriptionMixin):
    title = models.CharField(
        verbose_name="Titre de l'annonce",
        max_length=200,
        help_text="Ce texte sera utilisé comme titre de l'annonce",
        blank=False,
    )

    question = models.CharField(
        verbose_name="Question",
        max_length=200,
        help_text="Question présentée aux militant·es",
        blank=True,
    )

    answers = models.ManyToManyField(
        "AnnouncementAnswer",
        verbose_name="Réponses",
        related_name="answers",
        blank=True,
        help_text="Chaque personne répondant sera associé au tag correspondant.",
    )

    associated_answers_tags = models.ManyToManyField(
        "BannerAnnouncementAnswerTag",
        related_name="banner_announcement_persontag",
        blank=True,
        help_text="Tags associés",
    )

    after_message = DescriptionField(
        _("Note après avoir répondu"),
        allowed_tags=settings.ADMIN_ALLOWED_TAGS,
        help_text=_("Note montrée à l'utilisateur une fois la question répondue."),
    )

    start_date = models.DateTimeField(
        verbose_name="Date de début", default=timezone.now
    )
    end_date = models.DateTimeField(verbose_name="Date de fin", null=True, blank=True)

    segment = models.ForeignKey(
        to="mailing.Segment",
        on_delete=models.CASCADE,
        related_name="banner_announcement_notifications",
        related_query_name="notification",
        null=True,
        blank=True,
        help_text="Segment des personnes auquel ce message sera montré, si aucun segment sera montré à tout le monde.",
    )

    def __str__(self):
        return f"{self.title} - {self.question}"

    class Meta:
        verbose_name = "Bannière d'annonce"
        verbose_name_plural = "Bannières d'annonce"

    def show_to_person(self, person):
        already_closed = (
            self.activities.filter(
                person=person, state=AnnouncementActivity.STATE_CLOSED
            ).count()
            > 0
        )
        if self.segment is not None:
            person_in_segment = self.segment.is_included(person)
            return person_in_segment and not already_closed
        return not already_closed

    def answer_to_slug(self, answer):
        length_prefix = 100 - len(answer)
        return slugify(
            f"{self.question.strip()[:length_prefix]}-{answer.strip()}", only_ascii=True
        )
