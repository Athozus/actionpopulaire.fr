from django.db import models

from agir.donations.allocations import get_cns_balance


class CNSDistribution(models.Model):
    montant = models.IntegerField(default=get_cns_balance)
    """
    Custom model pour permettre à la
    """

    class Meta:
        verbose_name = "CNS Distribution"
        managed = False  # Django ne crée pas de table

    def __str__(self):
        return "CNS Distribution"
