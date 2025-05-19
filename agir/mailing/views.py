from django.shortcuts import get_object_or_404, render

from agir.mailing.admin.actions import extract_people_for_sms_query
from agir.mailing.models import Segment

UNIT_PRICE_SMS = 0.06


def subscriber_count_view(request, pk):
    segment = get_object_or_404(Segment, id=pk)
    return render(request, "admin/subscriber_count.html", {"segment": segment})


def people_count_view(request, pk):
    segment = get_object_or_404(Segment, id=pk)
    return render(request, "admin/people_count.html", {"segment": segment})


def people_sms_count_view(request, pk):
    segment = get_object_or_404(Segment, id=pk)
    size = extract_people_for_sms_query(segment).count()

    return render(
        request,
        "admin/subscribers_sms_count.html",
        {
            "people_size": size,
            "price_estimation": size * UNIT_PRICE_SMS,
            "segment": segment,
        },
    )
