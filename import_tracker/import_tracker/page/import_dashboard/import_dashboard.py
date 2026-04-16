import frappe
from frappe.utils import add_months, getdate, today


@frappe.whitelist()
def get_dashboard_data():
    frappe.has_permission("Import Shipment", "read", throw=True)

    current_date = getdate(today())

    shipments = frappe.get_all(
        "Import Shipment",
        fields=[
            "name", "supplier", "description", "status",
            "kra_duty_amount", "kra_duty_paid",
            "invoice_value", "shipping_mode", "origin_country",
            "eta_port", "live_eta", "tracking_status",
            "assigned_to", "shipping_line",
            "purchase_order", "purchase_invoice",
            "bill_of_lading", "num_containers",
            "date_delivered", "date_po_issued",
            "creation", "modified",
        ],
    )

    data = {
        "kpis": {
            "open_shipments": 0,
            "unpaid_kra_duties": 0,
            "kra_outstanding_amount": 0,
            "awaiting_delivery": 0,
            "overdue": 0,
            "closed_this_year": 0,
        },
        "pipeline": {},
        "shipping_mode": {},
        "monthly_trend": {"labels": [], "opened": [], "closed": []},
        "origins": {},
        "top_suppliers": [],
        "overdue_alerts": [],
        "recent_shipments": [],
    }

    # Pipeline stages
    pipeline_stages = [
        "PO Issued", "Invoice Received", "KRA Docs Received",
        "KRA Duties Paid", "Delivered", "Clearing Complete",
    ]
    for stage in pipeline_stages:
        data["pipeline"][stage] = 0

    # Monthly trend — proper calendar months
    months = []
    opened_by_month = {}
    closed_by_month = {}
    for i in range(11, -1, -1):
        d = add_months(current_date, -i)
        label = d.strftime("%b %y")
        if label not in opened_by_month:
            months.append(label)
            opened_by_month[label] = 0
            closed_by_month[label] = 0

    supplier_value_map = {}

    for s in shipments:
        is_closed = s.status == "Closed"

        # Monthly trend — Opened
        if s.creation:
            m_open = s.creation.strftime("%b %y")
            if m_open in opened_by_month:
                opened_by_month[m_open] += 1

        # Monthly trend — Closed (using date_closed or modified as proxy)
        if is_closed:
            m_close = s.modified.strftime("%b %y") if s.modified else None
            if m_close and m_close in closed_by_month:
                closed_by_month[m_close] += 1
            if s.modified and s.modified.year == current_date.year:
                data["kpis"]["closed_this_year"] += 1
            continue  # closed shipments skip open KPIs

        # --- Open shipment KPIs ---
        data["kpis"]["open_shipments"] += 1

        if s.status in data["pipeline"]:
            data["pipeline"][s.status] += 1

        if s.shipping_mode:
            data["shipping_mode"][s.shipping_mode] = (
                data["shipping_mode"].get(s.shipping_mode, 0) + 1
            )

        if s.kra_duty_amount and not s.kra_duty_paid:
            data["kpis"]["unpaid_kra_duties"] += 1
            data["kpis"]["kra_outstanding_amount"] += s.kra_duty_amount

        if s.status in ("Invoice Received", "KRA Docs Received",
                        "KRA Duties Paid") and not s.date_delivered:
            data["kpis"]["awaiting_delivery"] += 1

        # Overdue: no stage-date change in >14 days
        stage_dates = [
            s.get("date_po_issued"), s.get("date_delivered"),
        ]
        filled = [getdate(d) for d in stage_dates if d]
        last_activity = max(filled) if filled else (
            getdate(s.creation) if s.creation else current_date
        )
        days_since = (current_date - last_activity).days
        if days_since > 14:
            data["kpis"]["overdue"] += 1
            data["overdue_alerts"].append({
                "name": s.name,
                "supplier": s.supplier or "",
                "description": s.description or "",
                "days_overdue": days_since,
            })

        if s.origin_country:
            data["origins"][s.origin_country] = (
                data["origins"].get(s.origin_country, 0) + 1
            )

        if s.supplier and s.invoice_value:
            supplier_value_map[s.supplier] = (
                supplier_value_map.get(s.supplier, 0) + s.invoice_value
            )

        # Use live ETA when available, fall back to PI manual ETA
        best_eta = s.live_eta or s.eta_port
        if best_eta and hasattr(best_eta, "strftime"):
            s.display_eta = best_eta.strftime("%d %b %Y")
            s.eta_is_live = bool(s.live_eta)
        else:
            s.display_eta = None
            s.eta_is_live = False

        data["recent_shipments"].append(s)

    # Assemble monthly trend
    data["monthly_trend"]["labels"] = months
    for m in months:
        data["monthly_trend"]["opened"].append(opened_by_month[m])
        data["monthly_trend"]["closed"].append(closed_by_month[m])

    # Top origins (max 6)
    data["origins"] = dict(
        sorted(data["origins"].items(), key=lambda x: x[1], reverse=True)[:6]
    )

    # Top suppliers (max 6)
    sorted_sup = sorted(
        supplier_value_map.items(), key=lambda x: x[1], reverse=True
    )[:6]
    data["top_suppliers"] = [{"supplier": k, "value": v} for k, v in sorted_sup]

    # Overdue alerts (top 5)
    data["overdue_alerts"] = sorted(
        data["overdue_alerts"], key=lambda x: x["days_overdue"], reverse=True
    )[:5]

    # Recent shipments sorted by modified desc
    data["recent_shipments"] = sorted(
        data["recent_shipments"],
        key=lambda x: str(x.get("modified", "")),
        reverse=True,
    )

    return data
