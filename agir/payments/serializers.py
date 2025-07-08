from django.conf import settings
from django.utils.module_loading import import_string
from rest_framework import serializers

from agir.checks import AbstractCheckPaymentMode
from agir.payments.models import Payment
from agir.people.models import Person

_payment_classes = [import_string(name) for name in settings.PAYMENT_MODES]


class PaymentSerializer(serializers.Serializer):
    person = (serializers.PrimaryKeyRelatedField(queryset=Person.objects.all()),)
    created = serializers.DateTimeField(read_only=True)
    type = serializers.CharField()
    mode = serializers.CharField()
    status = serializers.IntegerField()
    price = serializers.IntegerField()
    details = serializers.SerializerMethodField()

    def get_details(self, obj):
        current_mode = next(filter(lambda m: m.id == obj.mode, _payment_classes), None)

        if current_mode is not None and isinstance(
            current_mode(), AbstractCheckPaymentMode
        ):
            return {
                "order": current_mode.order,
                "address": current_mode.address,
                "information": current_mode.additional_information,
            }

    class Meta:
        model = Payment
        fields = (
            "person",
            "email",
            "first_name",
            "created",
            "type",
            "mode",
            "mode",
            "status",
            "price",
            "meta",
        )
