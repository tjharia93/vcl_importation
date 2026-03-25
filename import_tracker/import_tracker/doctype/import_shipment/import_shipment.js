frappe.ui.form.on("Import Shipment", {
	refresh(frm) {
		render_progress_bar(frm);
		if (!frm.is_new()) {
			frm.add_custom_button("View All Shipments", () => {
				frappe.set_route("List", "Import Shipment");
			});
		}
	},

	supplier(frm) {
		frm.set_query("purchase_order", () => ({
			filters: { supplier: frm.doc.supplier, docstatus: 1 }
		}));
	},

	purchase_order(frm) {
		if (frm.doc.purchase_order && !frm.doc.supplier) {
			frappe.db.get_value("Purchase Order", frm.doc.purchase_order, "supplier", (r) => {
				if (r && r.supplier) frm.set_value("supplier", r.supplier);
			});
		}
	},

	kra_duty_paid(frm) {
		if (frm.doc.kra_duty_paid && !frm.doc.date_kra_paid) {
			frm.set_value("date_kra_paid", frappe.datetime.get_today());
		}
	},

	supplier_payment_paid(frm) {
		if (frm.doc.supplier_payment_paid && !frm.doc.date_supplier_paid) {
			frm.set_value("date_supplier_paid", frappe.datetime.get_today());
		}
	},

	date_invoice_received(frm) {
		if (frm.doc.date_invoice_received) {
			["vessel_name", "container_number", "bill_of_lading", "eta_port"].forEach(f => {
				frm.set_df_property(f, "bold", 1);
				frm.set_df_property(f, "description", "Please complete \u2014 invoice received");
			});
			frm.refresh_fields();
		}
	}
});

function render_progress_bar(frm) {
	const stages = [
		{ label: "PI received",       field: "date_pi_received" },
		{ label: "PO issued",         field: "date_po_issued" },
		{ label: "Invoice received",  field: "date_invoice_received" },
		{ label: "KRA docs & payment",field: "date_kra_docs_received" },
		{ label: "Delivered",         field: "date_delivered" },
		{ label: "Clearing docs",     field: "date_clearing_docs" },
		{ label: "Supplier paid",     field: "date_supplier_paid" },
	];

	const total = stages.length;
	const done  = stages.filter(s => frm.doc[s.field]).length;
	const pct   = Math.round((done / total) * 100);
	const color = pct === 100 ? "#2490ef" : done >= 4 ? "#36a27b" : "#f5a623";

	const dots = stages.map((s, i) => {
		const complete = !!frm.doc[s.field];
		const active   = !complete && (i === 0 || !!frm.doc[stages[i - 1]?.field]);
		const bg       = complete ? color : active ? "#fff" : "#eee";
		const border   = complete ? color : active ? color  : "#ccc";
		const title    = frm.doc[s.field]
			? `${s.label}: ${frm.doc[s.field]}`
			: s.label;
		return `<div title="${title}" style="
			width:28px;height:28px;border-radius:50%;
			background:${bg};border:2px solid ${border};
			display:flex;align-items:center;justify-content:center;
			font-size:10px;font-weight:600;color:${complete ? '#fff' : '#999'};
			flex-shrink:0;cursor:default;">
			${complete ? "&#10003;" : i + 1}
		</div>`;
	}).join(`<div style="flex:1;height:2px;background:#eee;margin:auto;min-width:8px"></div>`);

	const html = `<div style="padding:12px 16px 8px;">
		<div style="display:flex;align-items:center;gap:0;margin-bottom:8px">${dots}</div>
		<div style="display:flex;justify-content:space-between;font-size:11px;color:#888">
			<span>${done} of ${total} stages complete</span>
			<span style="font-weight:500;color:${color}">${pct}%</span>
		</div>
	</div>`;

	frm.dashboard.set_headline_alert(html);
}
