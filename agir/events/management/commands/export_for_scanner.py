import csv
import sys

from agir.people.models import PersonEmail
from django.core.management import BaseCommand

from agir.events.models import RSVP, IdentifiedGuest
from agir.lib.display import display_price
from agir.lib.management_utils import event_argument


class Command(BaseCommand):
    help = "Extract people for event to import in scanner (convenient if there is no placement)"
    requires_migrations_checks = True

    def add_arguments(self, parser):
        parser.add_argument("event", type=event_argument)
        parser.add_argument("category_field", type=str)
        parser.add_argument("contribution_field", type=str)
        parser.add_argument(
            "metas", nargs="*", type=str, help="Extra metadata fields to include"
        )

    def handle(self, event, category_field, contribution_field, metas=None, **kwargs):
        metas = metas or []

        writer = csv.writer(sys.stdout)
        writer.writerow(
            [
                "numero",
                "canceled",
                "full_name",
                "uuid",
                "_contact_emails",
                "gender",
                "category",
                "price",
                "status",
                "entry",
            ]
            + metas
        )

        rsvps = event.rsvps.filter(form_submission__isnull=False).select_related(
            "person",
            "form_submission",
            "payment",
        )
        guests = IdentifiedGuest.objects.filter(
            rsvp__event_id=event.id,
        ).select_related("rsvp__person", "submission", "payment")

        emails = PersonEmail.objects.raw(
            """
            WITH emails AS (
              SELECT
              pe.id,
              pe.person_id,
              pe.address,
              row_number() OVER (PARTITION BY pe.person_id ORDER BY pe.person_id, _order) AS num
              FROM people_personemail pe
              JOIN people_person p ON p.id = pe.person_id
              JOIN events_rsvp r on p.id = r.person_id
              WHERE r.event_id = %s AND NOT pe.bounced
            )
            SELECT id, person_id, address FROM emails WHERE num = 1;
            """,
            [event.id],
        )
        emails = {e.person_id: e.address for e in emails}

        for rsvp in rsvps:
            data = rsvp.form_submission.data
            writer.writerow(
                [
                    f"R{rsvp.pk}",
                    "O" if rsvp.status == RSVP.Status.CANCELLED else "",
                    f"{data.get('first_name')} {data.get('last_name')}",
                    str(rsvp.person_id),
                    emails.get(rsvp.person_id, None) or rsvp.person.email,
                    rsvp.person.gender or "",
                    data.get(category_field, ""),
                    display_price(
                        rsvp.payment.price + data.get(contribution_field, 0) * 100
                        if rsvp.payment
                        else (
                            0
                            if data.get(contribution_field, 0)
                            or data.get(contribution_field, 0) < 0
                            else 0
                        )
                    ),
                    "completed" if rsvp.status == RSVP.Status.CONFIRMED else "on-hold",
                    rsvp.created.isoformat() if data.get("admin", False) else None,
                ]
                + [data.get(meta, "") for meta in metas]
            )

        for guest in guests:
            data = guest.submission.data
            writer.writerow(
                [
                    f"G{guest.rsvp_id}g{guest.pk}",
                    "O" if guest.status == RSVP.Status.CANCELLED else "",
                    f"{data.get('first_name')} {data.get('last_name')}",
                    str(guest.rsvp.person_id),
                    emails.get(guest.rsvp.person_id, None) or guest.rsvp.person.email,
                    data.get("gender", ""),
                    data.get(category_field, ""),
                    display_price(
                        guest.payment.price + data.get(contribution_field, 0) * 100
                        if guest.payment
                        else (
                            0
                            if data.get(contribution_field, 0)
                            or data.get(contribution_field, 0) < 0
                            else 0
                        )
                    ),
                    "completed" if guest.status == RSVP.Status.CONFIRMED else "on-hold",
                    None,
                ]
                + [data.get(meta, "") for meta in metas]
            )
