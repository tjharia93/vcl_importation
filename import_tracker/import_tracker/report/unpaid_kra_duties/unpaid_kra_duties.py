import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment", "fieldname": "name", "fieldtype": "Link", "options": "Import Shipment", "width": 150},
		{"label": "Supplier", "fieldname": "supplier", "fieldtype": "Link", "options": "Supplier", "width": 160},
		{"label": "Description", "fieldname": "description", "fieldtype": "Data", "width": 200},
		{"label": "KRA Duty (KES)", "fieldname": "kra_duty_amount", "fieldtype": "Currency", "options": "KES", "width": 140},
		{"label": "KRA Docs Received", "fieldname": "date_kra_docs_received", "fieldtype": "Date", "width": 140},
		{"label": "Days Waiting", "fieldname": "days_waiting", "fieldtype": "Int", "width": 110},
	]

	data = frappe.db.sql("""
		SELECT
			name, supplier, description, kra_duty_amount,
			date_kra_docs_received,
			DATEDIFF(CURDATE(), COALESCE(date_kra_docs_received, creation)) AS days_waiting
		FROM `tabImport Shipment`
		WHERE kra_duty_paid = 0
		  AND kra_duty_amount > 0
		  AND status != 'Closed'
		ORDER BY kra_duty_amount DESC
	""", as_dict=True)

	return columns, data
