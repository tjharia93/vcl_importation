import frappe


def execute(filters=None):
	columns = [
		{"label": "Shipment", "fieldname": "name", "fieldtype": "Link", "options": "Import Shipment", "width": 150},
		{"label": "Purchase Order", "fieldname": "purchase_order", "fieldtype": "Link", "options": "Purchase Order", "width": 160},
		{"label": "Supplier", "fieldname": "supplier", "fieldtype": "Link", "options": "Supplier", "width": 160},
		{"label": "Description", "fieldname": "description", "fieldtype": "Data", "width": 200},
		{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 160},
		{"label": "ETA Port", "fieldname": "eta_port", "fieldtype": "Date", "width": 110},
		{"label": "Days Open", "fieldname": "days_open", "fieldtype": "Int", "width": 90},
		{"label": "Assigned To", "fieldname": "assigned_to", "fieldtype": "Link", "options": "User", "width": 130},
	]

	data = frappe.db.sql("""
		SELECT
			name, purchase_order, supplier, description, status,
			eta_port, assigned_to,
			DATEDIFF(CURDATE(), creation) AS days_open
		FROM `tabImport Shipment`
		WHERE status != 'Closed'
		ORDER BY
			FIELD(status,
				'PO Issued', 'Invoice Received', 'KRA Docs Received',
				'KRA Duties Paid', 'Delivered', 'Clearing Complete'
			),
			creation
	""", as_dict=True)

	return columns, data
