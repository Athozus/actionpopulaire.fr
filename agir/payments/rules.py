import rules

from agir.payments.models import Payment


@rules.predicate
def is_owner_of_payment(role, obj=None):
    if obj is None:
        return False
    if isinstance(obj, Payment):
        return role.person.id == obj.person.id
    return False


rules.add_perm("payments.own_payment", is_owner_of_payment)
