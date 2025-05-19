from rest_framework import serializers

"""
From the documentation : https://www.dmc.sfr-sh.fr/ApiWorkshop/doc/DMCv1_SFD064-API-Declenchement_a_distance.pdf
"""

STATUS_LIST = (
    "SENT",
    "RECEIVED",
    "ANSWERED",
    "CONVERTED",
    "ESTABLISHED",
    "TRANSFERED",
    "ENDED",
    "ABORTED",
    "ERROR/ABORTED",
)


class SmsStatusListSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    type = serializers.ChoiceField(
        choices=STATUS_LIST,
    )
    info = serializers.CharField(required=False)


class SmsSerializer(serializers.Serializer):
    space_id = serializers.CharField()
    status_list = SmsStatusListSerializer(many=True, required=False)
    to = serializers.CharField()
    date = serializers.DateTimeField()
    broadcast_id = serializers.CharField()
    ref_externe = serializers.CharField(required=False, allow_blank=True)
    call_id = serializers.CharField(required=False)
    contact_id = serializers.CharField(required=False)
    status = serializers.ChoiceField(choices=STATUS_LIST)


class StatusReportSerializer(serializers.Serializer):
    username = serializers.CharField()
    sms = serializers.ListSerializer(child=SmsSerializer())


class PushCraSerializer(serializers.Serializer):
    status_report = StatusReportSerializer()
