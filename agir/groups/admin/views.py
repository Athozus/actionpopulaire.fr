import logging
import re
from io import BytesIO
from collections import OrderedDict

import pandas as pd
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.db.models import Q
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.shortcuts import reverse, get_object_or_404, render
from django.template.response import TemplateResponse
from django.utils import timezone
from django.utils.html import escape
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django.core.paginator import Paginator
from django.views.decorators.http import require_POST
from django.http import HttpResponseBadRequest, HttpResponseServerError
from django.contrib.admin.sites import site
from django.contrib.admin.options import csrf_protect_m
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from glom import glom, T

from agir.groups.admin import actions
from .forms import AddMemberForm
from .inlines import MembershipInline
from ..actions.automatic_memberships import maj_boucles, update_memberships_from_segment
from ..actions.export import pdf_group_attendance_list
from ..models import SupportGroup, Membership, MembershipRemoveRequest
from ..tasks import send_email_remove_request_done_user
from ...lib.display import display_price
from ...lib.utils import front_url
from ...donations.allocations import (
    get_account_name_for_group,
    DONATIONS_ACCOUNT,
    SPENDING_ACCOUNT,
)

logger = logging.getLogger(__name__)


def add_member(model_admin, request, pk):
    if not model_admin.has_change_permission(request) or not request.user.has_perm(
        "people.select_person"
    ):
        raise PermissionDenied

    group = model_admin.get_object(request, pk)

    if group is None:
        raise Http404(_("Pas de groupe avec cet identifiant."))

    if request.method == "POST":
        form = AddMemberForm(group, model_admin, request.POST)

        if form.is_valid():
            membership = form.save()
            messages.success(
                request,
                _("{email} a bien été ajouté au groupe").format(
                    email=membership.person.display_email
                ),
            )

            return HttpResponseRedirect(
                reverse(
                    "%s:%s_%s_change"
                    % (
                        model_admin.admin_site.name,
                        group._meta.app_label,
                        group._meta.model_name,
                    ),
                    args=(group.pk,),
                )
            )
    else:
        form = AddMemberForm(group, model_admin)

    fieldsets = [(None, {"fields": ["person", "membership_type", "description"]})]
    admin_form = admin.helpers.AdminForm(form, fieldsets, {})

    context = {
        "title": _("Ajouter un membre au groupe: %s") % escape(group.name),
        "adminform": admin_form,
        "form": form,
        "is_popup": True,
        "opts": model_admin.model._meta,
        "original": group,
        "change": True,
        "add": False,
        "save_as": False,
        "show_save": True,
        "has_delete_permission": model_admin.has_delete_permission(request, group),
        "has_add_permission": model_admin.has_add_permission(request),
        "has_change_permission": model_admin.has_change_permission(request, group),
        "has_view_permission": model_admin.has_view_permission(request, group),
        "has_editable_inline_admin_formsets": False,
        "media": model_admin.media + admin_form.media,
    }
    context.update(model_admin.admin_site.each_context(request))

    request.current_app = model_admin.admin_site.name

    return TemplateResponse(request, "admin/supportgroups/add_member.html", context)


def maj_membres_boucles_departementales(request, group):
    if group.location_departement_id:
        code = group.location_departement_id
    else:
        code = re.findall("(\d\d?)(?:ème|ère)", group.name, flags=re.IGNORECASE)
        code = f"99-{int(code[0]):02d}" if code else None

    if not code:
        messages.warning(
            request,
            "Le département ou la circonscription FE n'ont pas pu être retrouvés pour cette boucle",
        )
        return

    result = maj_boucles([code])
    result = list(result.items())

    if not result:
        messages.warning(
            request,
            "Le département ou la circonscription FE n'ont pas pu être retrouvés pour cette boucle",
        )
        return

    lieu, count = result[0]

    if not count:
        messages.warning(
            request,
            "Le département ou la circonscription FE n'ont pas pu être retrouvés pour cette boucle",
        )
        return

    existing, created, deleted = count
    message = (
        f"La boucle {lieu} a été mise à jour · Membres existants : {existing} "
        f"· Membres supprimés : {deleted} · Membres ajoutés : {created}"
    )
    messages.success(request, message)


def refresh_memberships_from_segment(request, group):
    result = update_memberships_from_segment(group)
    existing, created, deleted = result
    message = (
        f"Le groupe {group.name} a été mis à jour · Membres existants : {existing} "
        f"· Membres supprimés : {deleted} · Membres ajoutés : {created}"
    )
    messages.success(request, message)


def refresh_automatic_memberships(model_admin, request, pk):
    if not model_admin.has_change_permission(request):
        raise PermissionDenied

    group = model_admin.get_object(request, pk)

    if group is None:
        raise Http404("Pas de groupe avec cet identifiant")

    response = HttpResponseRedirect(
        reverse(
            "%s:%s_%s_change"
            % (
                model_admin.admin_site.name,
                group._meta.app_label,
                group._meta.model_name,
            ),
            args=(group.pk,),
        )
    )

    if not group.has_automatic_memberships:
        messages.warning(
            request,
            "La mise à jour automatique des membres est disponible uniquement pour les boucles départementales "
            "ou pour les groupes avec un segment d'adhésions.",
        )
        return response

    if group.type == group.TYPE_BOUCLE_DEPARTEMENTALE:
        maj_membres_boucles_departementales(request, group)
    else:
        refresh_memberships_from_segment(request, group)

    return response


