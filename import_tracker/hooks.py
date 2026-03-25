app_name = "import_tracker"
app_title = "Import Tracker"
app_publisher = "Your Company"
app_description = "Import Shipment Tracker"
app_license = "MIT"

# before_save is handled directly in the ImportShipment controller class
doc_events = {}

scheduler_events = {
	"daily": [
		"import_tracker.import_tracker.doctype.import_shipment.import_shipment.flag_overdue_shipments",
	]
}

fixtures = [
	{"doctype": "Workspace", "filters": [["module", "=", "Import Tracker"]]},
	{"doctype": "Report", "filters": [["module", "=", "Import Tracker"]]},
]
