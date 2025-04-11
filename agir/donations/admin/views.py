from django.contrib.auth.decorators import permission_required
from django.core.exceptions import PermissionDenied
from django.http import HttpResponseRedirect, HttpResponse
from django.shortcuts import get_object_or_404
from django.template.response import TemplateResponse
from django.urls import reverse
from django.views.generic import DetailView

from agir.donations.admin.actions import save_spending_request_admin_review
from agir.donations.admin.forms import HandleRequestForm
from agir.donations.admin.generate_spending_request_pdf import (
    SpendingRequestGenerationPdf,
)
from agir.donations.models import SpendingRequest
from agir.donations.spending_requests import admin_summary
from agir.lib.admin.panels import AdminViewMixin
import logging
import io


@permission_required("donations.review_spendingrequest", raise_exception=True)
def spending_request_download_all_documents(request, pk):
    spending_request = get_object_or_404(SpendingRequest, pk=pk)

    generation = SpendingRequestGenerationPdf(spending_request)
    generated_pdf = generation.generate()

    pdf_buffer = io.BytesIO()
    generated_pdf.write(pdf_buffer)
    pdf_buffer.seek(0)
    response = HttpResponse(pdf_buffer, content_type="application/pdf")
    response["Content-Transfer-Encoding"] = "binary"
    response["Content-Disposition"] = f'inline; filename="{generation.get_file_name()}"'
    response.write(generated_pdf)

    return response


class HandleRequestView(AdminViewMixin, DetailView):
    model = SpendingRequest
    template_name = "admin/donations/handle_request.html"
    form_class = HandleRequestForm

    def dispatch(self, request, *args, **kwargs):
        if not request.user.has_perm("donations.review_spendingrequest"):
            raise PermissionDenied
        return super().dispatch(request, *args, **kwargs)

    def get_form(self):
        kwargs = {"initial": {"bank_transfer_label": self.object.bank_transfer_label}}
        if self.request.method in ["POST", "PUT"]:
            kwargs.update({"data": self.request.POST})

        return self.form_class(**kwargs)

    def get_context_data(self, **kwargs):
        if "form" not in kwargs:
            kwargs["form"] = self.get_form()

        return super().get_context_data(
            title="Résumé des événements",
            spending_request=self.object,
            documents=self.object.documents.filter(deleted=False),
            file_name_documents=self.object.get_download_file_name(),
            fields=admin_summary(self.object),
            history=self.object.get_history(admin=True),
            **self.get_admin_helpers(kwargs["form"], kwargs["form"].fields),
            **kwargs,
        )

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()

        if form.is_valid():
            to_status = form.cleaned_data["status"]
            comment = form.cleaned_data.get("comment", None)
            bank_transfer_label = form.cleaned_data.get("bank_transfer_label", "")
            save_spending_request_admin_review(
                self.object,
                to_status=to_status,
                comment=comment,
                bank_transfer_label=bank_transfer_label,
            )

            return HttpResponseRedirect(
                reverse("admin:donations_spendingrequest_changelist")
            )

        return TemplateResponse(
            request, self.template_name, context=self.get_context_data(form=form)
        )
