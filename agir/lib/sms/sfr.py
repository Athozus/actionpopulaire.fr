import dataclasses
import json
import time
from dataclasses import dataclass
from enum import Enum
from typing import TypedDict
import requests
from django.conf import settings
from urllib3 import Retry, PoolManager

from agir.api.settings import SFR_DEFAULT_SENDER
from agir.diffusion.models import SMSDiffusion
from agir.lib.sms.common import SMSSendException, SMSException, CallPlanningId

# API DOC : https://assistance.utilisateur-relationclient.sfrbusiness.fr/dmc/
#         :https://www.dmc.sfr-sh.fr/ApiWorkshop/doc/DMCv1_SFD064-API-Declenchement_a_distance.pdf

BULK_GROUP_SIZE = 100
SMS_SCENARIO = 46367
SMS_CUSTOMIZE_ID = 62658

API_VERSION = "1.5.7"


class DMCBufferWSMedia(Enum):
    SMS = "SMS"


class DmcBufferError(Enum):
    AUTHENTICATION_FAILED = "KO<authentication_failed:{null}>"
    EMPTY_DMC_SERVICE_NAME = "KO<empty_dmcServiceName:{dmcServiceName vide}>"
    INVALID_JSON = "KO<Invalid JSON:{null}>"


import logging

logger = logging.getLogger(__name__)


def upload_file_to_ws(path):
    files = {"upload_file": open(path, "rb")}

    response = requests.post(
        f"https://www.dmc.sfr-sh.fr/DmcWS/{API_VERSION}/uploadService",
        files=files,
        data={
            "serviceId": settings.SFR_SERVICE_ID,
            "serviceWsPassword": settings.SFR_PASSWORD,
            "spaceId": settings.SFR_SPACE_ID,
            "lang": "fr_FR",
        },
    )
    if "error" not in str(response.content):
        return response.content.decode("utf-8").strip()
    raise SMSException(f"Impossible d'uploader le fichier vers le service {path}")


@dataclasses.dataclass
class SfrResponse(TypedDict):
    success: bool
    response: dict


class SfrServiceAuth:
    BASE_URL = f"https://www.dmc.sfr-sh.fr/DmcWS/{API_VERSION}/JsonService"
    SERVICE = ""

    def __init__(self):
        self.authentication = {
            "serviceId": settings.SFR_SERVICE_ID,
            "servicePassword": settings.SFR_PASSWORD,
            "spaceId": settings.SFR_SPACE_ID,
        }

    @staticmethod
    def handle_response(response, *args, **kwargs):
        if not response or response.text.startswith("KO"):
            raise SMSSendException(
                f"L'API SFR a rencontré une erreur {response.text if response else ''} - {response.content} lors de l'appel {response.url}",
                invalid=[],
            )
        if response.status_code != 200 and response.status_code != 201:
            raise SMSException(f"Erreur lors de la requête {response.url} : {response}")
        return response

    def _make_request(self, endpoint, data, service=None, max_attempt=1) -> SfrResponse:
        data = {"authenticate": json.dumps(self.authentication), **data}
        if service is None:
            service = self.SERVICE

        attempt = 0
        while attempt < max_attempt:
            attempt += 1
            try:
                response = requests.get(
                    f"{self.BASE_URL}/{service}/{endpoint}",
                    params=data,
                    hooks={"response": self.handle_response},
                )
                json_response = json.loads(response.content)
                if not json_response["success"]:
                    raise SMSException(
                        f"Request not succeeded {response.url}: {json_response}"
                    )
                return json_response
            except SMSException as e:
                if attempt == max_attempt:
                    raise e
                time.sleep(0.5)


