from functools import lru_cache
from django.db.models import (
    Q,
    Subquery,
    OuterRef,
    Case,
    When,
    Value,
    IntegerField,
)
from django.utils import timezone

from agir.activity.models import Activity
from .models import Announcement
from ..events.models import Event
from ..mailing.models import Segment
from ..people.models import Person


def get_activities(person):
    activities = (
        Activity.objects.displayed()
        .select_related("supportgroup", "individual", "announcement", "event")
        .filter(recipient=person)
        .exclude(supportgroup__isnull=False, supportgroup__published=False)
        .exclude(~Q(event__visibility=Event.VISIBILITY_PUBLIC), event__isnull=False)
        .filter(
            ~Q(type=Activity.TYPE_ANNOUNCEMENT)
            | Q(type=Activity.TYPE_ANNOUNCEMENT, announcement__custom_display__exact="")
        )
        .distinct()
        # Always display undisplayed announcement activities first
        .annotate(
            sort=Case(
                When(
                    type=Activity.TYPE_ANNOUNCEMENT,
                    status=Activity.STATUS_UNDISPLAYED,
                    then=0,
                ),
                default=1,
                output_field=IntegerField(),
            )
        )
        .order_by("sort", "-timestamp")
    )

    return activities


@lru_cache(maxsize=128)
def get_announcements_cached(person_id=None, custom_display=None):
    today = timezone.now()
    cond = Q(start_date__lt=today) & (Q(end_date__isnull=True) | Q(end_date__gt=today))

    if custom_display is not None:
        cond = Q(custom_display=custom_display) & cond
    announcements = Announcement.objects.filter(cond)

    if person_id:
        person = Person.objects.get(pk=person_id)

        segment_ids = [
            segment.id
            for segment in (
                Segment.objects.prefetch_related("add_segments", "exclude_segments")
                .filter(
                    pk__in=list(
                        announcements.exclude(segment_id__isnull=True).values_list(
                            "segment_id", flat=True
                        )
                    )
                )
                .distinct("pk")
            )
            if segment.is_included(person)
        ]

        announcements = announcements.filter(
            Q(segment_id__isnull=True) | Q(segment_id__in=segment_ids)
        ).annotate(
            activity_id=Subquery(
                Activity.objects.filter(
                    recipient_id=person.id, announcement_id=OuterRef("id")
                ).values("id")[:1]
            ),
        )

        activities = [
            Activity(
                type=Activity.TYPE_ANNOUNCEMENT,
                recipient_id=person.id,
                announcement_id=announcement_pk,
            )
            for announcement_pk in announcements.filter(
                activity_id__isnull=True
            ).values_list("pk", flat=True)
        ]
        Activity.objects.bulk_create(activities, ignore_conflicts=True)
    else:
        announcements = announcements.filter(segment__isnull=True)

    announcements = announcements.order_by("-priority", "-start_date", "end_date")

    return announcements


def get_announcements(person=None, custom_display=None):
    person_id = person.id if person else None
    return get_announcements_cached(person_id=person_id, custom_display=custom_display)


def get_non_custom_announcements(person=None):
    return get_announcements(person, custom_display="")


def get_custom_announcements(person, custom_display):
    # Avoid calling get_announcement if an activity already exists for
    # the person and the announcement
    if person and custom_display:
        today = timezone.now()
        activity = (
            Activity.objects.filter(
                type=Activity.TYPE_ANNOUNCEMENT,
                recipient=person,
                announcement__custom_display__exact=custom_display,
            )
            .filter(
                Q(announcement__start_date__lt=today)
                & (
                    Q(announcement__end_date__isnull=True)
                    | Q(announcement__end_date__gt=today)
                )
            )
            .only("id", "announcement_id")
            .first()
        )
        if activity:
            return Announcement.objects.filter(
                pk=activity.announcement_id,
            ).annotate(activity_id=Value(activity.id, IntegerField()))

    return (
        get_announcements(person, custom_display)
        .exclude(custom_display__exact="")
        .order_by("custom_display", "-priority", "-start_date", "end_date")
        .distinct("custom_display")
    )