def format_memberships_for_export(group):
    memberships = group.memberships.select_related("person", "supportgroup")
    groups = {
        str(g.id): g.name
        for g in SupportGroup.objects.filter(
            id__in=list(
                memberships.filter(meta__group_id__isnull=False).values_list(
                    "meta__group_id", flat=True
                )
            )
        ).only("id", "name")
    }

    spec = {
        "nom": ("person.last_name", lambda name: name.upper()),
        "prénom": ("person.first_name", lambda name: name.title()),
        "pseudo": "person.display_name",
        "statut": T.get_membership_type_display(),
        "description": "description",
        "nom du groupe d'origine": (
            "meta",
            lambda meta: groups.get(meta["group_id"], "") if "group_id" in meta else "",
        ),
        "page du groupe d'origine": (
            "meta",
            lambda meta: (
                front_url("view_group", kwargs={"pk": meta["group_id"]}, absolute=True)
                if "group_id" in meta
                else ""
            ),
        ),
        "email": "person.email",
        "téléphone": "person.contact_phone",
        "code postal": "person.location_zip",
        "ville": "person.location_city",
        "pays": "person.location_country",
        "inscription action populaire": T.person.created.astimezone(
            timezone.get_current_timezone()
        )
        .replace(microsecond=0)
        .isoformat(),
        "inscription dans le groupe": T.created.astimezone(
            timezone.get_current_timezone()
        )
        .replace(microsecond=0)
        .isoformat(),
    }

    if group.type != SupportGroup.TYPE_BOUCLE_DEPARTEMENTALE:
        del spec["description"]
        del spec["nom du groupe d'origine"]
        del spec["page du groupe d'origine"]

    return glom(memberships, [spec])


