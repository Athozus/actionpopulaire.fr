from django.utils import timezone
from django.core.exceptions import ValidationError
from agir.gestion.virements import generer_endtoend_id, Virement, Partie
from agir.lib.iban import IBAN


def extract_virements(df):
    virements = []

    for ind in df.index:
        try:
            iban_str = df["IBAN BENEFICIAIRE"][ind]
            iban = IBAN(iban_str)
            beneficiaire = Partie(
                nom=df["NOM BENEFICIAIRE"][ind],
                iban=iban,
                bic=iban.bic,
            )
            virements.append(
                Virement(
                    beneficiaire=beneficiaire,
                    montant=round(df["MONTANT"][ind] * 100),
                    date_execution=timezone.now().date(),
                    description=df["MOTIF"][ind],
                    id=generer_endtoend_id(),
                )
            )
        except Exception:
            raise ValidationError(f"IBAN incorrect {iban_str}")

    return virements