class DmcWSDiffusion(SfrServiceAuth):
    SERVICE = "BroadcastWS"

    def create_sms_diffusion(self, sms_diffusion: SMSDiffusion):
        try:
            result = self._make_request(
                "createBroadcast",
                {
                    "broadcast": json.dumps(
                        {
                            "startDate": int(
                                sms_diffusion.start_date.timestamp() * 1000
                            ),
                            "stopDate": int(sms_diffusion.end_date.timestamp() * 1000),
                            "callPlanningId": CallPlanningId.PLANNING_24_7.value,
                            "description": sms_diffusion.title,
                            "scenarioId": SMS_SCENARIO,
                            "broadcastName": sms_diffusion.title,
                            "smsLong": False,
                        }
                    ),
                    "customizableMessage": json.dumps(
                        [
                            {
                                "messageFrom": SFR_DEFAULT_SENDER,
                                "text": sms_diffusion.message,
                                "multimediaType": 3,
                                "customizableId": SMS_CUSTOMIZE_ID,
                            }
                        ]
                    ),
                },
            )
            if "response" in result and result["success"] == True:
                return result["response"]["broadcastId"]
            raise SMSException(f"Impossible de créer la diffusion - {result}")
        except Exception as e:
            logger.error(f"Can't create sms diffusion id: {sms_diffusion.id}")
            raise SMSException(str(e))

    def add_document(self, file_source, file_name):
        """
        :param file_source:
        :param file_name:
        :return: response contains document created ID
        """
        result = self._make_request(
            "addDocument",
            {
                "fileSource": file_source,
                "fileName": file_name,
            },
            f"DocumentsWS",
        )
        return result["response"]

    def add_contact_document_to_broadcast(self, document_id, broadcast_id):
        return self._make_request(
            "insertContactFromDocument",
            {"documentId": document_id, "broadcastId": broadcast_id},
        )

    def update_broadcast(self, broadcast_id, diffusion: SMSDiffusion):
        return self._make_request(
            "updateBroadcast",
            {
                "broadcastId": broadcast_id,
                "valuesToChange": json.dumps(
                    {
                        "brStart": int(diffusion.start_date.timestamp() * 1000),
                        "brEnd": int(diffusion.end_date.timestamp() * 1000),
                    }
                ),
            },
        )

    def activate_broadcast(self, broadcast_id):
        return self._make_request(
            "activateBroadcast", {"broadcastId": broadcast_id}, max_attempt=4
        )

    def get_broadcast(self, broadcast_id):
        return self._make_request("getBroadcast", {"broadcastId": broadcast_id})


class DmcBufferWS(SfrServiceAuth):
    SERVICE = "MessagesUnitairesWS"
    TEMPLATE = {
        "transactional": "{message}",
        "marketing": "{message}\n\nSTOP au <#shortcode#>",
    }
    DEFAULT_TEMPLATE = TEMPLATE["marketing"]

    def __init__(self, sender=None, template=None):
        super().__init__()
        self.sender = sender if sender else settings.SFR_DEFAULT_SENDER
        self.template = self.TEMPLATE.get(template, self.DEFAULT_TEMPLATE)

    def send_sms(
        self,
        message,
        recipient,
    ):
        data = {
            "messageUnitaire": json.dumps(
                {
                    "media": DMCBufferWSMedia.SMS.value,
                    "from": self.sender,
                    "to": recipient.as_national,
                    "textMsg": self.template.format(message=message),
                }
            )
        }

        try:
            self._make_request("addSingleCall", data)
        except Exception as e:
            raise SMSSendException(
                str(e),
                invalid=[recipient],
            )

        # TODO: (maybe) check if the sms has actually been sent
        # cf.https://assistance.utilisateur-relationclient.sfrbusiness.fr/dmc/dmc-api-utilisation-de-dmcbufferws-json-2/

        return True


def send_sms(message, recipients, *, sender=None, template=None, **_):
    api_client = DmcBufferWS(sender, template)

    sent = set()
    not_sent = set()

    for recipient in recipients:
        ok = api_client.send_sms(message, recipient)
        sent.add(recipient.as_e164) if ok else not_sent.add(recipient.as_e164)

    return sent, not_sent
