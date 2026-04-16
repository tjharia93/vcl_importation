import frappe
from frappe.model.document import Document
from frappe.utils import getdate, today


class ImportShipment(Document):
    def before_insert(self):
        if not getattr(self, "naming_series", None):
            self.naming_series = "SHIP-.YYYY.-.#####"
        self._populate_description_from_po()

    def before_save(self):
        self._refresh_from_linked_docs()
        self._compute_status()

    def validate(self):
        self._validate_unique_po()

    def _validate_unique_po(self):
        if self.purchase_order:
            existing = frappe.db.get_value(
                "Import Shipment",
                {"purchase_order": self.purchase_order, "name": ["!=", self.name]},
                "name",
            )
            if existing:
                frappe.throw(
                    f"Import Shipment {existing} already exists for this Purchase Order."
                )

    def _populate_description_from_po(self):
        if self.purchase_order and not self.description:
            items = frappe.get_all(
                "Purchase Order Item",
                filters={"parent": self.purchase_order},
                fields=["item_name"],
                limit=5,
            )
            if items:
                self.description = ", ".join(i.item_name for i in items)

    def _refresh_from_linked_docs(self):
        """Pull latest field values from linked PO and PI."""
        if self.purchase_order:
            po = frappe.db.get_value(
                "Purchase Order",
                self.purchase_order,
                ["supplier", "order_confirmation_no", "transaction_date",
                 "currency", "grand_total"],
                as_dict=True,
            )
            if po:
                self.supplier = po.supplier
                self.order_confirmation_no = po.order_confirmation_no
                self.po_date = po.transaction_date
                self.currency = po.currency
                self.proforma_value = po.grand_total

        if self.purchase_invoice:
            pi = frappe.db.get_value(
                "Purchase Invoice",
                self.purchase_invoice,
                ["grand_total", "base_total_taxes_and_charges",
                 "custom_bill_of_lading_number", "custom_shipping_line",
                 "custom_expected_date_of_delivery_to_port",
                 "custom_number_of_containers"],
                as_dict=True,
            )
            if pi:
                self.invoice_value = pi.grand_total
                self.kra_duty_amount = pi.base_total_taxes_and_charges
                self.bill_of_lading = pi.custom_bill_of_lading_number
                self.shipping_line = pi.custom_shipping_line
                self.eta_port = pi.custom_expected_date_of_delivery_to_port
                self.num_containers = pi.custom_number_of_containers

    def _compute_status(self):
        """Derive status from PO/PI document states and manual fields."""
        old_status = self.status

        if self._is_supplier_paid():
            self.status = "Closed"
        elif self._is_clearing_complete():
            self.status = "Clearing Complete"
        elif self.date_delivered or self._has_purchase_receipt():
            self.status = "Delivered"
            if not self.date_delivered and self._has_purchase_receipt():
                self.date_delivered = self._get_receipt_date()
        elif self.kra_duty_paid:
            self.status = "KRA Duties Paid"
        elif self._is_kra_docs_received():
            self.status = "KRA Docs Received"
        elif self.purchase_invoice:
            self.status = "Invoice Received"
        else:
            self.status = "PO Issued"

        # Record stage dates when status advances
        self._record_stage_date(old_status)

    def _record_stage_date(self, old_status):
        """Set the date when a stage is first reached."""
        current = today()

        if not self.date_po_issued and self.po_date:
            self.date_po_issued = self.po_date

        if not self.date_invoice_received and self.purchase_invoice:
            pi_date = frappe.db.get_value(
                "Purchase Invoice", self.purchase_invoice, "posting_date"
            )
            self.date_invoice_received = pi_date or current

        if not self.date_kra_docs_received and self.status in (
            "KRA Docs Received", "KRA Duties Paid", "Delivered",
            "Clearing Complete", "Closed",
        ):
            self.date_kra_docs_received = current

        if not self.date_clearing_complete and self.status in (
            "Clearing Complete", "Closed",
        ):
            self.date_clearing_complete = current

        if not self.date_closed and self.status == "Closed":
            self.date_closed = current

    def _is_kra_docs_received(self):
        if not self.purchase_invoice:
            return False
        return frappe.db.get_value(
            "Purchase Invoice", self.purchase_invoice,
            "custom_kra_invoice_received",
        )

    def _is_clearing_complete(self):
        """All PI import checklist items must be ticked."""
        if not self.purchase_invoice:
            return False
        checklist_fields = [
            "custom_supplier_invoice_received",
            "custom_shipping_line_details_updated",
            "custom_kra_invoice_received",
            "custom_awanad_cfs_invoice_received",
            "custom_habo_agencies_invoice_received",
            "custom_shipping_line_invoice_received",
        ]
        values = frappe.db.get_value(
            "Purchase Invoice", self.purchase_invoice,
            checklist_fields, as_dict=True,
        )
        if not values:
            return False
        return all(values.get(f) for f in checklist_fields)

    def _has_purchase_receipt(self):
        if not self.purchase_order:
            return False
        return frappe.db.exists(
            "Purchase Receipt Item",
            {"purchase_order": self.purchase_order, "docstatus": 1},
        )

    def _get_receipt_date(self):
        if not self.purchase_order:
            return None
        pr_name = frappe.db.get_value(
            "Purchase Receipt Item",
            {"purchase_order": self.purchase_order, "docstatus": 1},
            "parent",
        )
        if pr_name:
            return frappe.db.get_value("Purchase Receipt", pr_name, "posting_date")
        return None

    def _is_supplier_paid(self):
        if not self.purchase_invoice:
            return False
        outstanding = frappe.db.get_value(
            "Purchase Invoice", self.purchase_invoice, "outstanding_amount"
        )
        return outstanding is not None and outstanding <= 0


