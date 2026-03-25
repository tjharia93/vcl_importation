import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment",    "fieldname": "name",        "fieldtype": "Link",  "options": "Import Shipment", "width": 130},
		{"label": "Supplier",    "fieldname": "supplier",    "fieldtype": "Link",  "options": "Supplier",        "width": 150},
		{"label": "Description", "fieldname": "description", "fieldtype": "Data",                                "width": 200},
		{"label": "Status",      "fieldname": "status",      "fieldtype": "Data",                                "width": 160},
		{"label": "ETA Port",    "fieldname": "eta_port",    "fieldtype": "Date",                                "width": 110},
		{"label": "Days Open",   "fieldname": "days_open",   "fieldtype": "Int",                                 "width": 90},
		{"label": "Assigned To", "fieldname": "assigned_to", "fieldtype": "Link",  "options": "User",            "width": 130},
	]

	data = frappe.db.sql("""
		SELECT
			name, supplier, description, status, eta_port, assigned_to,
			DATEDIFF(CURDATE(), date_pi_received) AS days_open
		FROM `tabImport Shipment`
		WHERE status != 'Closed'
		ORDER BY
			FIELD(status,
				'PI Received', 'PO Issued', 'Invoice Received',
				'KRA Docs Received', 'Delivered', 'Clearing Docs Received'
			),
			date_pi_received
	""", as_dict=True)

	return columns, data
