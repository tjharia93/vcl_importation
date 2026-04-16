// Deprecated — use Import Dashboard instead.
frappe.pages["importation_metrics"].on_page_load = function (wrapper) {
	frappe.ui.make_app_page({
		parent: wrapper,
		title: "Importation Metrics (Deprecated)",
		single_column: true,
	});
	$(wrapper).find(".layout-main-section").html(
		'<div style="padding:40px;text-align:center;color:#888">' +
			"This page has been replaced. " +
			'<a href="/app/import-dashboard">Go to Import Dashboard</a></div>'
	);
};
