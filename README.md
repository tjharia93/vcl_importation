# Import Tracker

A custom Frappe/ERPNext app for tracking import shipments from Proforma Invoice through to supplier payment.

---

## Features

- **7-stage shipment lifecycle** — PI Received → PO Issued → Invoice Received → KRA Docs Received → Delivered → Clearing Docs Received → Closed
- **Auto-status updates** — status field updates automatically as stage dates are filled in
- **Visual progress bar** — colour-coded step tracker shown on every shipment form
- **Overdue alerts** — daily scheduler adds a comment to any open shipment with no activity in 14+ days
- **4 built-in Script Reports** — see below
- **Workspace** — dedicated Import Tracker module page with shortcuts to all key views

---

## Installation

### Requirements
- Frappe v15 / ERPNext v16+
- Python 3.10+

### Steps

```bash
# From your bench directory
bench get-app https://github.com/tjharia93/vcl_importation.git
bench --site [your-site-name] install-app import_tracker
bench --site [your-site-name] migrate
bench --site [your-site-name] clear-cache
```

Replace `[your-site-name]` with your actual Frappe site name (e.g. `mycompany.frappe.cloud`).

---

## DocType: Import Shipment

**Naming series:** `SHIP-.YYYY.-.#####`
**Title field:** Description of Goods
**Track changes:** Yes

### Sections & Fields

| Section | Field | Type | Notes |
|---|---|---|---|
| Shipment Details | Shipment ID | Series | Auto-named |
| | Supplier | Link → Supplier | Required |
| | Purchase Order | Link → Purchase Order | |
| | Purchase Invoice | Link → Purchase Invoice | |
| | Description of Goods | Data | Required |
| | Item Type | Select | Finished Goods / Raw Materials / Machinery / Other |
| | Status | Select | Read-only — auto-set on save |
| | Assigned To | Link → User | |
| Value & Quantity | Currency | Link → Currency | Default: USD |
| | Proforma Value | Currency | |
| | Commercial Invoice Value | Currency | |
| | KRA Duty Amount (KES) | Currency | |
| | KRA Duty Paid | Check | |
| | Supplier Payment Amount | Currency | |
| | Supplier Paid | Check | |
| | Quantity | Float | |
| | Unit of Measure | Link → UOM | |
| | Gross Weight (KG) | Float | |
| Logistics | Country of Origin | Link → Country | |
| | Shipping Mode | Select | Sea / Air / Road |
| | Vessel / Flight No. | Data | |
| | Container / AWB No. | Data | |
| | Bill of Lading No. | Data | |
| | ETA at Port | Date | |
| | Clearing Agent | Data | |
| Stage Dates | Step 1 — PI Received | Date | |
| | Step 2 — PO Issued | Date | |
| | Step 3 — Commercial Invoice Received | Date | |
| | Step 4 — KRA Clearing Docs Received | Date | |
| | Step 4b — KRA Duties Paid | Date | |
| | Step 5 — Goods Delivered | Date | |
| | Step 6 — Clearing Docs Received | Date | |
| | Step 7 — Supplier Paid | Date | |
| Notes | Notes | Text Editor | |

---

## Status Logic

Status is automatically determined on every save based on the latest filled stage date:

| Condition | Status |
|---|---|
| Supplier Paid date filled | Closed |
| Clearing Docs date filled | Clearing Docs Received |
| Delivered date filled | Delivered |
| KRA Docs date filled | KRA Docs Received |
| Invoice date filled | Invoice Received |
| PO date filled | PO Issued |
| *(default)* | PI Received |

---

## Script Reports

| Report | Description |
|---|---|
| **Open Shipments by Stage** | All non-closed shipments ordered by stage, with days open |
| **Unpaid KRA Duties** | Shipments with KRA docs received but duty not yet paid |
| **Delivered Awaiting Supplier Payment** | Delivered shipments where supplier has not been paid |
| **Shipment Lead Times** | Closed shipments showing PI→PO, PO→Invoice, Invoice→Delivery, and total days |

---

## Scheduler

A daily background job (`flag_overdue_shipments`) scans all open shipments. If the most recent stage date is more than **14 days ago**, it adds an automatic comment to the document flagging the inactivity.

---

## Client Script Behaviour

- **Supplier filter** — when a supplier is selected, the Purchase Order link is filtered to that supplier's confirmed POs
- **Auto-fill supplier** — selecting a PO will auto-populate the Supplier field if blank
- **KRA Duty Paid** — checking this box auto-fills today's date in *KRA Duties Paid*
- **Supplier Paid** — checking this box auto-fills today's date in *Supplier Paid*
- **Invoice received** — filling the invoice date bolds and annotates the logistics fields as a prompt to complete them

---

## Fixtures

Exported via `bench export-fixtures`:

- `Workspace` — Import Tracker module page
- `Report` — all four Script Reports

To re-export after changes:

```bash
bench --site [your-site-name] export-fixtures
```

---

## License

MIT
