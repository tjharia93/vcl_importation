frappe.pages['import-dashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Import Dashboard',
		single_column: true
	});

	let $container = $(`
		<div class="import-dashboard-wrapper">
			${frappe.render_template('import_dashboard', {})}
		</div>
	`);
	
	$(page.body).append($container);
	
	frappe.require('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js', () => {
		init_charts();
	});

    function init_charts() {
        
    }
}
