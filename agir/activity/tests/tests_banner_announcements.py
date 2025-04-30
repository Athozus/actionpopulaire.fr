from datetime import datetime, timedelta

from django.contrib.auth import get_user
from django.http import QueryDict
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from django.utils.timezone import make_aware
from rest_framework import status

from agir.activity.models_banner_announcement import BannerAnnouncement
from agir.mailing.models import Segment
from agir.people.models import Person, PersonTag


BANNER_ANNOUNCEMENT_QUESTION = "Pour ou contre ?"


class BannerAnnouncementTestCase(TestCase):
    def setUp(self):
        self.tag = PersonTag.objects.create(label="banner", description="banner")
        self.person = Person.objects.create_insoumise("test@test.com", create_role=True)
        self.person.tags.add(self.tag)

    def test_bannerannouncement_visible_without_segment(self):
        BannerAnnouncement.objects.create(
            title="Banner announcement test",
            question=BANNER_ANNOUNCEMENT_QUESTION,
            start_date=make_aware(datetime.now()),
            end_date=make_aware(datetime.now() + timedelta(days=1)),
        )
        self.client.force_login(self.person.role)
        response = self.client.get(reverse("activity:api_banner_announcements_list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, BANNER_ANNOUNCEMENT_QUESTION)

    def test_bannerannouncement_not_visible_person_not_in_segment(self):
        segment = Segment.objects.create(newsletters=[])
        segment.excluded_tags.add(self.tag)
        BannerAnnouncement.objects.create(
            title="Banner announcement test",
            question=BANNER_ANNOUNCEMENT_QUESTION,
            start_date=make_aware(datetime.now()),
            end_date=make_aware(datetime.now() + timedelta(days=1)),
            segment=segment,
        )

        self.client.force_login(self.person.role)
        response = self.client.get(reverse("activity:api_banner_announcements_list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0)

    def test_bannerannouncement_visible_person_in_segment(self):
        segment = Segment.objects.create(newsletters=[])
        segment.tags.add(self.tag)

        BannerAnnouncement.objects.create(
            title="Banner announcement test",
            question=BANNER_ANNOUNCEMENT_QUESTION,
            start_date=make_aware(datetime.now()),
            end_date=make_aware(datetime.now() + timedelta(days=1)),
            segment=segment,
        )

        self.client.force_login(self.person.role)
        response = self.client.get(reverse("activity:api_banner_announcements_list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, BANNER_ANNOUNCEMENT_QUESTION)
        data = response.json()

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)

    def test_bannerannouncement_not_started_not_visible(self):
        segment = Segment.objects.create(newsletters=[])
        segment.tags.add(self.tag)

        BannerAnnouncement.objects.create(
            title="Banner announcement test",
            question=BANNER_ANNOUNCEMENT_QUESTION,
            start_date=make_aware(datetime.now() + timedelta(days=1)),
            end_date=make_aware(datetime.now() + timedelta(days=2)),
            segment=segment,
        )

        self.client.force_login(self.person.role)
        response = self.client.get(reverse("activity:api_banner_announcements_list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0)

    def test_bannerannouncement_ended_not_visible(self):
        segment = Segment.objects.create(newsletters=[])
        segment.tags.add(self.tag)

        BannerAnnouncement.objects.create(
            title="Banner announcement test",
            question=BANNER_ANNOUNCEMENT_QUESTION,
            start_date=make_aware(datetime.now() - timedelta(days=2)),
            end_date=make_aware(datetime.now() - timedelta(days=1)),
            segment=segment,
        )

        self.client.force_login(self.person.role)
        response = self.client.get(reverse("activity:api_banner_announcements_list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 0)
