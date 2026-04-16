"""
Shipping Line Tracking — extensible carrier registry.

Tries the API for supported carriers, falls back to the manual ETA
entered on the Purchase Invoice when:
  - the carrier has no API handler registered
  - the API key is not configured
  - the API call fails for any reason

To add a new carrier:
  1. Write a function that takes a BoL number and returns {"eta": date} or None
  2. Register it in CARRIER_HANDLERS below with the normalised carrier code

API keys are read from site_config.json:
  "maersk_api_key": "your-consumer-key"
  "msc_api_key":    "your-key"
"""

import frappe
from frappe.utils import now_datetime, getdate
import requests


# ---------------------------------------------------------------------------
# Carrier handler registry — add new carriers here
# ---------------------------------------------------------------------------

def _get_handlers():
    """Lazy registry so module-level imports don't fail."""
    return {
        "MAERSK": _fetch_maersk,
        "MSC":    _fetch_msc,
        # "CMA_CGM": _fetch_cma_cgm,
        # "HAPAG":   _fetch_hapag,
    }


def _normalise_carrier(shipping_line):
    """Map free-text shipping line names to carrier codes."""
    if not shipping_line:
        return None
    upper = shipping_line.upper().strip()
    mapping = {
        "MAERSK":      "MAERSK",
        "SEALAND":     "MAERSK",      # Maersk subsidiary
        "MSC":         "MSC",
        "CMA CGM":     "CMA_CGM",
        "CMA-CGM":     "CMA_CGM",
        "HAPAG-LLOYD": "HAPAG",
        "HAPAG LLOYD": "HAPAG",
        "ONE":         "ONE",
        "EVERGREEN":   "EVERGREEN",
        "COSCO":       "COSCO",
        "PIL":         "PIL",
    }
    for key, code in mapping.items():
        if key in upper:
            return code
    return None


# ---------------------------------------------------------------------------
# Scheduler entry-point (called from hooks.py)
# ---------------------------------------------------------------------------

def update_shipment_tracking():
    """
    Runs every 2 days.  For each open shipment that has a Bill of Lading:
      - If the carrier has an API handler → try it
      - On success → write live_eta + timestamp
      - On failure / unsupported → leave eta_port (from PI) untouched
    """
    shipments = frappe.get_all(
        "Import Shipment",
        filters={
            "status": ["not in", ["Closed", "PO Issued"]],
            "bill_of_lading": ["is", "set"],
        },
        fields=["name", "bill_of_lading", "shipping_line"],
    )

    updated = 0
    for s in shipments:
        carrier = _normalise_carrier(s.shipping_line)
        handler = _get_handlers().get(carrier) if carrier else None

        if not handler:
            frappe.db.set_value("Import Shipment", s.name, {
                "tracking_status": f"Manual — no API for {s.shipping_line or 'unknown carrier'}",
            }, update_modified=False)
            continue

        try:
            result = handler(s.bill_of_lading)
            if result and result.get("eta"):
                frappe.db.set_value("Import Shipment", s.name, {
                    "live_eta": getdate(result["eta"]),
                    "last_tracking_update": now_datetime(),
                    "tracking_status": f"Live — {carrier}",
                }, update_modified=False)
                updated += 1
            else:
                frappe.db.set_value("Import Shipment", s.name, {
                    "last_tracking_update": now_datetime(),
                    "tracking_status": f"No ETA returned — {carrier}",
                }, update_modified=False)
        except Exception as e:
            frappe.log_error(
                title=f"Tracking error: {s.name}",
                message=f"Carrier: {carrier}, BoL: {s.bill_of_lading}\n{e}",
            )
            frappe.db.set_value("Import Shipment", s.name, {
                "last_tracking_update": now_datetime(),
                "tracking_status": f"API error — {str(e)[:60]}",
            }, update_modified=False)

    if shipments:
        frappe.db.commit()

    return {"checked": len(shipments), "updated": updated}


# ---------------------------------------------------------------------------
# Carrier implementations
# ---------------------------------------------------------------------------

def _fetch_maersk(bol_number):
    """
    Maersk Track & Trace API.

    Setup:
      1. Register at https://developer.maersk.com
      2. Get a Consumer Key for the Track & Trace API
      3. Add to site_config.json:  "maersk_api_key": "your-key"
    """
    api_key = frappe.conf.get("maersk_api_key")
    if not api_key:
        raise ValueError(
            "maersk_api_key not set in site_config.json — "
            "register at developer.maersk.com"
        )

    resp = requests.get(
        "https://api.maersk.com/track-and-trace",
        params={"billOfLadingNumber": bol_number},
        headers={
            "Consumer-Key": api_key,
            "Accept": "application/json",
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    # Walk through containers → events to find the latest estimated arrival
    best_eta = None
    for container in data.get("containers", []):
        for event in container.get("events", []):
            if "arrival" in event.get("eventType", "").lower():
                est = event.get("estimatedEventDateTime") or event.get("estimatedDate")
                if est:
                    candidate = getdate(est[:10])
                    if best_eta is None or candidate > best_eta:
                        best_eta = candidate

    if best_eta:
        return {"eta": best_eta}
    return None


def _fetch_msc(bol_number):
    """
    MSC Track & Trace — placeholder.

    Setup:
      1. Contact MSC for API access
      2. Add to site_config.json:  "msc_api_key": "your-key"

    Replace the body below with actual MSC API integration.
    """
    api_key = frappe.conf.get("msc_api_key")
    if not api_key:
        raise ValueError(
            "msc_api_key not set in site_config.json"
        )

    # TODO: Implement MSC API call
    # resp = requests.get(
    #     "https://api.msc.com/track",
    #     params={"bol": bol_number},
    #     headers={"Authorization": f"Bearer {api_key}"},
    #     timeout=30,
    # )
    # resp.raise_for_status()
    # data = resp.json()
    # return {"eta": parse_eta(data)}

    return None  # Fallback until implemented
