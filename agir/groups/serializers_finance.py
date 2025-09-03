from agir.donations.allocations import COTISATIONS_ACCOUNT, CNS_ACCOUNT
import logging

from rest_framework import serializers
from rest_framework.fields import empty

from ..donations.allocations import DONATIONS_ACCOUNT
from ..donations.models import SpendingRequest, AccountOperation

logger = logging.getLogger(__name__)


class FinanceHistoryRow(serializers.ModelSerializer):
    id = serializers.SerializerMethodField(read_only=True)
    amount = serializers.SerializerMethodField(read_only=True)
    datetime = serializers.DateTimeField(read_only=True)
    title = serializers.SerializerMethodField(read_only=True)
    category = serializers.SerializerMethodField(read_only=True)
    spendingDate = serializers.SerializerMethodField(
        read_only=True, method_name="get_spending_date"
    )

    def __init__(self, instance=None, data=empty, **kwargs):
        super().__init__(instance, data, **kwargs)
        self.spending_request = None

    def get_id(self, operation: AccountOperation):
        if self.get_spending_request(operation):
            return self.get_spending_request(operation).id
        return operation.id

    def get_spending_date(self, operation: AccountOperation):
        if self.get_spending_request(operation):
            return self.get_spending_request(operation).spending_date
        return None

    def get_spending_request(self, operation: AccountOperation):
        try:
            request = SpendingRequest.objects.get(account_operation__id=operation.id)
            return request
        except SpendingRequest.DoesNotExist:
            return None

    def get_title(self, obj):
        if self.get_spending_request(obj):
            return self.get_spending_request(obj).title
        elif obj.source == DONATIONS_ACCOUNT:
            return "Dons"
        elif obj.source == COTISATIONS_ACCOUNT:
            return "Cotisation d'élu·e"
        elif obj.source == CNS_ACCOUNT:
            return "Caisse nationale de solidarité"
        return "Operation"

    def get_category(self, obj):
        if self.get_spending_request(obj):
            return self.get_spending_request(obj).category
        elif isinstance(obj, AccountOperation):
            if obj.source == DONATIONS_ACCOUNT:
                return "DONS"
            elif obj.source == COTISATIONS_ACCOUNT:
                return "COTISATIONS"
            elif obj.source == CNS_ACCOUNT:
                return "CNS"
        return None

    def get_amount(self, obj):
        if "groupe" in obj.source:
            return -obj.amount
        return obj.amount

    class Meta:
        model = AccountOperation
        fields = ("id", "amount", "datetime", "title", "category", "spendingDate")
