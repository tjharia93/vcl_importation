frappe.pages['import-dashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Import Dashboard',
		single_column: true
	});

	// Inject the CSS and HTML directly into the page body to prevent any Frappe template caching issues
	let raw_html = `<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #0f1117;
      --surface:  #1a1d27;
      --card:     #21263a;
      --border:   #2e3452;
      --accent1:  #4f8ef7;   /* blue  */
      --accent2:  #36c98e;   /* green */
      --accent3:  #f5a623;   /* amber */
      --accent4:  #e05c5c;   /* red   */
      --accent5:  #a78bfa;   /* purple*/
      --text:     #e2e8f0;
      --muted:    #7a859e;
      --radius:   12px;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    /* ── HEADER ── */
    .header {
      background: linear-gradient(135deg, #1a1d27 0%, #12162b 100%);
      border-bottom: 1px solid var(--border);
      padding: 18px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 14px; }
    .header-logo {
      width: 38px; height: 38px; border-radius: 10px;
      background: linear-gradient(135deg, var(--accent1), var(--accent5));
      display: flex; align-items: center; justify-content: center;
      font-size: 20px;
    }
    .header-title { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
    .header-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .badge {
      padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;
      background: rgba(79,142,247,0.15); color: var(--accent1); border: 1px solid rgba(79,142,247,0.3);
    }
    .badge.live::before {
      content: ''; display: inline-block;
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent2); margin-right: 6px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* ── LAYOUT ── */
    .page { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }

    /* ── SECTION LABEL ── */
    .section-label {
      font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
      text-transform: uppercase; color: var(--muted);
      margin-bottom: 14px; margin-top: 28px;
    }
    .section-label:first-child { margin-top: 0; }

    /* ── KPI CARDS ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 14px;
    }
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: transform 0.15s, box-shadow 0.15s;
      cursor: default;
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    .kpi-card::after {
      content: ''; position: absolute; bottom: 0; left: 0; right: 0;
      height: 3px; border-radius: 0 0 var(--radius) var(--radius);
    }
    .kpi-card.blue::after   { background: var(--accent1); }
    .kpi-card.green::after  { background: var(--accent2); }
    .kpi-card.amber::after  { background: var(--accent3); }
    .kpi-card.red::after    { background: var(--accent4); }
    .kpi-card.purple::after { background: var(--accent5); }

    .kpi-icon {
      width: 36px; height: 36px; border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; margin-bottom: 14px;
    }
    .kpi-card.blue   .kpi-icon { background: rgba(79,142,247,0.15); }
    .kpi-card.green  .kpi-icon { background: rgba(54,201,142,0.15); }
    .kpi-card.amber  .kpi-icon { background: rgba(245,166,35,0.15); }
    .kpi-card.red    .kpi-icon { background: rgba(224,92,92,0.15); }
    .kpi-card.purple .kpi-icon { background: rgba(167,139,250,0.15); }

    .kpi-value { font-size: 30px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
    .kpi-card.blue   .kpi-value { color: var(--accent1); }
    .kpi-card.green  .kpi-value { color: var(--accent2); }
    .kpi-card.amber  .kpi-value { color: var(--accent3); }
    .kpi-card.red    .kpi-value { color: var(--accent4); }
    .kpi-card.purple .kpi-value { color: var(--accent5); }

    .kpi-label { font-size: 12px; color: var(--muted); margin-top: 6px; font-weight: 500; }
    .kpi-delta {
      font-size: 11px; margin-top: 10px; display: flex; align-items: center; gap: 4px;
      font-weight: 600;
    }
    .kpi-delta.up   { color: var(--accent2); }
    .kpi-delta.down { color: var(--accent4); }

    /* ── CHART GRID ── */
    .chart-grid-2 { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; }
    .chart-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .chart-grid-full { display: grid; grid-template-columns: 1fr; gap: 16px; }

    .chart-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 22px;
    }
    .chart-header {
      display: flex; justify-content: space-between;
      align-items: flex-start; margin-bottom: 18px;
    }
    .chart-title { font-size: 13px; font-weight: 700; }
    .chart-subtitle { font-size: 11px; color: var(--muted); margin-top: 2px; }
    .chart-tag {
      font-size: 10px; padding: 3px 8px; border-radius: 20px;
      background: rgba(79,142,247,0.12); color: var(--accent1);
      border: 1px solid rgba(79,142,247,0.2); font-weight: 600;
    }
    .chart-wrap { position: relative; }

    /* ── PIPELINE BAR ── */
    .pipeline { display: flex; flex-direction: column; gap: 10px; }
    .pipeline-row { display: flex; align-items: center; gap: 12px; }
    .pipeline-label { font-size: 11px; color: var(--muted); width: 155px; flex-shrink: 0; font-weight: 500; }
    .pipeline-bar-bg {
      flex: 1; height: 22px; background: rgba(255,255,255,0.04);
      border-radius: 6px; overflow: hidden; position: relative;
    }
    .pipeline-bar-fill {
      height: 100%; border-radius: 6px;
      display: flex; align-items: center; padding-left: 10px;
      font-size: 11px; font-weight: 700; color: #fff;
      transition: width 1s cubic-bezier(.4,0,.2,1);
    }
    .pipeline-count { font-size: 12px; font-weight: 700; width: 28px; text-align: right; flex-shrink: 0; }

    /* ── WORLD MAP PLACEHOLDER ── */
    .origin-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
      margin-top: 4px;
    }
    .origin-item {
      display: flex; align-items: center; gap: 8px;
      padding: 9px 12px;
      background: rgba(255,255,255,0.03);
      border-radius: 8px; border: 1px solid var(--border);
    }
    .origin-flag { font-size: 18px; line-height: 1; }
    .origin-name { font-size: 11px; color: var(--muted); }
    .origin-val  { font-size: 13px; font-weight: 700; margin-left: auto; }

    /* ── OVERDUE ALERTS ── */
    .alert-list { display: flex; flex-direction: column; gap: 8px; }
    .alert-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px;
      background: rgba(224,92,92,0.06);
      border: 1px solid rgba(224,92,92,0.2);
      border-radius: 9px;
    }
    .alert-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--accent4); flex-shrink: 0;
      animation: pulse 1.5s infinite;
    }
    .alert-name { font-size: 12px; font-weight: 600; flex: 1; }
    .alert-status { font-size: 10px; color: var(--muted); }
    .alert-days {
      font-size: 11px; font-weight: 700; color: var(--accent4);
      background: rgba(224,92,92,0.12); padding: 2px 8px; border-radius: 20px;
    }

    /* ── RECENT TABLE ── */
    .recent-table { width: 100%; border-collapse: collapse; }
    .recent-table th {
      font-size: 10px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; color: var(--muted);
      padding: 0 12px 12px; text-align: left;
    }
    .recent-table td {
      font-size: 12px; padding: 11px 12px;
      border-top: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
    }
    .recent-table tr:hover td { background: rgba(255,255,255,0.02); }
    .ship-id { font-weight: 700; color: var(--accent1); font-size: 11px; }
    .status-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700;
    }
    .status-pill::before {
      content: ''; width: 5px; height: 5px; border-radius: 50%;
    }
    .s-pi    { background: rgba(167,139,250,0.12); color: var(--accent5); }
    .s-pi::before { background: var(--accent5); }
    .s-po    { background: rgba(79,142,247,0.12); color: var(--accent1); }
    .s-po::before { background: var(--accent1); }
    .s-inv   { background: rgba(245,166,35,0.12); color: var(--accent3); }
    .s-inv::before { background: var(--accent3); }
    .s-kra   { background: rgba(245,166,35,0.15); color: #f0a500; }
    .s-kra::before { background: #f0a500; }
    .s-del   { background: rgba(54,201,142,0.12); color: var(--accent2); }
    .s-del::before { background: var(--accent2); }
    .s-clr   { background: rgba(54,201,142,0.2); color: #28b07a; }
    .s-clr::before { background: #28b07a; }
    .s-closed{ background: rgba(255,255,255,0.06); color: var(--muted); }
    .s-closed::before { background: var(--muted); }

    .mode-tag {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10px; color: var(--muted);
    }

    /* ── MINI PROGRESS DOTS ── */
    .dots { display: flex; gap: 3px; align-items: center; }
    .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.1);
    }
    .dot.done { background: var(--accent2); border-color: var(--accent2); }
    .dot.active { background: transparent; border-color: var(--accent1); box-shadow: 0 0 0 2px rgba(79,142,247,0.2); }

    /* ── VALUE HEATMAP ── */
    .value-bars { display: flex; flex-direction: column; gap: 9px; margin-top: 4px; }
    .vbar-row { display: flex; align-items: center; gap: 10px; }
    .vbar-name { font-size: 11px; color: var(--muted); width: 130px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .vbar-bg { flex: 1; height: 18px; background: rgba(255,255,255,0.04); border-radius: 5px; overflow: hidden; }
    .vbar-fill { height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--accent1), var(--accent5)); }
    .vbar-amt { font-size: 11px; font-weight: 600; width: 68px; text-align: right; flex-shrink: 0; color: var(--text); }

    /* ── FOOTER ── */
    .footer {
      margin-top: 40px; padding: 20px 32px;
      border-top: 1px solid var(--border);
      display: flex; justify-content: space-between;
      font-size: 11px; color: var(--muted);
    }
  </style>`
