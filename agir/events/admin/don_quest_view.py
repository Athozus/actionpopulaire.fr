from decimal import Decimal

from django import forms
from django.contrib import admin
from django.views.generic import FormView
from django.views.generic.detail import SingleObjectMixin

from agir.donations.tasks import send_donation_email
from agir.donations.apps import DonsConfig
from agir.events.models import Event
from django.contrib import messages
from django.urls import reverse

__all__ = ["DonQuestView"]


import logging

from agir.lib.admin.form_fields import AutocompleteSelectModel
from agir.payments.actions.payments import (
    create_payment,
    find_or_create_person_from_payment,
)
from agir.payments.models import Payment
from agir.payments.payment_modes import PaymentModeField
from agir.people.models import Person
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


class DonQuestForm(forms.Form):
    existing_person = forms.ModelChoiceField(
        label="Compte existant",
        queryset=Person.objects.all(),
        empty_label=_("None"),
        required=False,
    )

    email = forms.EmailField(
        label="ou si non-inscrit, email d'inscription", required=False
    )

    subscr = forms.BooleanField(
        required=False,
        label="La personne souhaite recevoir les emails de la France insoumise",
    )

    payment_mode = PaymentModeField(required=True, payment_modes=["tpe"])

    first_name = forms.CharField(label="Prénom", required=True)
    last_name = forms.CharField(label="Nom de famille", required=True)
    contact_phone = forms.CharField(label="numéro de téléphone", required=False)

    location_address1 = forms.CharField(label="Adresse (1ère ligne) :", required=False)
    location_address2 = forms.CharField(label="Adresse (2ème ligne) :", required=False)
    location_zip = forms.CharField(label="Code postal", required=True)
    location_city = forms.CharField(label="Ville", required=True)
    location_country = forms.CharField(label="Pays", required=True)

    amount = forms.IntegerField(label="Montant du don (pas de centime)", required=True)

    def __init__(self, *args, model_admin, event, **kwargs):
        super().__init__(*args, **kwargs)

        self.event = event

        self.fields["existing_person"].widget = AutocompleteSelectModel(
            Person,
            admin_site=model_admin.admin_site,
            choices=self.fields["existing_person"].choices,
        )

        self.fields["payment_mode"].initial = "tpe"

        self.fieldsets = [
            (
                "Compte",
                {
                    "fields": (
                        "existing_person",
                        "email",
                        "subscr",
                    )
                },
            ),
            (
                "Informations",
                {
                    "fields": (
                        "first_name",
                        "last_name",
                        "contact_phone",
                        "location_address1",
                        "location_address2",
                        "location_zip",
                        "location_city",
                        "location_country",
                    )
                },
            ),
            ("Paiement", {"fields": ("amount", "payment_mode")}),
        ]


class DonQuestView(SingleObjectMixin, FormView):
    template_name = "admin/events/event/don_quest.html"
    queryset = Event.objects.all()
    form_class = DonQuestForm
    model_admin = None

    def get_success_url(self):
        return reverse("admin:events_dons_quest", args=[self.get_object().id])

    def post(self, request, *args, **kwargs):
        """
        Handle POST requests: instantiate a form instance with the passed
        POST variables and then check if it's valid.
        """

        form = self.get_form()

        if form.is_valid():
            # create a payment
            existing_person = form.cleaned_data["existing_person"]
            amount = form.cleaned_data["amount"]
            payment_mode = form.cleaned_data["payment_mode"]

            if isinstance(amount, int):
                amount *= 100

            event = self.get_object()
            person = None
            if existing_person:
                email = existing_person.email
                person_fields = [
                    "first_name",
                    "last_name",
                    "location_address1",
                    "location_address2",
                    "location_zip",
                    "location_city",
                    "location_country",
                ]
                has_changes = False
                person = Person.objects.get(pk=existing_person.pk)
                for field in person_fields:
                    if getattr(person, field) != form.cleaned_data[field]:
                        setattr(person, field, form.cleaned_data[field])
                        has_changes = True
                if has_changes:
                    person.save()
            else:
                email = form.cleaned_data["email"]

            payment = create_payment(
                status=Payment.STATUS_COMPLETED,
                person=person,
                email=email,
                type=DonsConfig.SINGLE_TIME_DONATION_TYPE,
                mode=payment_mode.id,
                price=amount,
                meta={
                    **self.get_metas(form),
                    "event_name": event.name,
                    "event_id": str(event.id),
                    "type": "don_quest",
                },
            )
            find_or_create_person_from_payment(payment)
            send_donation_email.delay(payment.person.pk, payment.type)

            messages.success(
                self.request,
                f"Don de {amount / 100} € pour {form.cleaned_data['first_name']} bien enregistré !",
            )
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

    def get_metas(self, form):
        ignore_fields = ["payment_mode", "existing_person"]

        return {
            **{k: v for k, v in form.cleaned_data.items() if k not in ignore_fields},
        }

    def get_form(self, form_class=None):
        """Return an instance of the form to be used in this view."""
        if form_class is None:
            form_class = self.get_form_class()
        return form_class(**self.get_form_kwargs())

    def get_form_kwargs(self):
        return {
            "model_admin": self.model_admin,
            "event": self.get_object(),
            **super().get_form_kwargs(),
        }

    def get(self, request, *args, **kwargs):
        self.object = self.event = self.get_object()
        return super().get(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        kwargs = super().get_context_data()
        form = kwargs["form"]
        fieldsets = form.fieldsets
        admin_form = admin.helpers.AdminForm(form, fieldsets, {})

        return {
            **super().get_context_data(**kwargs),
            **admin.site.each_context(self.request),
            "title": _(f"Quête aux dons pour l'événement : {self.event.name}"),
            "is_popup": True,
            "adminform": admin_form,
            "opts": self.model_admin.model._meta,
            "add": False,
            "change": True,
            "save_as": False,
            "show_save": True,
            "has_delete_permission": False,
            "has_add_permission": self.model_admin.has_add_permission(self.request),
            "has_change_permission": self.model_admin.has_change_permission(
                self.request, self.event
            ),
            "has_view_permission": self.model_admin.has_view_permission(
                self.request, self.event
            ),
            "has_editable_inline_admin_formsets": False,
            "media": self.model_admin.media + admin_form.media,
        }
