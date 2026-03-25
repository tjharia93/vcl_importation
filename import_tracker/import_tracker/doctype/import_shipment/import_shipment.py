import frappe
from frappe.model.document import Document


class ImportShipment(Document):
	def before_insert(self):
		if not getattr(self, "naming_series", None):
			self.naming_series = "SHIP-.YYYY.-.#####"

	def before_save(self):
		self.update_status()

	def update_status(self):
		if self.date_supplier_paid:
			self.status = "Closed"
		elif self.date_clearing_docs:
			self.status = "Clearing Docs Received"
		elif self.date_delivered:
			self.status = "Delivered"
		elif self.date_kra_docs_received:
			self.status = "KRA Docs Received"
		elif self.date_invoice_received:
			self.status = "Invoice Received"
		elif self.date_po_issued:
			self.status = "PO Issued"
		else:
			self.status = "PI Received"

	def validate(self):
		if self.purchase_order and self.supplier:
			po_supplier = frappe.db.get_value("Purchase Order", self.purchase_order, "supplier")
			if po_supplier and po_supplier != self.supplier:
				frappe.throw("The selected Purchase Order does not belong to this Supplier.")


@frappe.whitelist()
def flag_overdue_shipments():
	from datetime import date, timedelta

	cutoff = date.today() - timedelta(days=14)
	shipments = frappe.get_all(
		"Import Shipment",
		filters={"status": ["!=", "Closed"]},
		fields=[
			"name", "status", "date_pi_received", "date_po_issued",
			"date_invoice_received", "date_kra_docs_received", "date_kra_paid",
			"date_delivered", "date_clearing_docs", "date_supplier_paid"
		]
	)

	date_fields = [
		"date_pi_received", "date_po_issued", "date_invoice_received",
		"date_kra_docs_received", "date_kra_paid", "date_delivered",
		"date_clearing_docs", "date_supplier_paid"
	]

	for s in shipments:
		filled_dates = [s[f] for f in date_fields if s.get(f)]
		if not filled_dates:
			continue
		last_activity = max(filled_dates)
		if last_activity <= cutoff:
			doc = frappe.get_doc("Import Shipment", s["name"])
			doc.add_comment(
				"Comment",
				f"No progress in over 14 days. Last activity: {last_activity}. Current status: {s['status']}."
			)
