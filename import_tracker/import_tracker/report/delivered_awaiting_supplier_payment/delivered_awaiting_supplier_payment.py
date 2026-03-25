import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment",            "fieldname": "name",                     "fieldtype": "Link",     "options": "Import Shipment", "width": 130},
		{"label": "Supplier",            "fieldname": "supplier",                 "fieldtype": "Link",     "options": "Supplier",        "width": 150},
		{"label": "Description",         "fieldname": "description",              "fieldtype": "Data",                                   "width": 200},
		{"label": "Invoice Value",       "fieldname": "invoice_value",            "fieldtype": "Currency",                               "width": 120},
		{"label": "Payment Due",         "fieldname": "supplier_payment_amount",  "fieldtype": "Currency",                               "width": 120},
		{"label": "Date Delivered",      "fieldname": "date_delivered",           "fieldtype": "Date",                                   "width": 120},
		{"label": "Days Since Delivery", "fieldname": "days_since",               "fieldtype": "Int",                                    "width": 130},
	]

	data = frappe.db.sql("""
		SELECT
			name, supplier, description, invoice_value, supplier_payment_amount,
			date_delivered,
			DATEDIFF(CURDATE(), date_delivered) AS days_since
		FROM `tabImport Shipment`
		WHERE supplier_payment_paid = 0
		  AND date_delivered IS NOT NULL
		ORDER BY date_delivered
	""", as_dict=True)

	return columns, data
