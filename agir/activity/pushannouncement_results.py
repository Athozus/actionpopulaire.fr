from agir.api.redis import get_auth_redis_client as get_redis_client


def get_as_int_or_default(value, default):
    if value is None:
        return default
    return int(value)


class PushAnnouncementResults:
    def __init__(self, announcement_id):
        self.id = announcement_id

    def get_redis_key(self):
        return f"push_announcement_{self.id}"

    def get_redis_failure_key(self):
        return self.get_redis_key() + "_failures"

    def get_failures_amount(self):
        return get_as_int_or_default(
            get_redis_client().get(self.get_redis_failure_key()), 0
        )

    def incr_failures_amount(self, amount: int = 1):
        return get_redis_client().incr(self.get_redis_failure_key(), amount)

    def get_redis_success_key(self):
        return self.get_redis_key() + "_success"

    def get_success_amount(self):
        return get_as_int_or_default(
            get_redis_client().get(self.get_redis_success_key()), 0
        )

    def incr_success_amount(self, amount: int = 1):
        return get_redis_client().incr(self.get_redis_success_key(), amount)
