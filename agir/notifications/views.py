from rest_framework.generics import ListCreateAPIView, DestroyAPIView

from agir.lib.rest_framework_permissions import IsPersonPermission
from agir.notifications.serializers import SubscriptionSerializer

from .models import Subscription


class ListCreateDestroySubscriptionAPIView(ListCreateAPIView, DestroyAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = (IsPersonPermission,)
    queryset = Subscription.objects.all()

    def get_queryset(self):
        return self.queryset.filter(person=self.request.user.person).select_related(
            "membership", "person"
        )

    def get_object(self):
        if self.request.method == "DELETE":
            subscription_ids = self.request.data.get("ids", [])
            return self.get_queryset().filter(pk__in=subscription_ids)
        return super().get_object()

    def get_serializer(self, *args, **kwargs):
        kwargs.update({"many": True})
        return super().get_serializer(*args, **kwargs)
