from data_france.models import (
    Depute,
    Departement,
    CirconscriptionLegislative,
    CirconscriptionConsulaire,
)
from django.contrib.admin.options import csrf_protect_m
from django.template.response import TemplateResponse
from django.db.models import Q, Count, F

from agir.donations.allocations import (
    get_cns_balance,
    CNS_ACCOUNT,
    get_account_name_for_group,
)
from agir.donations.models import AccountOperation
from agir.gestion.admin.cns_distribution_form import CNSDistributionForm
from agir.gestion.models import CNSDistribution
from agir.lib.display import display_price
from agir.lib.geo import FRENCH_COUNTRY_CODES
from django.urls import path

from django.contrib import admin, messages

__all__ = ["CNSDistributionAdmin"]

from agir.groups.models import SupportGroup


import logging

from agir.lib.templatetags.display_lib import display_price_in_cent

logger = logging.getLogger(__name__)

q_certifies = (
    Q(type=SupportGroup.TYPE_LOCAL_GROUP)
    & ~Q(certification_date=None)
    & Q(published=True)
)
q_in_france = Q(location_country__in=["", *FRENCH_COUNTRY_CODES])


@admin.register(CNSDistribution)
class CNSDistributionAdmin(admin.ModelAdmin):
    change_list_template = "admin/gestion/cns_distribution.html"

    current_amount_to_distribute = 0

    def repartition_per_ga(self):
        # on récupère le nombre de GA certifiés par département.

        nb_groupes_certifies_france = (
            SupportGroup.objects.filter(q_certifies & q_in_france)
            .exclude(
                location_departement_id__in=self.get_departements_avec_deputes_lfi().values(
                    "code"
                )
            )
            .order_by("location_departement_id")
            .values("location_departement_id")
            .annotate(c=Count("*"))
        )

        poids_france = {
            g["location_departement_id"]: g["c"] for g in nb_groupes_certifies_france
        }

        nb_groupes_certifies_etranger = (
            SupportGroup.objects.filter(q_certifies & ~q_in_france)
            .order_by("location_country")
            .values("location_country")
            .annotate(c=Count("*"))
        )

        correspondance_pays_circo = {
            p: c["circo"]
            for c in CirconscriptionConsulaire.objects.annotate(
                circo=F("circonscription_legislative__code")
            ).values("pays", "circo")
            for p in c["pays"].split(",")
        }

        poids_circo_fe = {}
        for pays in nb_groupes_certifies_etranger:
            circo = correspondance_pays_circo[pays["location_country"]]
            poids_circo_fe[circo] = poids_circo_fe.get(circo, 0) + pays["c"]

        nb_ga_computed = {**poids_france, **poids_circo_fe}
        nb_ga_computed.pop("", None)
        return nb_ga_computed

    def get_montant_per_departement(self, montant):
        nb_ga_certifie_per_dep = self.repartition_per_ga()
        poids_total = sum(nb_ga_certifie_per_dep.values())
        montant_per_dep = {}

        for dep, nb_ga in nb_ga_certifie_per_dep.items():
            montant_per_dep[dep] = nb_ga * montant // poids_total

        return montant_per_dep

    def get_departements_sans_deputes_lfi(self):
        return Departement.objects.all().exclude(
            code__in=self.get_departements_avec_deputes_lfi().values("code")
        )

    def get_departements_avec_deputes_lfi(self):
        deputes = (
            Depute.objects.filter(
                Q(groupe__contains="La France insoumise") | Q(groupe__contains="LFI")
            )
            .filter(actif=True)
            .distinct()
        )
        circos = CirconscriptionLegislative.objects.filter(depute__in=deputes)
        return Departement.objects.filter(
            circonscriptionlegislative__in=circos
        ).distinct()

    def get_ga_certifie_without_dep(self):
        return SupportGroup.objects.filter(q_certifies & Q(location_departement_id=""))

    def redistribution(self, request, montant):

        montant_per_departement = self.get_montant_per_departement(montant)
        for dep in montant_per_departement.items():
            dep_code = dep[0]
            dep_montant = dep[1]
            group = SupportGroup.objects.filter(
                type=SupportGroup.TYPE_BOUCLE_DEPARTEMENTALE,
                location_departement_id=str(dep_code),
            )
            if group:
                AccountOperation.objects.create(
                    source=CNS_ACCOUNT,
                    destination=get_account_name_for_group(group.first()),
                    amount=dep_montant,
                )
            else:
                logger.error(f"Group not found for dep code {dep_code}")

        self.message_user(
            request,
            f"Redistribution de {display_price_in_cent(montant)} terminée.",
            messages.SUCCESS,
        )

    @csrf_protect_m
    def changelist_view(self, request, extra_context=None):
        if extra_context is None:
            extra_context = {}
        on_confirm = False

        if request.method == "POST":
            if "non" in request.POST:
                form = CNSDistributionForm(initial={"montant": get_cns_balance()})
            elif "oui" in request.POST and "montant" in request.POST:
                montant = int(request.POST["montant"])
                self.redistribution(request, montant)
                cns_balance = get_cns_balance()
                form = CNSDistributionForm(initial={"montant": cns_balance})
                self.current_amount_to_distribute = cns_balance
            else:
                form = CNSDistributionForm(request.POST)
                if form.is_valid():
                    if form.cleaned_data["montant"] is None:
                        self.current_amount_to_distribute = get_cns_balance()
                    else:
                        self.current_amount_to_distribute = form.cleaned_data["montant"]
                    on_confirm = True
        else:
            self.current_amount_to_distribute = get_cns_balance()
            form = CNSDistributionForm(initial={"montant": get_cns_balance()})

        montant_per_departement = self.get_montant_per_departement(
            self.current_amount_to_distribute
        )
        context = {
            **self.admin_site.each_context(request),
            "opts": self.opts,
            "cns_balance": get_cns_balance(),
            "departements_sans_depute_lfi": self.get_departements_sans_deputes_lfi(),
            "nb_ga_certifie_per_dep": self.repartition_per_ga(),
            "montant_per_departement": dict(
                map(
                    lambda item: (item[0], display_price(item[1])),
                    montant_per_departement.items(),
                )
            ),
            "has_ga_without_dep": self.get_ga_certifie_without_dep().count() > 0,
            "ga_cert_without_dep": self.get_ga_certifie_without_dep(),
            "form": form,
            "confirm": on_confirm,
            "amount_to_distribute": self.current_amount_to_distribute,
            **extra_context,
        }

        request.current_app = self.admin_site.name

        return TemplateResponse(
            request,
            self.change_list_template,
            context,
        )
