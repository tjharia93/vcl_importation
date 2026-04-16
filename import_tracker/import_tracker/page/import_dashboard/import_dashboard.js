frappe.pages["import-dashboard"].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "Import Dashboard",
		single_column: true,
	});

	// Inject CSS
	$(`<style>${get_dashboard_css()}</style>`).appendTo(page.body);

	// Inject HTML skeleton
	$(page.body).append(get_dashboard_html());

	// Fetch live data
	frappe.call({
		method:
			"import_tracker.import_tracker.page.import_dashboard.import_dashboard.get_dashboard_data",
		callback: function (r) {
			if (r.message) render_dashboard(r.message);
		},
	});
};

/* ── helpers ── */
const esc = (s) => $("<span>").text(s || "").html();
const fmtNum = (n) =>
	String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmtCurr = (amt, c) => {
	c = c || "USD";
	if (!amt) return c + " 0";
	if (amt >= 1e6) return c + " " + (amt / 1e6).toFixed(1) + "M";
	if (amt >= 1e3) return c + " " + (amt / 1e3).toFixed(0) + "k";
	return c + " " + fmtNum(amt);
};
const fmtMode = (m) =>
	m == "Air" ? "✈ Air" : m == "Sea" ? "🚢 Sea" : m == "Road" ? "🚛 Road" : m || "";

