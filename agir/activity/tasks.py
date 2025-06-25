import numpy as np
from django.db import transaction
from django.utils import timezone
from firebase_admin import messaging

from agir.activity.models import PushAnnouncement
from agir.activity.pushannouncement_results import PushAnnouncementResults
from agir.events.views import notification_listener
from agir.lib.celery import gcm_push_task

# https://firebase.google.com/docs/cloud-messaging/send-message#send-messages-to-multiple-devices
LIMIT_REGISTRATION_TOKEN_PER_INVOCATION = 500


def redis_key_per_push_announcement(id):
    return f"pushannouncement_{id}"


@gcm_push_task()
def prepare_push_notification_from_segment(push_announcement_id):
    push_announcement = PushAnnouncement.objects.get(pk=push_announcement_id)
    segment = push_announcement.segment

    create_push_announcement_activities.delay(push_announcement_id)
    devices = push_announcement.get_gcm_subscriber_devices(segment)
    tokens = np.array(devices.values_list("registration_id", flat=True))
    if tokens.size > LIMIT_REGISTRATION_TOKEN_PER_INVOCATION:
        for chunk_tokens in np.array_split(
            tokens, LIMIT_REGISTRATION_TOKEN_PER_INVOCATION
        ):
            send_push_notification.delay(push_announcement_id, list(chunk_tokens))
    else:
        send_push_notification.delay(push_announcement_id, list(tokens))


@gcm_push_task()
def create_push_announcement_activities(push_announcement_id):
    from agir.activity.models import Activity

    push_announcement = PushAnnouncement.objects.get(pk=push_announcement_id)
    with transaction.atomic():
        Activity.objects.bulk_create(
            [
                Activity(
                    type=Activity.TYPE_PUSH_ANNOUNCEMENT,
                    recipient_id=recipient_id,
                    push_announcement_id=push_announcement.id,
                    status=Activity.STATUS_UNDISPLAYED,
                    push_status=Activity.STATUS_DISPLAYED,
                )
                for recipient_id in push_announcement.recipient_ids
            ],
            ignore_conflicts=True,
            batch_size=500,
        )


@gcm_push_task()
def send_push_notification(push_announcement_id, tokens):
    push_announcement = PushAnnouncement.objects.get(pk=push_announcement_id)
    notification_message = push_announcement.get_fcm_kwargs()
    message = messaging.MulticastMessage(
        data=notification_message.data,
        android=notification_message.android,
        apns=notification_message.apns,
        notification=notification_message.notification,
        tokens=tokens,
    )

    results = PushAnnouncementResults(push_announcement_id)
    response = messaging.send_each_for_multicast(message)
    results.incr_success_amount(response.success_count)
    results.incr_failures_amount(response.failure_count)
