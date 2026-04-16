import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment", "fieldname": "name", "fieldtype": "Link", "options": "Import Shipment", "width": 150},
		{"label": "Supplier", "fieldname": "supplier", "fieldtype": "Link", "options": "Supplier", "width": 160},
		{"label": "Description", "fieldname": "description", "fieldtype": "Data", "width": 180},
		{"label": "PO Date", "fieldname": "date_po_issued", "fieldtype": "Date", "width": 100},
		{"label": "Closed Date", "fieldname": "date_closed", "fieldtype": "Date", "width": 100},
		{"label": "PO\u2192Invoice (days)", "fieldname": "po_to_inv", "fieldtype": "Int", "width": 120},
		{"label": "Invoice\u2192Delivery (days)", "fieldname": "inv_to_del", "fieldtype": "Int", "width": 140},
		{"label": "Delivery\u2192Closed (days)", "fieldname": "del_to_close", "fieldtype": "Int", "width": 130},
		{"label": "Total Days", "fieldname": "total_days", "fieldtype": "Int", "width": 100},
	]

	data = frappe.db.sql("""
		SELECT
			name, supplier, description,
			date_po_issued, date_closed,
			DATEDIFF(date_invoice_received, date_po_issued) AS po_to_inv,
			DATEDIFF(date_delivered, date_invoice_received) AS inv_to_del,
			DATEDIFF(date_closed, date_delivered) AS del_to_close,
			DATEDIFF(date_closed, date_po_issued) AS total_days
		FROM `tabImport Shipment`
		WHERE status = 'Closed'
		ORDER BY date_closed DESC
	""", as_dict=True)

	return columns, data
