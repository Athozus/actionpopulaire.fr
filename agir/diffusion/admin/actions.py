import tempfile

from faker.utils.text import slugify

from agir.diffusion.models import SMSDiffusion
from agir.lib.sms import SMSException
from agir.lib.sms.sfr import DmcWSDiffusion, upload_file_to_ws
from agir.mailing.admin.actions import (
    extract_people_for_sms,
)


def create_diffusion_with_segment(diffusion: SMSDiffusion):
    dmc_diffusion = DmcWSDiffusion()

    remote_diffusion_id = dmc_diffusion.create_sms_diffusion(diffusion)

    people = extract_people_for_sms(diffusion.segment)
    with tempfile.NamedTemporaryFile(suffix=".csv") as temp:
        people.to_csv(temp.name, index=False, sep=";", encoding="latin1")
        filename_uploaded = upload_file_to_ws(temp.name)
        document_id = dmc_diffusion.add_document(
            filename_uploaded, slugify(diffusion.title) + ".csv"
        )
        dmc_diffusion.add_contact_document_to_broadcast(
            document_id, remote_diffusion_id
        )

    # at the end save the diffusion with the remote diffusion id
    diffusion.broadcast_id = remote_diffusion_id
    diffusion.save()


def check_broadcast_id(diffusion: SMSDiffusion):
    if diffusion.broadcast_id is None:
        raise ValueError(
            "La diffusion n'a pas été créée auprès du service distance (SFR)."
        )


def trigger_diffusion(diffusion: SMSDiffusion):
    """

    :param diffusion:
    :return: True when activation succeeded
    """
    check_broadcast_id(diffusion)
    dmc_diffusion = DmcWSDiffusion()
    return dmc_diffusion.activate_broadcast(diffusion.broadcast_id)


def update_diffusion(diffusion: SMSDiffusion):
    """
    :param diffusion:
    :return: True when activation succeeded
    """
    check_broadcast_id(diffusion)
    dmc_diffusion = DmcWSDiffusion()
    return dmc_diffusion.update_broadcast(diffusion.broadcast_id, diffusion)


def get_diffusion_informations(diffusion: SMSDiffusion):
    check_broadcast_id(diffusion)
    dmc = DmcWSDiffusion()
    result = dmc.get_broadcast(diffusion.broadcast_id)
    if "response" in result:
        return result["response"]
    raise SMSException(
        f"Impossible d'avoir les informations de diffusion {diffusion.broadcast_id}"
    )
