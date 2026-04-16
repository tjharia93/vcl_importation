frappe.ui.form.on("Import Shipment", {
	refresh(frm) {
		render_progress_bar(frm);
		render_eta_indicator(frm);

		// --- Quick-link buttons ---
		if (frm.doc.purchase_order) {
			frm.add_custom_button("Purchase Order", () => {
				frappe.set_route("Form", "Purchase Order", frm.doc.purchase_order);
			}, "View");
		}
		if (frm.doc.purchase_invoice) {
			frm.add_custom_button("Purchase Invoice", () => {
				frappe.set_route("Form", "Purchase Invoice", frm.doc.purchase_invoice);
			}, "View");
		}

		// --- Refresh fetched data from PO / PI ---
		if (!frm.is_new()) {
			frm.add_custom_button("Refresh from PO / PI", () => {
				frappe.call({
					method: "import_tracker.import_tracker.doctype.import_shipment.import_shipment.refresh_shipment_data",
					args: { shipment_name: frm.doc.name },
					freeze: true,
					freeze_message: "Pulling latest data\u2026",
					callback() {
						frm.reload_doc();
						frappe.show_alert({ message: "Data refreshed", indicator: "green" });
					}
				});
			});
		}

		// --- Filter PO link to Import orders only ---
		frm.set_query("purchase_order", () => ({
			filters: { order_type: "Import", docstatus: 1 }
		}));

		// --- Filter PI link to Importation invoices only ---
		frm.set_query("purchase_invoice", () => {
			let filters = { custom_purchase_invoice_type: "Importation" };
			if (frm.doc.supplier) {
				filters.supplier = frm.doc.supplier;
			}
			return { filters };
		});
	},

	// Auto-set today when KRA Duty Paid is ticked
	kra_duty_paid(frm) {
		if (frm.doc.kra_duty_paid && !frm.doc.date_kra_paid) {
			frm.set_value("date_kra_paid", frappe.datetime.get_today());
		}
	}
});

// ---------------------------------------------------------------------------
// Seven-dot progress bar rendered in the form dashboard
// ---------------------------------------------------------------------------
function render_progress_bar(frm) {
	const stages = [
		{ label: "PO Issued",       status: "PO Issued" },
		{ label: "Invoice Recv'd",  status: "Invoice Received" },
		{ label: "KRA Docs",        status: "KRA Docs Received" },
		{ label: "KRA Paid",        status: "KRA Duties Paid" },
		{ label: "Delivered",       status: "Delivered" },
		{ label: "Clearing Done",   status: "Clearing Complete" },
		{ label: "Closed",          status: "Closed" },
	];

	const statusOrder = stages.map(s => s.status);
	const currentIdx  = statusOrder.indexOf(frm.doc.status);
	const total = stages.length;
	const done  = currentIdx + 1;
	const pct   = Math.round((done / total) * 100);
	const color = pct === 100 ? "#2490ef" : done >= 4 ? "#36a27b" : "#f5a623";

	const dots = stages.map((s, i) => {
		const complete = i <= currentIdx;
		const active   = i === currentIdx + 1;
		const bg       = complete ? color : active ? "#fff" : "#eee";
		const border   = complete ? color : active ? color  : "#ccc";
		const textCol  = complete ? "#fff" : "#999";
		return `<div title="${s.label}" style="
			width:28px;height:28px;border-radius:50%;
			background:${bg};border:2px solid ${border};
			display:flex;align-items:center;justify-content:center;
			font-size:10px;font-weight:600;color:${textCol};
			flex-shrink:0;cursor:default;">
			${complete ? "&#10003;" : i + 1}
		</div>`;
	}).join('<div style="flex:1;height:2px;background:#eee;margin:auto;min-width:8px"></div>');

	const html = `<div style="padding:12px 16px 8px;">
		<div style="display:flex;align-items:center;gap:0;margin-bottom:8px">${dots}</div>
		<div style="display:flex;justify-content:space-between;font-size:11px;color:#888">
			<span>${done} of ${total} stages complete</span>
			<span style="font-weight:500;color:${color}">${pct}%</span>
		</div>
	</div>`;

	frm.dashboard.set_headline_alert(html);
}

// ---------------------------------------------------------------------------
// ETA indicator — shows live vs manual ETA with visual badge
// ---------------------------------------------------------------------------
function render_eta_indicator(frm) {
	if (frm.is_new()) return;

	let eta = frm.doc.live_eta || frm.doc.eta_port;
	if (!eta) return;

	let is_live = !!frm.doc.live_eta;
	let badge_color = is_live ? "#36c98e" : "#f5a623";
	let badge_text = is_live ? "Live" : "Manual";
	let updated = frm.doc.last_tracking_update
		? ` &middot; Updated ${frappe.datetime.prettyDate(frm.doc.last_tracking_update)}`
		: "";
	let status_text = frm.doc.tracking_status || "";

	let indicator = `<div style="
		padding:8px 16px;margin-top:4px;
		background:rgba(${is_live ? "54,201,142" : "245,166,35"},0.08);
		border:1px solid rgba(${is_live ? "54,201,142" : "245,166,35"},0.25);
		border-radius:8px;display:flex;align-items:center;gap:10px;font-size:12px">
		<span style="
			background:${badge_color};color:#fff;font-size:10px;
			font-weight:700;padding:2px 8px;border-radius:10px">${badge_text}</span>
		<span><b>ETA:</b> ${frappe.datetime.str_to_user(eta)}</span>
		<span style="color:#7a859e;font-size:10px">${status_text}${updated}</span>
	</div>`;

	// Place after the headline alert
	$(frm.dashboard.wrapper).find(".eta-indicator").remove();
	$(frm.dashboard.wrapper).append(
		'<div class="eta-indicator">' + indicator + "</div>"
	);
}
