app_name = "import_tracker"
app_title = "Import Tracker"
app_publisher = "Your Company"
app_description = "Import Shipment Tracker"
app_license = "MIT"

# ---------------------------------------------------------------------------
# Doc Events — auto-create / auto-link / auto-refresh Import Shipments
# ---------------------------------------------------------------------------

doc_events = {
    "Purchase Order": {
        "on_submit": (
            "import_tracker.import_tracker.doctype."
            "import_shipment.import_shipment.on_po_submit"
        ),
    },
    "Purchase Invoice": {
        "on_update": (
            "import_tracker.import_tracker.doctype."
            "import_shipment.import_shipment.on_pi_update"
        ),
    },
    "Purchase Receipt": {
        "on_submit": (
            "import_tracker.import_tracker.doctype."
            "import_shipment.import_shipment.on_pr_submit"
        ),
    },
    "Payment Entry": {
        "on_submit": (
            "import_tracker.import_tracker.doctype."
            "import_shipment.import_shipment.on_payment_submit"
        ),
    },
}

# ---------------------------------------------------------------------------
# Scheduler — daily status refresh for all open Import Shipments
# ---------------------------------------------------------------------------

scheduler_events = {
    "daily": [
        "import_tracker.import_tracker.doctype."
        "import_shipment.import_shipment.bulk_refresh_statuses",
    ],
}

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

fixtures = [
    {"doctype": "Workspace", "filters": [["module", "=", "Import Tracker"]]},
    {"doctype": "Report", "filters": [["module", "=", "Import Tracker"]]},
]
