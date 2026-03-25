import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment",       "fieldname": "name",                    "fieldtype": "Link",     "options": "Import Shipment", "width": 130},
		{"label": "Supplier",       "fieldname": "supplier",                "fieldtype": "Link",     "options": "Supplier",        "width": 150},
		{"label": "Description",    "fieldname": "description",             "fieldtype": "Data",                                   "width": 200},
		{"label": "KRA Duty (KES)", "fieldname": "kra_duty_amount",         "fieldtype": "Currency", "options": "KES",             "width": 130},
		{"label": "Docs Received",  "fieldname": "date_kra_docs_received",  "fieldtype": "Date",                                   "width": 120},
		{"label": "Days Waiting",   "fieldname": "days_waiting",            "fieldtype": "Int",                                    "width": 100},
	]

	data = frappe.db.sql("""
		SELECT
			name, supplier, description, kra_duty_amount, date_kra_docs_received,
			DATEDIFF(CURDATE(), date_kra_docs_received) AS days_waiting
		FROM `tabImport Shipment`
		WHERE kra_duty_paid = 0
		  AND date_kra_docs_received IS NOT NULL
		ORDER BY date_kra_docs_received
	""", as_dict=True)

	return columns, data
