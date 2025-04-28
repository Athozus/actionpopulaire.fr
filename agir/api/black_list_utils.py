from celery.utils.term import BLACK

from agir.api import settings
from django.core.exceptions import ValidationError
import re

import logging

logger = logging.getLogger(__name__)


class BlackListFieldMixin:
    def clean(self):
        class_name = self.__class__.__name__
        for field in self._meta.fields:
            field_name = field.name
            value = str(getattr(self, field_name, "")).lower()
            if not field_allowed(class_name, field_name, value):
                logger.warning(f"{value} not allowed for {class_name}.{field_name}")
                raise ValidationError(
                    "Une erreur s'est produite lors de l'enregistrement.",
                    code="wrong",
                )


def word_is_not_allowed(word, value):
    if str(word).startswith("\\"):
        match = re.findall(rf"{word}", value, re.IGNORECASE)
        return len(match) > 0
    return str(word).lower() in value


def field_allowed(model, field, value):
    attribute = f"{model}.{field}".lower()
    if attribute in settings.BLACK_LIST_DF:
        column = settings.BLACK_LIST_DF[attribute].dropna()
        result = column.loc[column.apply(lambda word: word_is_not_allowed(word, value))]
        return len(result.index) == 0
    return True
