import django_filters
from rest_framework import status

from agir.donations.serializers import SpendingRequestSerializer
from dateutil.relativedelta import relativedelta
from datetime import datetime
from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from django.db.models import Sum
from functools import reduce
from rest_framework.generics import (
    GenericAPIView,
    ListAPIView,
)
from rest_framework.response import Response

from agir.donations.allocations import (
    get_supportgroup_balance,
    get_account_name_for_group,
    DONATIONS_ACCOUNT,
    COTISATIONS_ACCOUNT,
    CNS_ACCOUNT,
)
from agir.donations.models import SpendingRequest, AccountOperation
from agir.groups.models import (
    SupportGroup,
)
from agir.groups.serializers import (
    SupportGroupSerializer,
)
from agir.groups.serializers_finance import FinanceHistoryRow
from agir.lib.pagination import APIPageNumberPagination
from agir.lib.rest_framework_permissions import (
    GlobalOrObjectPermissions,
    IsPersonPermission,
)
from agir.donations.models import MonthlyAllocation


class GroupFinancePermission(GlobalOrObjectPermissions):
    perms_map = {
        "GET": [],
    }
    object_perms_map = {
        "GET": ["groups.view_group_finance"],
    }


class GroupAllocationAPIView(ListAPIView):
    queryset = SupportGroup.objects.all()
    permission_classes = (
        IsPersonPermission,
        GroupFinancePermission,
    )

    serializer_class = SupportGroupSerializer

    def get(self, request, *args, **kwargs):
        group = self.get_object()
        allocation = get_supportgroup_balance(group)
        return Response(status=status.HTTP_200_OK, data=allocation)


class CharFilterField(filters.BaseInFilter, filters.CharFilter):
    pass


class SpendingRequestFilter(filters.FilterSet):
    status_in = CharFilterField(field_name="status", lookup_expr="in")

    class Meta:
        model = SpendingRequest
        fields = [
            "status_in",
        ]


class GroupSpendingRequestAPIView(ListAPIView):
    serializer_class = SpendingRequestSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = SpendingRequestFilter
    filterset_fields = ["status"]
    permission_classes = (
        IsPersonPermission,
        GroupFinancePermission,
    )

    def get_queryset(self):
        group_pk = self.kwargs["group_pk"]
        return SpendingRequest.objects.filter(group_id=group_pk)


class GroupFinanceAPIView(GenericAPIView):
    queryset = SupportGroup.objects.all()
    permission_classes = (
        IsPersonPermission,
        GroupFinancePermission,
    )
    serializer_class = SupportGroupSerializer

    def get(self, request, *args, **kwargs):
        group = self.get_object()
        allocation = get_supportgroup_balance(group)
        current_spending_requests = (
            SpendingRequest.objects.filter(group=group)
            .exclude(status=SpendingRequest.Status.PAID)
            .order_by("-modified")
            .only("id", "title", "status", "spending_date", "amount", "category")
        )
        last_year = timezone.now() - relativedelta(years=1)
        past_spending_requests = (
            SpendingRequest.objects.filter(group=group)
            .filter(
                status=SpendingRequest.Status.PAID,
                modified__gte=last_year,
            )
            .order_by("-modified")
            .only("id", "title", "status", "spending_date", "amount", "category")
        )
        spending_requests = [
            map_spending_request(spending_request)
            for spending_request in current_spending_requests | past_spending_requests
        ]

        return Response(
            status=status.HTTP_200_OK,
            data={"allocation": allocation, "spendingRequests": spending_requests},
        )


def map_spending_request(spending_request):
    return {
        "id": spending_request.id,
        "title": spending_request.title,
        "status": spending_request.status,
        "category": spending_request.category,
        "date": spending_request.spending_date,
        "amount": spending_request.amount,
    }


def map_operation(operation):
    return {
        "id": operation.id,
        "amount": operation.amount,
        "datetime": operation.datetime,
    }


import logging
import json

logger = logging.getLogger(__name__)


def get_latest_cns_given(group):
    account_name = get_account_name_for_group(group)
    result = AccountOperation.objects.filter(
        destination=account_name,
        source=CNS_ACCOUNT,
        created__gt=datetime.now() - relativedelta(days=28),
    ).aggregate(last_cns=Sum("amount"))

    return result["last_cns"] or 0


def get_latest_cotisation_given(group):
    account_name = get_account_name_for_group(group)
    cotisations = AccountOperation.objects.filter(
        destination=account_name,
        source=COTISATIONS_ACCOUNT,
        created__gt=datetime.now() - relativedelta(days=28),
    ).aggregate(last_cotisation=Sum("amount"))

    return cotisations["last_cotisation"] or 0


def get_futur_monthly_dons_give(group):
    # calcul des dons récurrents futurs attribués à ce groupe
    monthly_allocation = MonthlyAllocation.objects.filter(
        group__id=group.id,
        subscription__status=1,
        subscription__created__gt=datetime.now() - relativedelta(months=12),
    )

    group_allocs = [
        alloc
        for malloc in monthly_allocation
        for alloc in json.loads(malloc.subscription.meta["allocations"])
        if alloc["type"] == "group"
    ]

    total_group_alloc = reduce(
        lambda prev, curr: curr["amount"] + prev, group_allocs, 0
    )

    return total_group_alloc


class GroupFuturFinance(ListAPIView):
    queryset = SupportGroup.objects.all()
    permission_classes = (IsPersonPermission, GroupFinancePermission)
    serializer_class = FinanceHistoryRow

    def get(self, request, *args, **kwargs):
        group = self.get_object()

        return Response(
            status=status.HTTP_200_OK,
            data={
                "allocsFutur": get_futur_monthly_dons_give(group),
                "cotisationFutur": get_latest_cotisation_given(group),
                "cnsFutur": get_latest_cns_given(group),
            },
        )


class GroupHistoryFinanceAPIView(ListAPIView):
    permission_classes = (
        IsPersonPermission,
        GroupFinancePermission,
    )
    pagination_class = APIPageNumberPagination
    serializer_class = FinanceHistoryRow

    def get_queryset(self):
        group_pk = self.kwargs["group_pk"]
        group = SupportGroup.objects.get(pk=group_pk)
        account_name = get_account_name_for_group(group)

        income = self.request.query_params.get("income", None)
        category = self.request.query_params.get("category", None)
        query_from = self.request.query_params.get("from", None)
        to = self.request.query_params.get("to", None)
        order = self.request.query_params.get("order", "-datetime")

        if income:
            if income == "depense":
                operations = AccountOperation.objects.filter(
                    Q(source=account_name) & ~Q(destination=account_name)
                )
            elif income == "revenu":
                operations = AccountOperation.objects.filter(
                    ~Q(source=account_name) & Q(destination=account_name)
                )
        else:
            operations = AccountOperation.objects.filter(
                Q(source=account_name) | Q(destination=account_name)
            )

        if category:
            if category == "DONS":
                operations = operations.filter(source=DONATIONS_ACCOUNT)
            elif category == "CNS":
                operations = operations.filter(source=CNS_ACCOUNT)
            elif category == "COTISATIONS":
                operations = operations.filter(source=COTISATIONS_ACCOUNT)
            else:
                operations = operations.filter(spending_request__category=category)

        if query_from:
            operations = operations.filter(created__gt=query_from)

        if to:
            operations = operations.filter(created__lt=to)

        return operations.order_by(order)
