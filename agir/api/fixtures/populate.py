from agir.api.fixtures.boucles_departementales import ajout_boucles_departementales
from agir.api.fixtures.person import populate_people_groups, get_superperson
import logging
import sys

logger = logging.getLogger(__name__)

logger.info(
    """
=========================================
======= PEUPLER LA BASE DE DONNEES ======
=========================================
"""
)

if get_superperson() is None:
    logger.error(
        "> Super personne pas créé, merci de la créer avant de peupler la BD, vérifier le README si besoin."
    )
    sys.exit(1)

# l'ordre est important pour pouvoir mettre à jour les boucles départementales avec les groupes crées
populate_people_groups()
ajout_boucles_departementales()

logger.info(
    """
===========DONE =========
"""
)