# ---------------------------------------------------------------------------
# Doc-event hooks (called from hooks.py)
# ---------------------------------------------------------------------------

def on_po_submit(doc, method):
    """Auto-create Import Shipment when an Import PO is submitted."""
    if getattr(doc, "order_type", None) != "Import":
        return
    if frappe.db.exists("Import Shipment", {"purchase_order": doc.name}):
        return

    shipment = frappe.new_doc("Import Shipment")
    shipment.purchase_order = doc.name
    shipment.insert(ignore_permissions=True)
    frappe.msgprint(
        f"Import Shipment <b>{shipment.name}</b> created.",
        indicator="green",
        alert=True,
    )


def on_pi_update(doc, method):
    """Auto-link PI to Import Shipment and refresh status on PI changes."""
    if getattr(doc, "custom_purchase_invoice_type", None) != "Importation":
        return

    # Already linked to an Import Shipment? Just refresh it.
    shipment_name = frappe.db.get_value(
        "Import Shipment", {"purchase_invoice": doc.name}, "name"
    )
    if shipment_name:
        frappe.get_doc("Import Shipment", shipment_name).save(
            ignore_permissions=True
        )
        return

    # Not linked yet — find the Import Shipment via PO references in PI items
    po_names = {item.purchase_order for item in doc.items if item.purchase_order}

    for po_name in po_names:
        shipment_name = frappe.db.get_value(
            "Import Shipment",
            {"purchase_order": po_name, "purchase_invoice": ["is", "not set"]},
            "name",
        )
        if shipment_name:
            shipment = frappe.get_doc("Import Shipment", shipment_name)
            shipment.purchase_invoice = doc.name
            shipment.save(ignore_permissions=True)
            frappe.msgprint(
                f"Linked to Import Shipment <b>{shipment.name}</b>",
                indicator="green",
                alert=True,
            )
            break


def on_pr_submit(doc, method):
    """Set delivery date on Import Shipment when goods are received."""
    po_names = {item.purchase_order for item in doc.items if item.purchase_order}
    for po_name in po_names:
        shipment_name = frappe.db.get_value(
            "Import Shipment", {"purchase_order": po_name}, "name"
        )
        if shipment_name:
            shipment = frappe.get_doc("Import Shipment", shipment_name)
            if not shipment.date_delivered:
                shipment.date_delivered = doc.posting_date
            shipment.save(ignore_permissions=True)


def on_payment_submit(doc, method):
    """Refresh Import Shipment when a payment is made against a linked PI."""
    for ref in doc.references:
        if ref.reference_doctype == "Purchase Invoice":
            shipment_name = frappe.db.get_value(
                "Import Shipment",
                {"purchase_invoice": ref.reference_name},
                "name",
            )
            if shipment_name:
                frappe.get_doc("Import Shipment", shipment_name).save(
                    ignore_permissions=True
                )


# ---------------------------------------------------------------------------
# Whitelisted API
# ---------------------------------------------------------------------------

@frappe.whitelist()
def refresh_shipment_data(shipment_name):
    """Manual refresh triggered from the form's 'Refresh from PO/PI' button."""
    frappe.has_permission("Import Shipment", "write", throw=True)
    doc = frappe.get_doc("Import Shipment", shipment_name)
    doc.save(ignore_permissions=True)
    return doc.as_dict()


# ---------------------------------------------------------------------------
# Scheduler jobs
# ---------------------------------------------------------------------------

def bulk_refresh_statuses():
    """Daily job: recompute status for every open Import Shipment."""
    open_shipments = frappe.get_all(
        "Import Shipment",
        filters={"status": ["!=", "Closed"]},
        pluck="name",
    )
    for name in open_shipments:
        try:
            frappe.get_doc("Import Shipment", name).save(ignore_permissions=True)
        except Exception:
            frappe.log_error(f"Failed to refresh Import Shipment {name}")
    if open_shipments:
        frappe.db.commit()
