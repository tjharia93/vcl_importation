import frappe
from frappe.utils import add_days, getdate, today

@frappe.whitelist()
def get_dashboard_data():
    current_date = getdate(today())
    
    # Base query for all shipments
    shipments = frappe.get_all(
        "Import Shipment",
        fields=[
            "name", "supplier", "description", "status", "kra_duty_amount", 
            "kra_duty_paid", "supplier_payment_amount", "supplier_payment_paid", 
            "shipping_mode", "creation", "modified", "origin_country", "invoice_value",
            "date_pi_received", "date_po_issued", "date_invoice_received", "date_delivered",
            "eta_port", "assigned_to"
        ]
    )

    data = {
        "kpis": {
            "open_shipments": 0,
            "unpaid_kra_duties": 0,
            "kra_outstanding_amount": 0,
            "awaiting_supplier_payment": 0,
            "supplier_outstanding_amount": 0,
            "overdue": 0,
            "closed_this_year": 0
        },
        "pipeline": {},
        "shipping_mode": {},
        "monthly_trend": {
            "labels": [],
            "opened": [],
            "closed": []
        },
        "origins": {},
        "top_suppliers": {},
        "overdue_alerts": [],
        "recent_shipments": []
    }

    # Pipeline stages configuration
    pipeline_stages = [
        "PI Received", "PO Issued", "Invoice Received", 
        "KRA Docs Received", "Delivered", "Clearing Docs Received"
    ]
    for stage in pipeline_stages:
        data["pipeline"][stage] = 0

    # For monthly trend, last 12 months including current
    months = []
    opened_by_month = {}
    closed_by_month = {}
    
    for i in range(11, -1, -1):
        d = add_days(current_date, -30 * i)
        m_str = d.strftime("%b %y")
        if m_str not in months:
            months.append(m_str)
            opened_by_month[m_str] = 0
            closed_by_month[m_str] = 0

    supplier_value_map = {}

    for shipment in shipments:
        is_closed = shipment.status == "Closed"
        
        # Monthly trend - Opened
        create_month = shipment.creation.strftime("%b %y") if shipment.creation else None
        if create_month in opened_by_month:
            opened_by_month[create_month] += 1
            
        # Monthly trend - Closed
        if is_closed:
            modified_month = shipment.modified.strftime("%b %y") if shipment.modified else None
            # Count only if it's closed this year for KPI
            if shipment.modified and shipment.modified.year == current_date.year:
                data["kpis"]["closed_this_year"] += 1
            
            if modified_month in closed_by_month:
                closed_by_month[modified_month] += 1
            continue # Don't count closed shipments towards open KPIs
            
        # --- From here, shipment is OPEN ---
        
        data["kpis"]["open_shipments"] += 1
        
        # Pipeline
        if shipment.status in data["pipeline"]:
            data["pipeline"][shipment.status] += 1
            
        # Shipping mode
        if shipment.shipping_mode:
            data["shipping_mode"][shipment.shipping_mode] = data["shipping_mode"].get(shipment.shipping_mode, 0) + 1
            
        # Unpaid KRA
        if shipment.kra_duty_amount and not shipment.kra_duty_paid:
            data["kpis"]["unpaid_kra_duties"] += 1
            data["kpis"]["kra_outstanding_amount"] += shipment.kra_duty_amount
            
        # Supplier Payment
        if shipment.supplier_payment_amount and not shipment.supplier_payment_paid:
            data["kpis"]["awaiting_supplier_payment"] += 1
            data["kpis"]["supplier_outstanding_amount"] += shipment.supplier_payment_amount
            
        # Overdue check (no modification in > 14 days)
        days_since_update = (current_date - getdate(shipment.modified.date() if hasattr(shipment.modified, 'date') else shipment.modified)).days if shipment.modified else 0
        if days_since_update > 14:
            data["kpis"]["overdue"] += 1
            data["overdue_alerts"].append({
                "name": shipment.name,
                "supplier": shipment.supplier,
                "description": shipment.description,
                "days_overdue": days_since_update
            })
            
        # Origins
        if shipment.origin_country:
            data["origins"][shipment.origin_country] = data["origins"].get(shipment.origin_country, 0) + 1
            
        # Supplier Value (commercial invoice)
        if shipment.supplier and shipment.invoice_value:
            supplier_value_map[shipment.supplier] = supplier_value_map.get(shipment.supplier, 0) + shipment.invoice_value
            
        # Add to recent shipments list
        if shipment.eta_port:
            shipment.eta_port = shipment.eta_port.strftime("%d %b %Y") if hasattr(shipment.eta_port, 'strftime') else str(shipment.eta_port)
        data["recent_shipments"].append(shipment)

    # Process monthly output
    data["monthly_trend"]["labels"] = months
    for m in months:
        data["monthly_trend"]["opened"].append(opened_by_month[m])
        data["monthly_trend"]["closed"].append(closed_by_month[m])
        
    # Sort Origins by count DESC
    data["origins"] = dict(sorted(data["origins"].items(), key=lambda item: item[1], reverse=True)[:6])
    
    # Sort Top Suppliers by value DESC
    sorted_suppliers = sorted(supplier_value_map.items(), key=lambda item: item[1], reverse=True)[:6]
    data["top_suppliers"] = [{"supplier": k, "value": v} for k, v in sorted_suppliers]
    
    # Sort Overdue alerts by days descending
    data["overdue_alerts"] = sorted(data["overdue_alerts"], key=lambda x: x["days_overdue"], reverse=True)[:5]
    
    # Sort Recent Shipments by modified desc
    data["recent_shipments"] = sorted(data["recent_shipments"], key=lambda x: str(x.get("modified", "")), reverse=True)

    return data
