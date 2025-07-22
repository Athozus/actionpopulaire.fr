from datetime import datetime, timedelta

from django.urls import reverse
from rest_framework import status

from agir.api import settings
from freezegun import freeze_time

from agir.donations.models import AccountOperation, SpendingRequest
from agir.donations.tests.test_spendings_usecases import SpendingRequestTestCaseMixin
from agir.payments.models import Payment


class SpendingRequestElectionsInProgress(SpendingRequestTestCaseMixin):

    @freeze_time("2025-12-14")
    def test_election_must_be_visible(self):
        self.client.force_login(self.group_member.role)
        settings.SPENDING_REQUEST_ELECTIONS = {
            "MUNICIPALES": {
                "start": datetime(2025, 9, 1),
                "end": datetime(2026, 3, 31),
            },
        }
        res = self.client.get(
            reverse(
                "api_spending_request_elections_in_progress",
            )
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, ["MUNICIPALES"])

    @freeze_time("2026-04-14")
    def test_elections_must_not_be_visible(self):
        self.client.force_login(self.group_member.role)
        settings.SPENDING_REQUEST_ELECTIONS = {
            "MUNICIPALES": {
                "start": datetime(2025, 9, 1),
                "end": datetime(2026, 3, 31),
            },
        }
        res = self.client.get(
            reverse(
                "api_spending_request_elections_in_progress",
            )
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def prepare_spending_request(self, data=None, without_funds=False, election=None):
        if data is None:
            data = self.get_form_data(with_docs=True)

        if election:
            data["election"] = election

        if not without_funds:
            payment = Payment.objects.create(
                status=Payment.STATUS_COMPLETED,
                price=data["amount"][1],
                type="don",
                mode="system_pay",
            )
            AccountOperation.objects.create(
                payment=payment,
                amount=data["amount"][1],
                source="revenu:dons",
                destination=f"actif:groupe:{self.group.id}",
            )
        return data

    def test_spending_request_created_while_many_election_select_one(self):
        self.client.force_login(self.group_finance_admin.role)

        spending_request = self.prepare_spending_request()
        spending_request["election"] = "LEGISLATIVES"
        settings.SPENDING_REQUEST_ELECTIONS = {
            "MUNICIPALES": {
                "start": datetime.now() - timedelta(days=2),
                "end": datetime.now() + timedelta(days=2),
            },
            "LEGISLATIVES": {
                "start": datetime.now() - timedelta(days=6),
                "end": datetime.now() + timedelta(days=6),
            },
        }

        res = self.client.post(
            reverse("api_spending_request_create"),
            data=spending_request,
            format="multipart",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data, res.data)
        self.assertEqual(res.data["election"], "LEGISLATIVES")
        self.assertEqual(res.data["campaign"], True)

    def test_spending_request_created_only_one_election(self):
        self.client.force_login(self.group_finance_admin.role)

        spending_request = self.prepare_spending_request()
        spending_request["campaign"] = True
        settings.SPENDING_REQUEST_ELECTIONS = {
            "MUNICIPALES": {
                "start": datetime.now() - timedelta(days=2),
                "end": datetime.now() + timedelta(days=2),
            },
        }

        res = self.client.post(
            reverse("api_spending_request_create"),
            data=spending_request,
            format="multipart",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data, res.data)
        self.assertEqual(res.data["election"], "MUNICIPALES")
        self.assertEqual(res.data["campaign"], True)

    def test_spending_request_created_without_election(self):
        self.client.force_login(self.group_finance_admin.role)

        spending_request = self.prepare_spending_request()
        settings.SPENDING_REQUEST_ELECTIONS = {
            "MUNICIPALES": {
                "start": datetime.now() - timedelta(days=2),
                "end": datetime.now() + timedelta(days=2),
            },
        }

        res = self.client.post(
            reverse("api_spending_request_create"),
            data=spending_request,
            format="multipart",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", res.data, res.data)
        self.assertEqual(res.data["election"], SpendingRequest.Election.NONE)
        self.assertEqual(res.data["campaign"], False)
