from agir.groups.models import Membership, SupportGroup
from rest_framework.test import APITestCase
from agir.people.models import Person
from ..models import SupportGroup, Membership


class MembershipFinanceManagerTest(APITestCase):
    def setUp(self):
        self.supportgroup = SupportGroup.objects.create(name="Test")

        self.boucle_departementale = SupportGroup.objects.create(
            name="Boucle", type=SupportGroup.TYPE_BOUCLE_DEPARTEMENTALE
        )

        self.person = Person.objects.create_insoumise(email="marc.machin@truc.com")

        self.privileged_user = Person.objects.create_superperson("super@user.fr", None)

    def test_membership_localgroup_referent_is_finance_manager(self):
        membership = Membership.objects.create(
            person=self.person,
            supportgroup=self.supportgroup,
            membership_type=Membership.MEMBERSHIP_TYPE_REFERENT,
        )

        self.assertTrue(membership.is_finance_manager)

    def test_membership_localgroup_gestionnaire_is_not_finance_manager(self):
        membership = Membership.objects.create(
            person=self.person,
            supportgroup=self.supportgroup,
            membership_type=Membership.MEMBERSHIP_TYPE_MANAGER,
        )

        self.assertTrue(membership.is_finance_manager)

    def test_membership_boucle_departemental_with_finance_privilege_is_finance_manager(
        self,
    ):
        membership = Membership.objects.create(
            person=self.person,
            supportgroup=self.boucle_departementale,
            membership_type=Membership.MEMBERSHIP_TYPE_MANAGER,
            has_finance_managing_privilege=True,
        )

        self.assertTrue(membership.is_finance_manager)

    def test_membership_boucle_departemental_without_finance_privilege_is_not_finance_manager(
        self,
    ):
        membership = Membership.objects.create(
            person=self.person,
            supportgroup=self.boucle_departementale,
            membership_type=Membership.MEMBERSHIP_TYPE_MANAGER,
            has_finance_managing_privilege=False,
        )

        self.assertFalse(membership.is_finance_manager)
