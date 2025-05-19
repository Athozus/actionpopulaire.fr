from glom import glom, Coalesce
from rest_framework.response import Response
from rest_framework.views import APIView

from agir.diffusion.serializers import PushCraSerializer
from rest_framework import status
import logging

from agir.people.models import Person

logger = logging.getLogger(__name__)


class PushCraView(APIView):
    permission_classes = ()

    def post(self, request, *args, **kwargs):
        serializer = PushCraSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for sms in serializer.validated_data["status_report"]["sms"]:
            phone_number = sms["to"]
            content = glom(sms, Coalesce("status_list.0.info", default=None))
            sms_status = sms["status"]
            if (
                phone_number
                and sms_status == "ANSWERED"
                and content
                and content.upper().strip() == "STOP"
            ):
                people = Person.objects.filter(
                    contact_phone=phone_number, subscribed_sms=True
                )
                for person in people:
                    person.subscribed_sms = False
                    person.save()
                    logger.info(f"Unsubscribe user {person.id} from SMS")
        return Response(None, status=status.HTTP_204_NO_CONTENT)
