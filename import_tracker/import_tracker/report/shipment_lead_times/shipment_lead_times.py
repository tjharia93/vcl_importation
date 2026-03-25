import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment",               "fieldname": "name",               "fieldtype": "Link", "options": "Import Shipment", "width": 130},
		{"label": "Supplier",               "fieldname": "supplier",           "fieldtype": "Link", "options": "Supplier",        "width": 150},
		{"label": "Description",            "fieldname": "description",        "fieldtype": "Data",                               "width": 180},
		{"label": "PI Date",                "fieldname": "date_pi_received",   "fieldtype": "Date",                               "width": 100},
		{"label": "Closed Date",            "fieldname": "date_supplier_paid", "fieldtype": "Date",                               "width": 100},
		{"label": "PI\u2192PO (days)",      "fieldname": "pi_to_po",           "fieldtype": "Int",                                "width": 100},
		{"label": "PO\u2192Invoice (days)", "fieldname": "po_to_inv",          "fieldtype": "Int",                                "width": 110},
		{"label": "Invoice\u2192Delivery (days)", "fieldname": "inv_to_del",   "fieldtype": "Int",                                "width": 140},
		{"label": "Total Days",             "fieldname": "total_days",         "fieldtype": "Int",                                "width": 100},
	]

	data = frappe.db.sql("""
		SELECT
			name, supplier, description,
			date_pi_received, date_supplier_paid,
			DATEDIFF(date_po_issued,         date_pi_received)    AS pi_to_po,
			DATEDIFF(date_invoice_received,  date_po_issued)      AS po_to_inv,
			DATEDIFF(date_delivered,         date_invoice_received) AS inv_to_del,
			DATEDIFF(date_supplier_paid,     date_pi_received)    AS total_days
		FROM `tabImport Shipment`
		WHERE status = 'Closed'
		ORDER BY date_supplier_paid DESC
	""", as_dict=True)

	return columns, data