let raw_html = `

</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="header-left">
    <div class="header-logo">🚢</div>
    <div>
      <div class="header-title">Import Tracker</div>
      <div class="header-sub">Shipment Intelligence Dashboard</div>
    </div>
  </div>
  <div class="header-right">
    <span class="badge live">Live</span>
    <span class="badge" id="fy-badge">FY Data</span>
  </div>
</div>

<div class="page">

  <!-- KPI CARDS -->
  <div class="section-label">At a Glance</div>
  <div class="kpi-grid">
    <div class="kpi-card blue">
      <div class="kpi-icon">📦</div>
      <div class="kpi-value" id="kpi-open-shipments">-</div>
      <div class="kpi-label">Open Shipments</div>
    </div>
    <div class="kpi-card amber">
      <div class="kpi-icon">🏛️</div>
      <div class="kpi-value" id="kpi-unpaid-kra">-</div>
      <div class="kpi-label">Unpaid KRA Duties</div>
      <div class="kpi-delta down" id="kpi-unpaid-kra-amt">-</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">💳</div>
      <div class="kpi-value" id="kpi-supplier-payment">-</div>
      <div class="kpi-label">Awaiting Supplier Payment</div>
      <div class="kpi-delta up" id="kpi-supplier-payment-amt">-</div>
    </div>
    <div class="kpi-card red">
      <div class="kpi-icon">⚠️</div>
      <div class="kpi-value" id="kpi-overdue">-</div>
      <div class="kpi-label">Overdue (>14 days)</div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-icon">✅</div>
      <div class="kpi-value" id="kpi-closed-year">-</div>
      <div class="kpi-label">Closed This Year</div>
    </div>
  </div>

  <div class="section-label" style="margin-top:28px">Pipeline & Breakdown</div>
  <div class="chart-grid-2">
    <div class="chart-card">
      <div class="chart-header">
        <div><div class="chart-title">Shipments by Stage</div><div class="chart-subtitle">Live pipeline</div></div>
        <span class="chart-tag" id="pipeline-tag">- open</span>
      </div>
      <div class="pipeline" id="pipeline-container"></div>
    </div>
    <div class="chart-card">
      <div class="chart-header"><div><div class="chart-title">Shipping Mode</div><div class="chart-subtitle">Active shipments by mode</div></div></div>
      <div class="chart-wrap" style="height:180px"><canvas id="modeChart"></canvas></div>
      <div id="mode-legend" style="display:flex;gap:16px;justify-content:center;margin-top:14px;flex-wrap:wrap"></div>
    </div>
  </div>

  <div class="section-label">Trends & Values</div>
  <div class="chart-grid-3">
    <div class="chart-card" style="grid-column: span 2">
      <div class="chart-header"><div><div class="chart-title">Monthly Shipment Activity</div><div class="chart-subtitle">New vs Closed (12 Months)</div></div></div>
      <div class="chart-wrap" style="height:200px"><canvas id="trendChart"></canvas></div>
    </div>
    <div class="chart-card">
      <div class="chart-header"><div><div class="chart-title">Origin Countries</div><div class="chart-subtitle">Active shipment counts</div></div></div>
      <div class="origin-grid" id="origins-grid"></div>
    </div>
  </div>

  <div class="section-label">Suppliers & Alerts</div>
  <div class="chart-grid-2">
    <div class="chart-card">
      <div class="chart-header"><div><div class="chart-title">Top Suppliers by Invoice</div><div class="chart-subtitle">Commercial invoice value</div></div></div>
      <div class="value-bars" id="suppliers-list"></div>
    </div>
    <div class="chart-card">
      <div class="chart-header">
        <div><div class="chart-title">Overdue Alerts</div><div class="chart-subtitle">No progress in >14 days</div></div>
        <span class="chart-tag" id="alerts-tag" style="background:rgba(224,92,92,0.1);color:var(--accent4);border-color:rgba(224,92,92,0.3)">0 flagged</span>
      </div>
      <div class="alert-list" id="alerts-list"></div>
    </div>
  </div>

  <div class="section-label">Recent Shipments</div>
  <div class="chart-card">
    <div class="chart-header">
      <div><div class="chart-title">Active Shipment Register</div><div class="chart-subtitle">All open shipments — sorted by recent updates</div></div>
      <span class="chart-tag" id="recent-tag">- open</span>
    </div>
    <table class="recent-table">
      <thead><tr><th>Shipment ID</th><th>Supplier</th><th>Description</th><th>Mode</th><th>Status</th><th>ETA Port</th><th>Assigned</th></tr></thead>
      <tbody id="recent-table-body"></tbody>
    </table>
  </div>
</div>

<div class="footer">
  <span>Import Tracker v0.0.2 · Dynamic Data</span>
</div>`;

    $(page.body).append(raw_html);

    frappe.call({
        method: "import_tracker.import_tracker.page.import_dashboard.import_dashboard.get_dashboard_data",
        callback: function(r) {
            if(r.message) {
                render_dashboard(r.message, page);
            }
        }
    });
};

