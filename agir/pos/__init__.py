from agir.pos.payment_mode import (
    AbstractMoneyPaymentMode,
    AbstractTPEPaymentMode,
    AbstractPOSPaymentMode,
)


class MoneyPaymentMode(AbstractMoneyPaymentMode):
    id = "money"
    url_fragment = "liquide"
    label = "Paiement sur place en liquide"


class TPEPaymentMode(AbstractTPEPaymentMode):
    id = "tpe"
    url_fragment = "tpe"
    label = "Paiement sur place par carte bleue"
    title = "Paiement par TPE"


class SolidaireMode(AbstractPOSPaymentMode):
    can_retry = False
    can_cancel = True

    id = "solidaire"
    label = "Place solidaire (0€)"
    title = "Place solidaire (0€)"

    message_on_payment = (
        "Pensez à valider le paiement pour valider la place solidaire !"
    )
