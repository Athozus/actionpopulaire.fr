import tempfile

from faker.utils.text import slugify

from agir.diffusion.models import SMSDiffusion
from agir.lib.sms import SMSException
from agir.lib.sms.sfr import DmcWSDiffusion, upload_file_to_ws
from agir.mailing.admin.actions import (
    extract_people_for_sms,
)
from agir.mailing.models import Segment


def create_dmc_diffusion_with_segment(diffusion: SMSDiffusion, segment: Segment):
    dmc_diffusion = DmcWSDiffusion()

    remote_diffusion_id = dmc_diffusion.create_sms_diffusion(diffusion)

    people = extract_people_for_sms(segment)
    with tempfile.NamedTemporaryFile(suffix=".csv") as temp:
        people.to_csv(
            temp.name, index=False, sep=";", encoding="latin1", errors="ignore"
        )
        filename_uploaded = upload_file_to_ws(temp.name)
        document_id = dmc_diffusion.add_document(
            filename_uploaded, slugify(diffusion.title) + ".csv"
        )
        dmc_diffusion.add_contact_document_to_broadcast(
            document_id, remote_diffusion_id
        )
    return remote_diffusion_id


def trigger_diffusion(broadcast_id):
    dmc_diffusion = DmcWSDiffusion()
    return dmc_diffusion.activate_broadcast(broadcast_id)


def update_diffusion(diffusion: SMSDiffusion):
    dmc_diffusion = DmcWSDiffusion()
    return dmc_diffusion.update_broadcast(diffusion.broadcast_id, diffusion)


def get_diffusion_informations(diffusion: SMSDiffusion):
    dmc = DmcWSDiffusion()
    result = dmc.get_broadcast(diffusion.broadcast_id)
    if "response" in result:
        return result["response"]
    raise SMSException(
        f"Impossible d'avoir les informations de diffusion {diffusion.broadcast_id}"
    )