const formatCurrency = (amt, curr="USD") => {
    if(!amt) return curr + " 0";
    if(amt >= 1000000) return curr + " " + (amt/1000000).toFixed(1) + "M";
    if(amt >= 1000) return curr + " " + (amt/1000).toFixed(0) + "k";
    return curr + " " + formatNumberStr(amt);
}

const formatNumberStr = n => String(n).replace(/(.)(?=(\d{3})+$)/g,'$1,');

const formatMode = mode => mode=='Air'?'✈️ Air':mode=='Sea'?'🚢 Sea':mode=='Road'?'🚛 Road':mode;
const modeClass = mode => mode=='Air'?'air':mode=='Sea'?'sea':'road';

function render_dashboard(data, page) {
    // KPIs
    $('#kpi-open-shipments').text(data.kpis.open_shipments);
    $('#kpi-unpaid-kra').text(data.kpis.unpaid_kra_duties);
    $('#kpi-unpaid-kra-amt').text("KES " + formatNumberStr((data.kpis.kra_outstanding_amount || 0).toFixed(2)) + ' outstanding');
    $('#kpi-supplier-payment').text(data.kpis.awaiting_supplier_payment);
    $('#kpi-supplier-payment-amt').text("USD " + formatNumberStr((data.kpis.supplier_outstanding_amount || 0).toFixed(2)) + ' outstanding');
    $('#kpi-overdue').text(data.kpis.overdue);
    $('#kpi-closed-year').text(data.kpis.closed_this_year);
    
    $('#pipeline-tag, #recent-tag').text(data.kpis.open_shipments + ' open');
    $('#alerts-tag').text(data.kpis.overdue + ' flagged');

    // Pipeline
    const stages = [
      { name: "PI Received", color: ["#a78bfa", "#7c6ee0"], text: "#a78bfa" },
      { name: "PO Issued", color: ["#4f8ef7", "#2d6fe0"], text: "#4f8ef7" },
      { name: "Invoice Received", color: ["#f5a623", "#e09210"], text: "#f5a623" },
      { name: "KRA Docs Received", color: ["#f0a500", "#d98f00"], text: "#f0a500" },
      { name: "Delivered", color: ["#36c98e", "#24a872"], text: "#36c98e" },
      { name: "Clearing Docs Received", color: ["#28b07a", "#1d9060"], text: "#28b07a" }
    ];
    let pipeHtml = '';
    let maxPipeCount = Math.max(...Object.values(data.pipeline), 1);
    stages.forEach(s => {
        let count = data.pipeline[s.name] || 0;
        let pct = (count / maxPipeCount) * 100;
        pipeHtml += `
        <div class="pipeline-row">
          <div class="pipeline-label">${s.name}</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${s.color[0]},${s.color[1]})">${count||''}</div>
          </div>
          <div class="pipeline-count" style="color:${s.text}">${count}</div>
        </div>`;
    });
    $('#pipeline-container').html(pipeHtml);

    // Origins
    let orgHtml = '';
    const flags = {"Sweden":"🇸🇪", "Germany":"🇩🇪", "China":"🇨🇳", "India":"🇮🇳", "USA":"🇺🇸", "South Africa":"🇿🇦"};
    for(let country in data.origins) {
        let c = data.origins[country];
        orgHtml += `
        <div class="origin-item">
          <div class="origin-flag">${flags[country] || '🏳️'}</div>
          <div><div style="font-size:11px;font-weight:600">${country}</div></div>
          <div class="origin-val" style="color:var(--accent1)">${c}</div>
        </div>`;
    }
    $('#origins-grid').html(orgHtml);

    // Suppliers
    let supHtml = '';
    let maxSupVal = data.top_suppliers.length ? data.top_suppliers[0].value : 1;
    data.top_suppliers.forEach(s => {
        let pct = (s.value / maxSupVal) * 100;
        supHtml += `
        <div class="vbar-row">
          <div class="vbar-name" title="${s.supplier}">${s.supplier}</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:${pct}%"></div></div>
          <div class="vbar-amt">${formatCurrency(s.value, 'USD')}</div>
        </div>`;
    });
    if(!supHtml) supHtml = '<div style="font-size:11px;color:var(--muted)">No data available.</div>';
    $('#suppliers-list').html(supHtml);

    // Alerts
    let altHtml = '';
    data.overdue_alerts.forEach(a => {
        altHtml += `
        <div class="alert-item">
          <div class="alert-dot"></div>
          <div>
            <div class="alert-name"><a href="/app/import-shipment/${a.name}" style="color:inherit;text-decoration:none">${a.name}</a></div>
            <div class="alert-status">${a.supplier}</div>
          </div>
          <div class="alert-days">${a.days_overdue} days</div>
        </div>`;
    });
    if(!altHtml) altHtml = '<div style="font-size:11px;color:var(--muted)">No overdue shipments.</div>';
    $('#alerts-list').html(altHtml);
    
    // Recent
    const statusMap = {
        'PI Received': 's-pi', 'PO Issued': 's-po', 'Invoice Received': 's-inv',
        'KRA Docs Received': 's-kra', 'Delivered': 's-del', 'Clearing Docs Received': 's-clr',
        'Closed': 's-closed'
    };
    let recHtml = '';
    data.recent_shipments.forEach(r => {
        let sp = statusMap[r.status] || 's-closed';
        recHtml += `
        <tr>
          <td><a href="/app/import-shipment/${r.name}" class="ship-id" style="text-decoration:none">${r.name}</a></td>
          <td style="font-size:12px">${r.supplier}</td>
          <td style="font-size:11px;color:var(--muted)">${r.description?r.description.substring(0,30):''}</td>
          <td><span class="mode-tag">${formatMode(r.shipping_mode)}</span></td>
          <td><span class="status-pill ${sp}">${r.status}</span></td>
          <td style="font-size:11px;color:var(--muted)">${r.eta_port?r.eta_port:'—'}</td>
          <td style="font-size:11px;color:var(--muted)">${r.assigned_to?r.assigned_to.split('@')[0]:'—'}</td>
        </tr>`;
    });
    if(!recHtml) recHtml = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">No active shipments</td></tr>';
    $('#recent-table-body').html(recHtml);

    // Load Default Chart
    frappe.require('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', () => {
        
        let modeLabels = Object.keys(data.shipping_mode);
        let modeData = Object.values(data.shipping_mode);
        let modeColors = modeLabels.map(l => l=='Sea'?'#4f8ef7':l=='Air'?'#36c98e':'#f5a623');
        
        new Chart(document.getElementById('modeChart'), {
            type: 'doughnut',
            data: { labels: modeLabels, datasets: [{ data: modeData, backgroundColor: modeColors, borderColor: '#21263a', borderWidth: 3, hoverOffset: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1a1d27', borderColor: '#2e3452', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#7a859e', callbacks: { label: ctx => ` ${ctx.parsed} shipments` } } } }
        });

        // Legend for mode
        let legHtml = "";
        modeLabels.forEach((l, i) => { legHtml+=`<span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;border-radius:50%;background:${modeColors[i]};display:inline-block"></span> ${l}</span>`; });
        $('#mode-legend').html(legHtml);

        new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
              labels: data.monthly_trend.labels.reverse(),
              datasets: [
                { label: 'Opened', data: data.monthly_trend.opened.reverse(), borderColor: '#4f8ef7', backgroundColor: 'rgba(79,142,247,0.08)', borderWidth: 2, pointBackgroundColor: '#4f8ef7', pointRadius: 4, pointHoverRadius: 6, tension: 0.4, fill: true },
                { label: 'Closed', data: data.monthly_trend.closed.reverse(), borderColor: '#36c98e', backgroundColor: 'rgba(54,201,142,0.06)', borderWidth: 2, pointBackgroundColor: '#36c98e', pointRadius: 4, pointHoverRadius: 6, tension: 0.4, fill: true }
              ]
            },
            options: {
              responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
              plugins: {
                legend: { position: 'top', align: 'end', labels: { color: '#7a859e', font: { size: 11 }, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyleWidth: 10 } },
                tooltip: { backgroundColor: '#1a1d27', borderColor: '#2e3452', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#7a859e' }
              },
              scales: {
                x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a859e', font: { size: 11 } }, border: { color: 'rgba(255,255,255,0.06)' } },
                y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#7a859e', font: { size: 11 }, stepSize: 2 }, border: { color: 'rgba(255,255,255,0.06)' }, min: 0 }
              }
            }
        });
    });
}
