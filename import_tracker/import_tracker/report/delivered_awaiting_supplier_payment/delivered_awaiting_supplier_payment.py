import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment", "fieldname": "name", "fieldtype": "Link", "options": "Import Shipment", "width": 150},
		{"label": "Supplier", "fieldname": "supplier", "fieldtype": "Link", "options": "Supplier", "width": 160},
		{"label": "Description", "fieldname": "description", "fieldtype": "Data", "width": 200},
		{"label": "Invoice Value", "fieldname": "invoice_value", "fieldtype": "Currency", "width": 130},
		{"label": "PI Outstanding", "fieldname": "outstanding", "fieldtype": "Currency", "width": 130},
		{"label": "Date Delivered", "fieldname": "date_delivered", "fieldtype": "Date", "width": 120},
		{"label": "Days Since Delivery", "fieldname": "days_since", "fieldtype": "Int", "width": 140},
	]

	data = frappe.db.sql("""
		SELECT
			s.name, s.supplier, s.description, s.invoice_value,
			pi.outstanding_amount AS outstanding,
			s.date_delivered,
			DATEDIFF(CURDATE(), s.date_delivered) AS days_since
		FROM `tabImport Shipment` s
		LEFT JOIN `tabPurchase Invoice` pi ON pi.name = s.purchase_invoice
		WHERE s.date_delivered IS NOT NULL
		  AND s.status != 'Closed'
		  AND (pi.outstanding_amount IS NULL OR pi.outstanding_amount > 0)
		ORDER BY s.date_delivered
	""", as_dict=True)

	return columns, data
