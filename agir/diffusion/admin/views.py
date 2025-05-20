from django.shortcuts import get_object_or_404, render

from agir.diffusion.models import SMSDiffusion
from agir.lib.sms.common import SfrStatusCode
from agir.mailing.admin.actions import extract_people_for_sms_query
from agir.mailing.models import Segment


def diffusion_status(request, pk):
    from agir.diffusion.admin import get_diffusion_informations

    diffusion = get_object_or_404(SMSDiffusion, id=pk)
    if diffusion.broadcast_id:
        try:
            infos = get_diffusion_informations(diffusion)
            status = SfrStatusCode[infos["statusCode"]].value
        except Exception:
            status = "-"
    else:
        status = "-"

    return render(request, "admin/diffusion/diffusion_status.html", {"status": status})


import logging

logger = logging.getLogger(__name__)


def segment_sms_people_size(request, pk, segment_id):
    diffusion = get_object_or_404(SMSDiffusion, id=pk)

    segment = Segment.objects.get(pk=segment_id)
    if segment is None:
        return "-"

    size = extract_people_for_sms_query(segment).count()

    return render(
        request,
        "admin/diffusion/segment_size.html",
        {
            "people_size": size,
        },
    )
