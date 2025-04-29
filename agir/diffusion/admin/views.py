from django.shortcuts import get_object_or_404, render

from agir.diffusion.models import SMSDiffusion
from agir.mailing.admin.actions import extract_people_for_sms_query


def segment_sms_people_size(request, pk):
    diffusion = get_object_or_404(SMSDiffusion, id=pk)

    if diffusion.segment is None:
        return "-"

    size = extract_people_for_sms_query(diffusion.segment).count()

    return render(
        request,
        "admin/diffusion/segment_size.html",
        {
            "people_size": size,
        },
    )
