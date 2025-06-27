import re
from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.filter
def highlight(text, search):
    if not search:
        return text
    pattern = re.escape(search)
    highlighted = re.sub(
        f"({pattern})", r"<mark>\1</mark>", str(text), flags=re.IGNORECASE
    )
    return mark_safe(highlighted)
