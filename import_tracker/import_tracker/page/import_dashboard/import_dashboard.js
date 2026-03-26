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
  </style>
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
    <span class="badge">FY 2025–26</span>
    <span style="font-size:11px;color:var(--muted)">Last refreshed: just now</span>
  </div>
</div>

<div class="page">

  <!-- KPI CARDS -->
  <div class="section-label">At a Glance</div>
  <div class="kpi-grid">

    <div class="kpi-card blue">
      <div class="kpi-icon">📦</div>
      <div class="kpi-value">14</div>
      <div class="kpi-label">Open Shipments</div>
      <div class="kpi-delta up">↑ 3 from last month</div>
    </div>

    <div class="kpi-card amber">
      <div class="kpi-icon">🏛️</div>
      <div class="kpi-value">4</div>
      <div class="kpi-label">Unpaid KRA Duties</div>
      <div class="kpi-delta down">KES 2.4M outstanding</div>
    </div>

    <div class="kpi-card green">
      <div class="kpi-icon">💳</div>
      <div class="kpi-value">6</div>
      <div class="kpi-label">Awaiting Supplier Payment</div>
      <div class="kpi-delta up">USD 182k due</div>
    </div>

    <div class="kpi-card red">
      <div class="kpi-icon">⚠️</div>
      <div class="kpi-value">3</div>
      <div class="kpi-label">Overdue (&gt;14 days)</div>
      <div class="kpi-delta down">No progress flagged</div>
    </div>

    <div class="kpi-card purple">
      <div class="kpi-icon">✅</div>
      <div class="kpi-value">27</div>
      <div class="kpi-label">Closed This Year</div>
      <div class="kpi-delta up">↑ 12% vs last year</div>
    </div>

  </div>

  <!-- ROW 2: Pipeline + Mode donut -->
  <div class="section-label" style="margin-top:28px">Pipeline & Breakdown</div>
  <div class="chart-grid-2">

    <!-- Pipeline by stage -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <div class="chart-title">Shipments by Stage</div>
          <div class="chart-subtitle">Live pipeline — open shipments only</div>
        </div>
        <span class="chart-tag">14 open</span>
      </div>
      <div class="pipeline">
        <div class="pipeline-row">
          <div class="pipeline-label">PI Received</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:21%;background:linear-gradient(90deg,#a78bfa,#7c6ee0)">2</div>
          </div>
          <div class="pipeline-count" style="color:#a78bfa">2</div>
        </div>
        <div class="pipeline-row">
          <div class="pipeline-label">PO Issued</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:29%;background:linear-gradient(90deg,#4f8ef7,#2d6fe0)">3</div>
          </div>
          <div class="pipeline-count" style="color:#4f8ef7">3</div>
        </div>
        <div class="pipeline-row">
          <div class="pipeline-label">Invoice Received</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:36%;background:linear-gradient(90deg,#f5a623,#e09210)">4</div>
          </div>
          <div class="pipeline-count" style="color:#f5a623">4</div>
        </div>
        <div class="pipeline-row">
          <div class="pipeline-label">KRA Docs Received</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:21%;background:linear-gradient(90deg,#f0a500,#d98f00)">2</div>
          </div>
          <div class="pipeline-count" style="color:#f0a500">2</div>
        </div>
        <div class="pipeline-row">
          <div class="pipeline-label">Delivered</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:29%;background:linear-gradient(90deg,#36c98e,#24a872)">3</div>
          </div>
          <div class="pipeline-count" style="color:#36c98e">3</div>
        </div>
        <div class="pipeline-row">
          <div class="pipeline-label">Clearing Docs Recv'd</div>
          <div class="pipeline-bar-bg">
            <div class="pipeline-bar-fill" style="width:0%;background:linear-gradient(90deg,#28b07a,#1d9060)"></div>
          </div>
          <div class="pipeline-count" style="color:#28b07a">0</div>
        </div>
      </div>
    </div>

    <!-- Shipping mode donut -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <div class="chart-title">Shipping Mode</div>
          <div class="chart-subtitle">All shipments YTD</div>
        </div>
      </div>
      <div class="chart-wrap" style="height:180px">
        <canvas id="modeChart"></canvas>
      </div>
      <div style="display:flex;gap:16px;justify-content:center;margin-top:14px;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px">
          <span style="width:10px;height:10px;border-radius:50%;background:#4f8ef7;display:inline-block"></span> Sea
        </span>
        <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px">
          <span style="width:10px;height:10px;border-radius:50%;background:#36c98e;display:inline-block"></span> Air
        </span>
        <span style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:5px">
          <span style="width:10px;height:10px;border-radius:50%;background:#f5a623;display:inline-block"></span> Road
        </span>
      </div>
    </div>

  </div>

  <!-- ROW 3: Monthly trend + Supplier value + Origins -->
  <div class="section-label">Trends & Values</div>
  <div class="chart-grid-3">

    <!-- Monthly trend -->
    <div class="chart-card" style="grid-column: span 2">
      <div class="chart-header">
        <div>
          <div class="chart-title">Monthly Shipment Activity</div>
          <div class="chart-subtitle">New shipments opened vs closed — FY 2025–26</div>
        </div>
        <span class="chart-tag">12 months</span>
      </div>
      <div class="chart-wrap" style="height:200px">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <!-- Country of origin -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <div class="chart-title">Origin Countries</div>
          <div class="chart-subtitle">Shipment count by source</div>
        </div>
      </div>
      <div class="origin-grid">
        <div class="origin-item">
          <div class="origin-flag">🇸🇪</div>
          <div>
            <div style="font-size:11px;font-weight:600">Sweden</div>
            <div class="origin-name">Paper / Pulp</div>
          </div>
          <div class="origin-val" style="color:var(--accent1)">8</div>
        </div>
        <div class="origin-item">
          <div class="origin-flag">🇩🇪</div>
          <div>
            <div style="font-size:11px;font-weight:600">Germany</div>
            <div class="origin-name">Machinery</div>
          </div>
          <div class="origin-val" style="color:var(--accent2)">5</div>
        </div>
        <div class="origin-item">
          <div class="origin-flag">🇨🇳</div>
          <div>
            <div style="font-size:11px;font-weight:600">China</div>
            <div class="origin-name">Raw Mats</div>
          </div>
          <div class="origin-val" style="color:var(--accent3)">7</div>
        </div>
        <div class="origin-item">
          <div class="origin-flag">🇮🇳</div>
          <div>
            <div style="font-size:11px;font-weight:600">India</div>
            <div class="origin-name">Fin. Goods</div>
          </div>
          <div class="origin-val" style="color:var(--accent5)">4</div>
        </div>
        <div class="origin-item">
          <div class="origin-flag">🇺🇸</div>
          <div>
            <div style="font-size:11px;font-weight:600">USA</div>
            <div class="origin-name">Machinery</div>
          </div>
          <div class="origin-val" style="color:var(--accent1)">3</div>
        </div>
        <div class="origin-item">
          <div class="origin-flag">🇿🇦</div>
          <div>
            <div style="font-size:11px;font-weight:600">S. Africa</div>
            <div class="origin-name">Other</div>
          </div>
          <div class="origin-val" style="color:var(--muted)">2</div>
        </div>
      </div>
    </div>

  </div>

  <!-- ROW 4: Supplier value + overdue alerts -->
  <div class="section-label">Suppliers & Alerts</div>
  <div class="chart-grid-2">

    <!-- Supplier value bars -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <div class="chart-title">Top Suppliers by Invoice Value</div>
          <div class="chart-subtitle">Commercial invoice value — USD</div>
        </div>
      </div>
      <div class="value-bars">
        <div class="vbar-row">
          <div class="vbar-name">Elof Hansson Trade</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:100%"></div></div>
          <div class="vbar-amt">$412,000</div>
        </div>
        <div class="vbar-row">
          <div class="vbar-name">Nordic Paper AB</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:74%"></div></div>
          <div class="vbar-amt">$305,000</div>
        </div>
        <div class="vbar-row">
          <div class="vbar-name">Voith GmbH</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:58%"></div></div>
          <div class="vbar-amt">$238,000</div>
        </div>
        <div class="vbar-row">
          <div class="vbar-name">Shenzhen Intl Trade</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:42%"></div></div>
          <div class="vbar-amt">$174,000</div>
        </div>
        <div class="vbar-row">
          <div class="vbar-name">Tata International</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:31%"></div></div>
          <div class="vbar-amt">$128,000</div>
        </div>
        <div class="vbar-row">
          <div class="vbar-name">Metso Outotec</div>
          <div class="vbar-bg"><div class="vbar-fill" style="width:22%"></div></div>
          <div class="vbar-amt">$91,000</div>
        </div>
      </div>
    </div>

    <!-- Overdue alerts -->
    <div class="chart-card">
      <div class="chart-header">
        <div>
          <div class="chart-title">Overdue Alerts</div>
          <div class="chart-subtitle">No stage progress in &gt;14 days</div>
        </div>
        <span class="chart-tag" style="background:rgba(224,92,92,0.1);color:var(--accent4);border-color:rgba(224,92,92,0.3)">3 flagged</span>
      </div>
      <div class="alert-list">
        <div class="alert-item">
          <div class="alert-dot"></div>
          <div>
            <div class="alert-name">SHIP-2025-00041</div>
            <div class="alert-status">Elof Hansson • Uncoated Wood Free</div>
          </div>
          <div class="alert-days">22 days</div>
        </div>
        <div class="alert-item">
          <div class="alert-dot"></div>
          <div>
            <div class="alert-name">SHIP-2025-00037</div>
            <div class="alert-status">Nordic Paper • Kraft Liner 90gsm</div>
          </div>
          <div class="alert-days">18 days</div>
        </div>
        <div class="alert-item">
          <div class="alert-dot"></div>
          <div>
            <div class="alert-name">SHIP-2025-00033</div>
            <div class="alert-status">Voith GmbH • Press Section Parts</div>
          </div>
          <div class="alert-days">15 days</div>
        </div>
      </div>

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
        <div style="font-size:11px;color:var(--muted);margin-bottom:10px;font-weight:600">AVERAGE LEAD TIME BY STAGE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:18px;font-weight:800;color:var(--accent1)">6.2</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">avg days PI→PO</div>
          </div>
          <div style="padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:18px;font-weight:800;color:var(--accent3)">18.4</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">avg days PO→Invoice</div>
          </div>
          <div style="padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:18px;font-weight:800;color:var(--accent2)">34.1</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">avg days Invoice→Del.</div>
          </div>
          <div style="padding:10px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)">
            <div style="font-size:18px;font-weight:800;color:var(--accent5)">67.8</div>
            <div style="font-size:10px;color:var(--muted);margin-top:2px">avg total days</div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- ROW 5: Recent shipments table -->
  <div class="section-label">Recent Shipments</div>
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <div class="chart-title">Active Shipment Register</div>
        <div class="chart-subtitle">All open shipments — sorted by last activity</div>
      </div>
      <span class="chart-tag">14 open</span>
    </div>
    <table class="recent-table">
      <thead>
        <tr>
          <th>Shipment ID</th>
          <th>Supplier</th>
          <th>Description</th>
          <th>Mode</th>
          <th>Status</th>
          <th>ETA Port</th>
          <th>Progress</th>
          <th>Assigned</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="ship-id">SHIP-2025-00044</span></td>
          <td style="font-size:12px">Elof Hansson</td>
          <td style="font-size:11px;color:var(--muted)">Uncoated WF 68gsm</td>
          <td><span class="mode-tag">🚢 Sea</span></td>
          <td><span class="status-pill s-po">PO Issued</span></td>
          <td style="font-size:11px;color:var(--muted)">15 Apr 2026</td>
          <td>
            <div class="dots">
              <div class="dot done"></div><div class="dot done"></div>
              <div class="dot active"></div><div class="dot"></div>
              <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
          </td>
          <td style="font-size:11px;color:var(--muted)">tanuj.haria</td>
        </tr>
        <tr>
          <td><span class="ship-id">SHIP-2025-00043</span></td>
          <td style="font-size:12px">Nordic Paper AB</td>
          <td style="font-size:11px;color:var(--muted)">Kraft Liner 90gsm</td>
          <td><span class="mode-tag">🚢 Sea</span></td>
          <td><span class="status-pill s-inv">Invoice Received</span></td>
          <td style="font-size:11px;color:var(--muted)">22 Apr 2026</td>
          <td>
            <div class="dots">
              <div class="dot done"></div><div class="dot done"></div>
              <div class="dot done"></div><div class="dot active"></div>
              <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
          </td>
          <td style="font-size:11px;color:var(--muted)">tanuj.haria</td>
        </tr>
        <tr>
          <td><span class="ship-id">SHIP-2025-00041</span></td>
          <td style="font-size:12px">Voith GmbH</td>
          <td style="font-size:11px;color:var(--muted)">Press Section Parts</td>
          <td><span class="mode-tag">✈️ Air</span></td>
          <td><span class="status-pill s-kra">KRA Docs Recv'd</span></td>
          <td style="font-size:11px;color:var(--accent4)">Overdue</td>
          <td>
            <div class="dots">
              <div class="dot done"></div><div class="dot done"></div>
              <div class="dot done"></div><div class="dot done"></div>
              <div class="dot active"></div><div class="dot"></div><div class="dot"></div>
            </div>
          </td>
          <td style="font-size:11px;color:var(--muted)">tanuj.haria</td>
        </tr>
        <tr>
          <td><span class="ship-id">SHIP-2025-00040</span></td>
          <td style="font-size:12px">Shenzhen Intl</td>
          <td style="font-size:11px;color:var(--muted)">BOPP Film Rolls</td>
          <td><span class="mode-tag">🚢 Sea</span></td>
          <td><span class="status-pill s-del">Delivered</span></td>
          <td style="font-size:11px;color:var(--muted)">—</td>
          <td>
            <div class="dots">
              <div class="dot done"></div><div class="dot done"></div>
              <div class="dot done"></div><div class="dot done"></div>
              <div class="dot done"></div><div class="dot active"></div><div class="dot"></div>
            </div>
          </td>
          <td style="font-size:11px;color:var(--muted)">tanuj.haria</td>
        </tr>
        <tr>
          <td><span class="ship-id">SHIP-2025-00039</span></td>
          <td style="font-size:12px">Tata International</td>
          <td style="font-size:11px;color:var(--muted)">Duplex Board 400gsm</td>
          <td><span class="mode-tag">🚛 Road</span></td>
          <td><span class="status-pill s-pi">PI Received</span></td>
          <td style="font-size:11px;color:var(--muted)">TBD</td>
          <td>
            <div class="dots">
              <div class="dot done"></div><div class="dot active"></div>
              <div class="dot"></div><div class="dot"></div>
              <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
          </td>
          <td style="font-size:11px;color:var(--muted)">tanuj.haria</td>
        </tr>
      </tbody>
    </table>
  </div>

</div>

<!-- FOOTER -->
<div class="footer">
  <span>Import Tracker v0.0.2 · ERPNext v16 · Frappe Cloud</span>
  <span>Prototype — mock data only</span>
</div>`;
	$(page.body).append(raw_html);
	
	// Load Chart.js and execute the prototype logic exactly as written
	frappe.require('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', () => {
		// ── Shipping Mode Donut ──
  new Chart(document.getElementById('modeChart'), {
    type: 'doughnut',
    data: {
      labels: ['Sea', 'Air', 'Road'],
      datasets: [{
        data: [22, 8, 11],
        backgroundColor: ['#4f8ef7', '#36c98e', '#f5a623'],
        borderColor: '#21263a',
        borderWidth: 3,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1a1d27',
          borderColor: '#2e3452',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#7a859e',
          callbacks: {
            label: ctx => ` ${ctx.parsed} shipments`
          }
        }
      }
    }
  });

  // ── Monthly Trend ──
  const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Opened',
          data: [3,5,4,6,4,5,7,3,4,6,5,4],
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79,142,247,0.08)',
          borderWidth: 2,
          pointBackgroundColor: '#4f8ef7',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Closed',
          data: [2,3,4,4,5,4,5,4,3,5,4,3],
          borderColor: '#36c98e',
          backgroundColor: 'rgba(54,201,142,0.06)',
          borderWidth: 2,
          pointBackgroundColor: '#36c98e',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#7a859e', font: { size: 11 },
            boxWidth: 10, boxHeight: 10,
            usePointStyle: true, pointStyleWidth: 10,
          }
        },
        tooltip: {
          backgroundColor: '#1a1d27',
          borderColor: '#2e3452',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#7a859e',
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#7a859e', font: { size: 11 } },
          border: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#7a859e', font: { size: 11 }, stepSize: 2 },
          border: { color: 'rgba(255,255,255,0.06)' },
          min: 0,
        }
      }
    }
  });
	});
}
