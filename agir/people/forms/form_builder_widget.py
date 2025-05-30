from django.forms import widgets
import json
from django.template import loader


class FormBuilderWidget(widgets.Textarea):
    def get_context(self, name, value, attrs):
        attrs = {**self.attrs, **(attrs or {})}
        context = super().get_context(name, value, attrs)
        context["custom_fields"] = attrs.get("custom_fields") if attrs else None

        return context

    def render(self, name, value, attrs=None, renderer=None):
        attrs = {**self.attrs, **(attrs or {})}

        custom_fields = attrs.get("custom_fields", "")

        json_value = json.dumps(custom_fields) if custom_fields else "{}"

        return loader.get_template("admin/personforms/form_builder_widget.html").render(
            {"custom_fields": json_value}
        )

    class Media:
        css = {}
        js = ("admin/form/js/formBuilder.js",)