def export_memberships_to_xlsx(group):
    memberships = format_memberships_for_export(group)
    res = pd.DataFrame(memberships)

    with BytesIO() as excel_file:
        res.to_excel(
            excel_file,
            engine="xlsxwriter",
            sheet_name=slugify(group.name)[:31],
            index=False,
        )
        filename = f"membres_{slugify(group.name)}_{timezone.now().date()}.xlsx"
        response = HttpResponse(
            excel_file.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = "attachment; filename=%s" % filename
        return response


def export_memberships_to_csv(group):
    memberships = format_memberships_for_export(group)
    res = pd.DataFrame(memberships)
    filename = f"membres_{slugify(group.name)}_{timezone.now().date()}.csv"
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f"attachment; filename={filename}"
    res.to_csv(response, index=False)

    return response


def export_memberships_to_pdf_attendance_list(group):
    pdf, hash = pdf_group_attendance_list(group)
    filename = f"emargement_{slugify(group.name)}_{hash[:8]}.pdf"
    res = HttpResponse(pdf, content_type="application/pdf")
    res["Content-Disposition"] = f"attachment; filename={filename}"

    return res


def export_memberships(modeladmin, request, pk, as_format):
    if not modeladmin.has_change_permission(request) or not request.user.has_perm(
        "people.export_people"
    ):
        raise PermissionDenied

    group = modeladmin.get_object(request, pk)

    if group is None:
        raise Http404("Pas de groupe avec cet identifiant")

    if as_format == "csv":
        return export_memberships_to_csv(group)
    if as_format == "xlsx":
        return export_memberships_to_xlsx(group)
    if as_format == "pdf":
        return export_memberships_to_pdf_attendance_list(group)

    return Http404(f"Le format {as_format} n'est pas supporté pour l'export")


def change_group_certification(model_admin, request, pk, certify=True):
    if not model_admin.has_change_permission(request):
        raise PermissionDenied

    group = model_admin.get_object(request, pk)

    if group is None:
        raise Http404("Pas de groupe avec cet identifiant")

    response = HttpResponseRedirect(
        reverse(
            "%s:%s_%s_change"
            % (
                model_admin.admin_site.name,
                group._meta.app_label,
                group._meta.model_name,
            ),
            args=(group.pk,),
        )
    )

    qs = SupportGroup.objects.filter(pk=group.pk)

    if certify and group.is_certified:
        messages.warning(request, "Ce groupe est déjà certifié !")

        return response

    if not certify and not group.is_certified:
        messages.warning(request, "Ce groupe n'est déjà pas certifié !")

        return response

    if certify:
        actions.certify_supportgroups(model_admin, request, qs)
    else:
        actions.uncertify_supportgroups(model_admin, request, qs)

    return response


def delete_member_from_group(model_admin, request, pk, group_id, member_id):
    if not model_admin.has_change_permission(request):
        raise PermissionDenied

    remove_request = model_admin.get_object(request, pk)
    if request is None:
        raise Http404("Aucune requête avec cet identifiant")

    try:
        membership = Membership.objects.get(
            Q(supportgroup__id=group_id) & Q(person__id=member_id)
        )
        membership.delete()
        remove_request.status = MembershipRemoveRequest.Status.DONE
        remove_request.resolved_date = timezone.now()
        remove_request.save()
        message = "La personne a bien été supprimée du groupe."
        if (
            remove_request.reason_type
            != MembershipRemoveRequest.REASON_NE_MILITE_PLUS_A_LA_FI
        ):
            send_email_remove_request_done_user.delay(remove_request.pk)
            message += " Un mail va être envoyé."
        messages.add_message(request, messages.SUCCESS, message)
    except ObjectDoesNotExist:
        messages.add_message(request, messages.WARNING, "Une erreur est survenue.")

    return HttpResponseRedirect(
        reverse("admin:groups_membershipremoverequest_change", args=(pk,))
    )


def allocation_amount_view(request, pk):
    supportgroup = get_object_or_404(SupportGroup, id=pk)
    allocation = supportgroup.get_allocation()
    add_operation_link = reverse("admin:donations_accountoperation_add")
    group_account = get_account_name_for_group(supportgroup)
    increase_link = (
        f"{add_operation_link}?source={DONATIONS_ACCOUNT}&destination={group_account}"
    )
    decrease_link = (
        f"{add_operation_link}?source={group_account}&destination={SPENDING_ACCOUNT}"
    )
    return render(
        request,
        "admin/supportgroups/allocation_amount.html",
        {
            "supportgroup": supportgroup,
            "allocation": display_price(allocation) if allocation != 0 else "-",
            "increase_link": increase_link,
            "decrease_link": decrease_link,
        },
    )


def group_members_partial_view(request, pk):
    supportgroup = get_object_or_404(SupportGroup, pk=pk)
    q = request.GET.get("q", "").strip()

    memberships = (
        supportgroup.memberships.select_related("person")
        .prefetch_related("person__emails")
        .all()
    )

    if q:
        memberships = memberships.filter(
            Q(person__first_name__icontains=q)
            | Q(person__last_name__icontains=q)
            | Q(meta__description__icontains=q)
        )

    page_number = request.GET.get("page", 1)
    paginator = Paginator(memberships, 10)

    try:
        page = paginator.page(page_number)
    except:
        raise Http404("Page invalide")

    inline = MembershipInline(Membership, admin.site)

    rows = [
        {
            "id": m.id,
            "person_link": inline.person_link(m),
            "gender": inline.gender(m),
            "membership_type": m.membership_type,
            "membership_type_label": m.get_membership_type_display(),
            "description": m.description or "",
            "is_finance_manager_value": inline.is_finance_manager_value(m),
        }
        for m in page.object_list
    ]

    return render(
        request,
        "admin/supportgroups/members_partial.html",
        {
            "rows": rows,
            "instance": supportgroup,
            "membership_type_choices": OrderedDict(
                Membership._meta.get_field("membership_type").choices
            ),
            "page": page,
            "search_query": q,
        },
    )


@require_POST
@csrf_protect
def delete_membership_htmx(request, group_id, membership_id):
    model_admin = site._registry.get(SupportGroup)
    if model_admin is None:
        raise PermissionDenied

    group = get_object_or_404(SupportGroup, pk=group_id)
    if not model_admin.has_delete_permission(request, obj=group):
        raise PermissionDenied

    membership = get_object_or_404(Membership, pk=membership_id, supportgroup=group)
    membership.delete()
    return HttpResponse("")


@require_POST
@csrf_protect
def update_membership_description(request, group_id, membership_id):
    model_admin = site._registry.get(SupportGroup)
    if model_admin is None:
        raise PermissionDenied

    group = get_object_or_404(SupportGroup, pk=group_id)
    if not model_admin.has_change_permission(request, obj=group):
        raise PermissionDenied

    membership = get_object_or_404(Membership, pk=membership_id, supportgroup=group)

    new_description = request.POST.get("description", "").strip()
    membership.description = new_description
    membership.save()
    return HttpResponse("")


@require_POST
@csrf_protect
def update_membership_type(request, group_id, membership_id):
    model_admin = site._registry.get(SupportGroup)
    if model_admin is None:
        raise PermissionDenied

    group = get_object_or_404(SupportGroup, pk=group_id)
    if not model_admin.has_change_permission(request, obj=group):
        raise PermissionDenied

    membership = get_object_or_404(Membership, pk=membership_id, supportgroup=group)

    new_type = int(request.POST.get("membership_type"))
    valid_choices = [choice[0] for choice in Membership.MEMBERSHIP_TYPE_CHOICES]

    if new_type not in valid_choices:
        return HttpResponseBadRequest("Type de statut invalide")

    membership.membership_type = new_type
    membership.save()
    return HttpResponse("")
