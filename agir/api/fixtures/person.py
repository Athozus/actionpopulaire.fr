from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

from agir.lib.tests.mixins import (
    create_person,
    create_people,
    create_group,
    create_local_group,
)
from agir.people.models import Person
from django.db import transaction

MONTANT_PEOPLE = 200


def get_superperson():
    return Person.objects.filter(role__is_staff=True).first()


@transaction.atomic()
def populate_people_groups():
    # ajout de personnes
    people = create_people(MONTANT_PEOPLE)

    # ajout de GA random
    for g in range(6):
        create_group()

    referents = [
        create_person(
            "Ada", "Lovelace", Person.GENDER_FEMALE, "ada.lovelace@lafranceinsoumise.fr"
        ),
        create_person(
            "Lénine",
            "Oulianov",
            Person.GENDER_MALE,
            "lenine.oulianov@lafranceinsoumise.fr",
        ),
    ]

    # ajout d'un GA certifié
    create_local_group(
        "Au 43",
        people[:10],
        referents,
        certification_date=datetime.now(timezone.utc) - relativedelta(months=2),
        published=True,
        created=datetime.now(timezone.utc) - relativedelta(months=3),
    )

    # ajout du superperson à un GA certifié
    superperson = get_superperson()
    if superperson:
        create_local_group(
            "Insoumis·es numériques",
            [create_person("Membre", "", Person.GENDER_FEMALE, "membre@lfi.fr")]
            + people[MONTANT_PEOPLE - 8 :],
            [superperson, create_person()],
            certification_date=datetime.now(timezone.utc) - relativedelta(months=2),
            published=True,
            created=datetime.now(timezone.utc) - relativedelta(months=3),
        )
