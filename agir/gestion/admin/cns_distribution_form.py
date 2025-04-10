from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit
from django import forms
from django.core.exceptions import ValidationError

from agir.donations.allocations import get_cns_balance
from agir.donations.form_fields import MoneyField


def validate_montant_to_distribute(value):
    if value > get_cns_balance():
        raise ValidationError(
            "Impossible de donner plus que le montant de la CNS.", code="invalid"
        )


import logging

logger = logging.getLogger(__name__)


class CNSDistributionForm(forms.Form):
    montant = MoneyField(
        label="Montant à redistribuer",
        min_value=10,
        initial=get_cns_balance(),
        required=False,
        validators=[validate_montant_to_distribute],
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.helper = FormHelper()
        self.helper.add_input(Submit("submit", "Redistribuer", css_class="btn-primary"))