/* ── render ── */
function render_dashboard(data) {
	// KPIs
	$("#kpi-open").text(data.kpis.open_shipments);
	$("#kpi-kra").text(data.kpis.unpaid_kra_duties);
	$("#kpi-kra-amt").text(
		"KES " + fmtNum(data.kpis.kra_outstanding_amount) + " outstanding"
	);
	$("#kpi-delivery").text(data.kpis.awaiting_delivery);
	$("#kpi-overdue").text(data.kpis.overdue);
	$("#kpi-closed").text(data.kpis.closed_this_year);
	$("#tag-open, #tag-recent").text(data.kpis.open_shipments + " open");
	$("#tag-alerts").text(data.kpis.overdue + " flagged");

	// Pipeline bars
	let maxP = Math.max(...Object.values(data.pipeline), 1);
	const stageColors = {
		"PO Issued": ["#4f8ef7", "#2d6fe0"],
		"Invoice Received": ["#f5a623", "#e09210"],
		"KRA Docs Received": ["#f0a500", "#d98f00"],
		"KRA Duties Paid": ["#a78bfa", "#7c6ee0"],
		Delivered: ["#36c98e", "#24a872"],
		"Clearing Complete": ["#28b07a", "#1d9060"],
	};
	let pH = "";
	for (let name in data.pipeline) {
		let c = data.pipeline[name];
		let pct = (c / maxP) * 100;
		let col = stageColors[name] || ["#4f8ef7", "#2d6fe0"];
		pH += `<div class="p-row">
			<div class="p-label">${esc(name)}</div>
			<div class="p-bar-bg"><div class="p-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${col[0]},${col[1]})">${c || ""}</div></div>
			<div class="p-count" style="color:${col[0]}">${c}</div>
		</div>`;
	}
	$("#pipeline-box").html(pH);

	// Origins
	let oH = "";
	for (let country in data.origins) {
		oH += `<div class="o-item">
			<div style="font-size:11px;font-weight:600">${esc(country)}</div>
			<div class="o-val">${data.origins[country]}</div>
		</div>`;
	}
	$("#origins-grid").html(oH || '<div class="muted-sm">No data</div>');

	// Top suppliers
	let sH = "";
	let maxS = data.top_suppliers.length ? data.top_suppliers[0].value : 1;
	data.top_suppliers.forEach((s) => {
		let pct = (s.value / maxS) * 100;
		sH += `<div class="vbar-row">
			<div class="vbar-name" title="${esc(s.supplier)}">${esc(s.supplier)}</div>
			<div class="vbar-bg"><div class="vbar-fill" style="width:${pct}%"></div></div>
			<div class="vbar-amt">${fmtCurr(s.value)}</div>
		</div>`;
	});
	$("#suppliers-list").html(sH || '<div class="muted-sm">No data</div>');

	// Overdue alerts
	let aH = "";
	data.overdue_alerts.forEach((a) => {
		aH += `<div class="al-item">
			<div class="al-dot"></div>
			<div>
				<div class="al-name"><a href="/app/import-shipment/${encodeURIComponent(a.name)}" style="color:inherit;text-decoration:none">${esc(a.name)}</a></div>
				<div class="al-sub">${esc(a.supplier)}</div>
			</div>
			<div class="al-days">${a.days_overdue}d</div>
		</div>`;
	});
	$("#alerts-list").html(aH || '<div class="muted-sm">No overdue shipments</div>');

	// Recent shipments table
	const scMap = {
		"PO Issued": "s-po",
		"Invoice Received": "s-inv",
		"KRA Docs Received": "s-kra",
		"KRA Duties Paid": "s-kra",
		Delivered: "s-del",
		"Clearing Complete": "s-clr",
		Closed: "s-cls",
	};
	let rH = "";
	data.recent_shipments.forEach((r) => {
		let cls = scMap[r.status] || "s-cls";
		rH += `<tr>
			<td><a href="/app/import-shipment/${encodeURIComponent(r.name)}" class="ship-id">${esc(r.name)}</a></td>
			<td>${esc(r.supplier)}</td>
			<td class="muted-sm">${esc((r.description || "").substring(0, 35))}</td>
			<td class="muted-sm">${fmtMode(r.shipping_mode)}</td>
			<td><span class="st-pill ${cls}">${esc(r.status)}</span></td>
			<td class="muted-sm">${r.eta_port ? esc(r.eta_port) : "—"}</td>
			<td class="muted-sm">${r.assigned_to ? esc(r.assigned_to.split("@")[0]) : "—"}</td>
		</tr>`;
	});
	if (!rH)
		rH =
			'<tr><td colspan="7" style="text-align:center" class="muted-sm">No active shipments</td></tr>';
	$("#recent-tbody").html(rH);

	// Charts (Chart.js loaded async)
	frappe.require(
		"https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js",
		() => {
			// Shipping mode donut
			let mL = Object.keys(data.shipping_mode);
			let mD = Object.values(data.shipping_mode);
			let mC = mL.map((l) =>
				l == "Sea" ? "#4f8ef7" : l == "Air" ? "#36c98e" : "#f5a623"
			);
			new Chart(document.getElementById("modeChart"), {
				type: "doughnut",
				data: {
					labels: mL,
					datasets: [
						{
							data: mD,
							backgroundColor: mC,
							borderColor: "#21263a",
							borderWidth: 3,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					cutout: "68%",
					plugins: { legend: { display: false } },
				},
			});
			let legH = "";
			mL.forEach(
				(l, i) =>
					(legH += `<span class="muted-sm" style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:${mC[i]};display:inline-block"></span>${l}</span>`)
			);
			$("#mode-legend").html(legH);

			// Monthly trend
			new Chart(document.getElementById("trendChart"), {
				type: "line",
				data: {
					labels: data.monthly_trend.labels,
					datasets: [
						{
							label: "Opened",
							data: data.monthly_trend.opened,
							borderColor: "#4f8ef7",
							backgroundColor: "rgba(79,142,247,0.08)",
							borderWidth: 2,
							pointRadius: 4,
							tension: 0.4,
							fill: true,
						},
						{
							label: "Closed",
							data: data.monthly_trend.closed,
							borderColor: "#36c98e",
							backgroundColor: "rgba(54,201,142,0.06)",
							borderWidth: 2,
							pointRadius: 4,
							tension: 0.4,
							fill: true,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: { mode: "index", intersect: false },
					plugins: {
						legend: {
							position: "top",
							align: "end",
							labels: {
								color: "#7a859e",
								font: { size: 11 },
								boxWidth: 10,
								usePointStyle: true,
							},
						},
					},
					scales: {
						x: {
							grid: { color: "rgba(255,255,255,0.04)" },
							ticks: { color: "#7a859e", font: { size: 11 } },
						},
						y: {
							grid: { color: "rgba(255,255,255,0.04)" },
							ticks: {
								color: "#7a859e",
								font: { size: 11 },
								stepSize: 2,
							},
							min: 0,
						},
					},
				},
			});
		}
	);
}

/* ── CSS (returned as string) ── */
function get_dashboard_css() {
	return `
:root{--bg:#0f1117;--surface:#1a1d27;--card:#21263a;--border:#2e3452;--a1:#4f8ef7;--a2:#36c98e;--a3:#f5a623;--a4:#e05c5c;--a5:#a78bfa;--text:#e2e8f0;--muted:#7a859e;--radius:12px}
.id-page{padding:28px 32px;max-width:1400px;margin:0 auto;color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.sec-label{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);margin:28px 0 14px}
.sec-label:first-child{margin-top:0}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.kpi-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;position:relative;overflow:hidden;transition:transform .15s}
.kpi-card:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,.4)}
.kpi-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;border-radius:0 0 var(--radius) var(--radius)}
.kpi-card.blue::after{background:var(--a1)}.kpi-card.amber::after{background:var(--a3)}.kpi-card.green::after{background:var(--a2)}.kpi-card.red::after{background:var(--a4)}.kpi-card.purple::after{background:var(--a5)}
.kpi-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:14px}
.kpi-card.blue .kpi-icon{background:rgba(79,142,247,.15)}.kpi-card.amber .kpi-icon{background:rgba(245,166,35,.15)}.kpi-card.green .kpi-icon{background:rgba(54,201,142,.15)}.kpi-card.red .kpi-icon{background:rgba(224,92,92,.15)}.kpi-card.purple .kpi-icon{background:rgba(167,139,250,.15)}
.kpi-val{font-size:30px;font-weight:800;line-height:1;letter-spacing:-1px}
.kpi-card.blue .kpi-val{color:var(--a1)}.kpi-card.amber .kpi-val{color:var(--a3)}.kpi-card.green .kpi-val{color:var(--a2)}.kpi-card.red .kpi-val{color:var(--a4)}.kpi-card.purple .kpi-val{color:var(--a5)}
.kpi-lbl{font-size:12px;color:var(--muted);margin-top:6px;font-weight:500}
.kpi-sub{font-size:11px;margin-top:10px;font-weight:600;color:var(--a4)}
.grid-2{display:grid;grid-template-columns:1.6fr 1fr;gap:16px}
.grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:22px}
.card-hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
.card-title{font-size:13px;font-weight:700}.card-sub{font-size:11px;color:var(--muted);margin-top:2px}
.tag{font-size:10px;padding:3px 8px;border-radius:20px;background:rgba(79,142,247,.12);color:var(--a1);border:1px solid rgba(79,142,247,.2);font-weight:600}
.tag-red{background:rgba(224,92,92,.1);color:var(--a4);border-color:rgba(224,92,92,.3)}
.p-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.p-label{font-size:11px;color:var(--muted);width:145px;flex-shrink:0;font-weight:500}
.p-bar-bg{flex:1;height:22px;background:rgba(255,255,255,.04);border-radius:6px;overflow:hidden}
.p-bar-fill{height:100%;border-radius:6px;display:flex;align-items:center;padding-left:10px;font-size:11px;font-weight:700;color:#fff;transition:width 1s cubic-bezier(.4,0,.2,1)}
.p-count{font-size:12px;font-weight:700;width:28px;text-align:right;flex-shrink:0}
.o-item{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:rgba(255,255,255,.03);border-radius:8px;border:1px solid var(--border)}
.o-val{font-size:13px;font-weight:700;color:var(--a1)}
.vbar-row{display:flex;align-items:center;gap:10px;margin-bottom:9px}
.vbar-name{font-size:11px;color:var(--muted);width:130px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.vbar-bg{flex:1;height:18px;background:rgba(255,255,255,.04);border-radius:5px;overflow:hidden}
.vbar-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,var(--a1),var(--a5))}
.vbar-amt{font-size:11px;font-weight:600;width:68px;text-align:right;flex-shrink:0}
.al-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(224,92,92,.06);border:1px solid rgba(224,92,92,.2);border-radius:9px;margin-bottom:8px}
.al-dot{width:8px;height:8px;border-radius:50%;background:var(--a4);flex-shrink:0;animation:pulse 1.5s infinite}
.al-name{font-size:12px;font-weight:600}.al-sub{font-size:10px;color:var(--muted)}
.al-days{font-size:11px;font-weight:700;color:var(--a4);background:rgba(224,92,92,.12);padding:2px 8px;border-radius:20px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.r-table{width:100%;border-collapse:collapse}
.r-table th{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--muted);padding:0 12px 12px;text-align:left}
.r-table td{font-size:12px;padding:11px 12px;border-top:1px solid rgba(255,255,255,.04);vertical-align:middle}
.r-table tr:hover td{background:rgba(255,255,255,.02)}
.ship-id{font-weight:700;color:var(--a1);font-size:11px;text-decoration:none}
.st-pill{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700}
.st-pill::before{content:'';width:5px;height:5px;border-radius:50%}
.s-po{background:rgba(79,142,247,.12);color:var(--a1)}.s-po::before{background:var(--a1)}
.s-inv{background:rgba(245,166,35,.12);color:var(--a3)}.s-inv::before{background:var(--a3)}
.s-kra{background:rgba(167,139,250,.12);color:var(--a5)}.s-kra::before{background:var(--a5)}
.s-del{background:rgba(54,201,142,.12);color:var(--a2)}.s-del::before{background:var(--a2)}
.s-clr{background:rgba(54,201,142,.2);color:#28b07a}.s-clr::before{background:#28b07a}
.s-cls{background:rgba(255,255,255,.06);color:var(--muted)}.s-cls::before{background:var(--muted)}
.muted-sm{font-size:11px;color:var(--muted)}
`;
}

/* ── HTML skeleton (returned as string) ── */
function get_dashboard_html() {
	return `<div class="id-page">
	<div class="sec-label">At a Glance</div>
	<div class="kpi-grid">
		<div class="kpi-card blue"><div class="kpi-icon">📦</div><div class="kpi-val" id="kpi-open">-</div><div class="kpi-lbl">Open Shipments</div></div>
		<div class="kpi-card amber"><div class="kpi-icon">🏛️</div><div class="kpi-val" id="kpi-kra">-</div><div class="kpi-lbl">Unpaid KRA Duties</div><div class="kpi-sub" id="kpi-kra-amt">-</div></div>
		<div class="kpi-card green"><div class="kpi-icon">🚚</div><div class="kpi-val" id="kpi-delivery">-</div><div class="kpi-lbl">Awaiting Delivery</div></div>
		<div class="kpi-card red"><div class="kpi-icon">⚠️</div><div class="kpi-val" id="kpi-overdue">-</div><div class="kpi-lbl">Overdue (>14d)</div></div>
		<div class="kpi-card purple"><div class="kpi-icon">✅</div><div class="kpi-val" id="kpi-closed">-</div><div class="kpi-lbl">Closed This Year</div></div>
	</div>

	<div class="sec-label">Pipeline & Breakdown</div>
	<div class="grid-2">
		<div class="card">
			<div class="card-hdr"><div><div class="card-title">Shipments by Stage</div><div class="card-sub">Live pipeline</div></div><span class="tag" id="tag-open">-</span></div>
			<div id="pipeline-box"></div>
		</div>
		<div class="card">
			<div class="card-hdr"><div><div class="card-title">Shipping Mode</div><div class="card-sub">Active shipments</div></div></div>
			<div style="height:180px"><canvas id="modeChart"></canvas></div>
			<div id="mode-legend" style="display:flex;gap:16px;justify-content:center;margin-top:14px;flex-wrap:wrap"></div>
		</div>
	</div>

	<div class="sec-label">Trends & Origins</div>
	<div class="grid-3">
		<div class="card" style="grid-column:span 2">
			<div class="card-hdr"><div><div class="card-title">Monthly Activity</div><div class="card-sub">Opened vs Closed (12 months)</div></div></div>
			<div style="height:200px"><canvas id="trendChart"></canvas></div>
		</div>
		<div class="card">
			<div class="card-hdr"><div><div class="card-title">Origin Countries</div><div class="card-sub">Active shipment counts</div></div></div>
			<div id="origins-grid" style="display:grid;grid-template-columns:1fr;gap:8px"></div>
		</div>
	</div>

	<div class="sec-label">Suppliers & Alerts</div>
	<div class="grid-2">
		<div class="card">
			<div class="card-hdr"><div><div class="card-title">Top Suppliers by Invoice</div><div class="card-sub">Commercial invoice value</div></div></div>
			<div id="suppliers-list"></div>
		</div>
		<div class="card">
			<div class="card-hdr"><div><div class="card-title">Overdue Alerts</div><div class="card-sub">No progress in >14 days</div></div><span class="tag tag-red" id="tag-alerts">0</span></div>
			<div id="alerts-list"></div>
		</div>
	</div>

	<div class="sec-label">Recent Shipments</div>
	<div class="card">
		<div class="card-hdr"><div><div class="card-title">Active Shipment Register</div><div class="card-sub">Sorted by recent updates</div></div><span class="tag" id="tag-recent">-</span></div>
		<table class="r-table">
			<thead><tr><th>ID</th><th>Supplier</th><th>Description</th><th>Mode</th><th>Status</th><th>ETA</th><th>Assigned</th></tr></thead>
			<tbody id="recent-tbody"></tbody>
		</table>
	</div>

	<div style="margin-top:40px;padding:20px 0;border-top:1px solid var(--border);font-size:11px;color:var(--muted)">Import Tracker v1.0 · Live Data</div>
</div>`;
}
