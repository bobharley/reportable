'use strict';

var Reportable = function Reportable(data) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	if (data != undefined && Array.isArray(data) && data.length > 0) {
		this.container = document.querySelector(options.container);
		if (this.container) {
			this.defaultPageLength = options.pageLength != undefined && options.pageLength.default != undefined ? options.pageLength.default != 'all' ? isNaN(options.pageLength.default) ? 5 : parseInt(options.pageLength.default) : 'all' : 5;
			this.enablePagination = options.pagination != undefined ? !!options.pagination : true;
			this.enablePageInfo = options.pageInfo != undefined ? !!options.pageInfo : true;
			this.enablePageLength = options.pageLength != undefined ? !!options.pageLength.enabled : true;
			this.enableSearch = options.search != undefined ? !!options.search : true;
			this.title = options.title != undefined ? options.title : '';
			this.title = options.title != undefined ? options.title : '';
			this.searchdata = data.slice(1);
			this.tabledata = data.slice();
			this.injectCss();
			this.renderTable(data, this.container);
			this.addEventListeners();
		}
	}
	if(options && options.callback) {
		options.callback();
	}
};

Reportable.prototype.sortRows = function (data) {
	var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
	var order = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'asc';

	if (data) {
		return data.sort(function (a, b) {
			return order === 'asc' ? a[index] > b[index] ? 1 : -1 : a[index] > b[index] ? -1 : 1;
		});
	}
	return [];
};

Reportable.prototype.updatePaginationButtons = function () {
	var table = this.container.querySelector('table');
	var rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
	var leftArrow = this.container.querySelector('.table-footer .pagination button.left-arrow');
	var rightArrow = this.container.querySelector('.table-footer .pagination button.right-arrow');
	if (table && rowsperpage && leftArrow && rightArrow) {
		if (rowsperpage.value == 'all') {
			leftArrow.disabled = true;
			rightArrow.disabled = true;
		} else {
			var page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
			var numRowsVisible = table.querySelectorAll('tbody tr').length;
			leftArrow.disabled = page == 0;
			rightArrow.disabled = this.searchdata.length <= parseInt(rowsperpage.value) * page + numRowsVisible;
		}
	}
};

Reportable.prototype.updateTableInfo = function () {
	var tableInfo = this.container.querySelector('.table-footer .table-info span');
	var rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
	var table = this.container.querySelector('table');
	if (tableInfo && rowsperpage && table) {
		var page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
		var numRowsVisible = table.querySelectorAll('tbody tr').length;
		var from = rowsperpage.value == 'all' ? 1 : page * parseInt(rowsperpage.value) + 1;
		var to = rowsperpage.value == 'all' ? this.searchdata.length : from + numRowsVisible - 1;
		tableInfo.innerText = from + '-' + to + ' of ' + this.searchdata.length;
	}
	this.updatePaginationButtons();
};

Reportable.prototype.updateTable = function (data) {
	var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

	var viewitems = options.viewitems != undefined ? parseInt(options.viewitems) : 'all';
	var rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
	if (rowsperpage) viewitems = rowsperpage.value == 'all' ? 'all' : parseInt(rowsperpage.value);
	var startfrom = options.startfrom != undefined ? parseInt(options.startfrom) : 0;
	var table = this.container.querySelector('table');
	var tablebody = this.container.querySelector('table tbody');
	var tbody = '';
	var counter = 0;
	if (data.length > 0) {
		data.forEach(function (row, rowindex) {
			if (rowindex < startfrom || viewitems != 'all' && counter >= viewitems) return;
			var tr = '';
			row.forEach(function (column, columnindex) {
				tr += '\n\t\t\t\t\t<td>' + column + '</td>\n\t\t\t\t';
			});
			tr = '\n\t\t\t\t<tr>\n\t\t\t\t\t' + tr + '\n\t\t\t\t</tr>\n\t\t\t';

			tbody += tr;
			counter++;
		});
	} else {
		tbody = '\n\t\t\t<tr>\n\t\t\t\t<td colspan="' + this.tabledata[0].length + '" style="text-align: center;">\n\t\t\t\t\tNo items\n\t\t\t\t</td>\n\t\t\t</tr>\n\t\t';
	}

	tbody = '\n\t\t<tbody>\n\t\t\t' + tbody + '\n\t\t</tbody>\n\t';
	tablebody.innerHTML = tbody;
	this.updateTableInfo();
};

Reportable.prototype.addEventListeners = function () {
	var _this = this;

	// Search
	var searchinput = this.container.querySelector('.table-header .table-tools .search input[name="search"]');
	var displayMatches = function displayMatches() {
		var regex = new RegExp(searchinput.value, 'gi');
		var matches = _this.tabledata.slice(1).filter(function (arr) {
			return arr.some(function (item) {
				return item.toString().match(regex);
			});
		});
		_this.searchdata = matches;
		var table = _this.container.querySelector('table');
		if (table) table.dataset.page = 0;
		_this.updateTable(matches);
	};

	if (searchinput) {
		searchinput.addEventListener('change', displayMatches);
		searchinput.addEventListener('keyup', displayMatches);
	}

	// Sort
	var tableheaders = this.container.querySelectorAll('table th');
	if (tableheaders) {
		tableheaders.forEach(function (th) {
			th.addEventListener('click', function () {
				if (th.dataset.sortingColumn == 'true') {
					th.dataset.sortOrder = th.dataset.sortOrder == 'asc' ? 'desc' : 'asc';
				} else {
					var prevth = _this.container.querySelector('table th[data-sorting-column="true"]');
					if (prevth) prevth.dataset.sortingColumn = 'false';
					th.dataset.sortingColumn = 'true';
					th.dataset.sortOrder = 'asc';
				}

				var sortingColumn = _this.container.querySelector('table th[data-sorting-column="true"]');
				if (sortingColumn) {
					var sortIndex = sortingColumn.dataset.sortIndex;
					var sortOrder = sortingColumn.dataset.sortOrder;
					_this.searchdata = _this.sortRows(_this.searchdata, sortIndex, sortOrder);
					var _table = _this.container.querySelector('table');
					if (_table) _table.dataset.page = 0;
					_this.updateTable(_this.searchdata);
				}
			});
		});
	}

	// Page length
	var rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
	if (rowsperpage) {
		rowsperpage.addEventListener('change', function () {
			var sortingColumn = _this.container.querySelector('table th[data-sorting-column="true"]');
			var table = _this.container.querySelector('table');
			if (table) table.dataset.page = 0;
			if (sortingColumn) {
				var sortIndex = sortingColumn.dataset.sortIndex;
				var sortOrder = sortingColumn.dataset.sortOrder;
				_this.searchdata = _this.sortRows(_this.searchdata, sortIndex, sortOrder);
				_this.updateTable(_this.searchdata);
			} else {
				_this.updateTable(_this.searchdata);
			}
		});
	}

	// Pagination buttons
	var leftArrow = this.container.querySelector('.table-footer .pagination button.left-arrow');
	var rightArrow = this.container.querySelector('.table-footer .pagination button.right-arrow');
	var table = this.container.querySelector('table');
	if (table && leftArrow && rightArrow) {
		leftArrow.addEventListener('click', function () {
			var page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
			page--;
			table.dataset.page = page;
			var sortingColumn = _this.container.querySelector('table th[data-sorting-column="true"]');
			if (sortingColumn) {
				var sortIndex = sortingColumn.dataset.sortIndex;
				var sortOrder = sortingColumn.dataset.sortOrder;
				_this.searchdata = _this.sortRows(_this.searchdata, sortIndex, sortOrder);
			}
			var rowsperpage = _this.container.querySelector('.table-footer .rows-per-page select');
			var startfrom = rowsperpage.value != 'all' ? parseInt(rowsperpage.value * page) : 0;
			_this.updateTable(_this.searchdata, { startfrom: startfrom });
		});

		rightArrow.addEventListener('click', function () {
			var page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
			page++;
			table.dataset.page = page;
			var sortingColumn = _this.container.querySelector('table th[data-sorting-column="true"]');
			if (sortingColumn) {
				var sortIndex = sortingColumn.dataset.sortIndex;
				var sortOrder = sortingColumn.dataset.sortOrder;
				_this.searchdata = _this.sortRows(_this.searchdata, sortIndex, sortOrder);
			}
			var rowsperpage = _this.container.querySelector('.table-footer .rows-per-page select');
			var startfrom = rowsperpage.value != 'all' ? parseInt(rowsperpage.value * page) : 0;
			_this.updateTable(_this.searchdata, { startfrom: startfrom });
		});
	}
};

Reportable.prototype.renderTable = function (data, container) {
	container.classList.add('reportable');
	var table = void 0;
	var thead = '';
	var tbody = '';
	var searchHtml = '\n\t\t<div class="search">\n\t\t\t<input type="text" name="search" placeholder="Search" autocomplete="off">\n\t\t</div>\n\t';

	var tableheader = '\n\t\t<div class="table-header">\n\t\t\t<div class="title-wrapper">\n\t\t\t\t<h2 class="title">' + this.title + '</h2>\n\t\t\t</div>\n\t\t\t<div class="table-tools">\n\t\t\t\t' + (this.enableSearch ? searchHtml : '') + '\n\t\t\t</div>\n\t\t</div>\n\t';

	var rowsperpageHtml = '\n\t\t<div class="rows-per-page">\n\t\t\t<label>Rows per page:</label>\n\t\t\t<div class="select-wrapper">\n\t\t\t\t<select>\n\t\t\t\t\t<option value="5" ' + (this.defaultPageLength == 5 ? 'selected' : '') + '>5</option>\n\t\t\t\t\t<option value="10" ' + (this.defaultPageLength == 10 ? 'selected' : '') + '>10</option>\n\t\t\t\t\t<option value="25" ' + (this.defaultPageLength == 25 ? 'selected' : '') + '>25</option>\n\t\t\t\t\t<option value="50" ' + (this.defaultPageLength == 50 ? 'selected' : '') + '>50</option>\n\t\t\t\t\t<option value="100" ' + (this.defaultPageLength == 100 ? 'selected' : '') + '>100</option>\n\t\t\t\t\t<option value="all" ' + (this.defaultPageLength == 'all' ? 'selected' : '') + '>All</option>\n\t\t\t\t</select>\n\t\t\t</div>\n\t\t</div>\n\t';

	var paginationHtml = '\n\t\t<div class="pagination">\n\t\t\t<button class="left-arrow"><span class="material-icons">keyboard_arrow_left</span></button>\n\t\t\t<button class="right-arrow"><span class="material-icons">keyboard_arrow_right</span></button>\n\t\t</div>\n\t';

	var tablefooter = '\n\t\t<div class="table-footer">\n\t\t\t' + (this.enablePageLength && this.enablePagination ? paginationHtml : '') + '\t\n\t\t\t<div class="table-info">\n\t\t\t\t<span>1-10 of 100</span>\n\t\t\t</div>\n\t\t\t' + (this.enablePageLength && this.enablePagination ? rowsperpageHtml : '') + '\t\n\t\t</div>\n\t';

	var headers = data[0];
	headers.forEach(function (header, index) {
		thead += '<th data-sorting-column="false" data-sort-order="asc" data-sort-index="' + index + '">\n\t\t\t' + header + '<span class="material-icons">arrow_downward</span>\n\t\t</th>';
	});

	thead = '\n\t\t<thead>\n\t\t\t<tr>\n\t\t\t\t' + thead + '\n\t\t\t</tr>\n\t\t</thead>\n\t';

	var tablebodydata = data.slice(1);
	var viewitems = this.defaultPageLength;
	var counter = 0;
	tablebodydata.forEach(function (row, rowindex) {
		if (viewitems != 'all' && counter >= viewitems) return;
		var tr = '';
		row.forEach(function (column, columnindex) {
			tr += '\n\t\t\t\t<td>' + column + '</td>\n\t\t\t';
		});
		tr = '\n\t\t\t<tr>\n\t\t\t\t' + tr + '\n\t\t\t</tr>\n\t\t';

		tbody += tr;
		counter++;
	});

	tbody = '\n\t\t<tbody>\n\t\t\t' + tbody + '\n\t\t</tbody>\n\t';

	table = '\n\t\t' + tableheader + '\n\t\t<table>\n\t\t' + thead + '\n\t\t' + tbody + '\n\t\t<table>\n\t\t' + tablefooter + '\n\t';

	container.innerHTML = table;
	this.updateTableInfo();
};

Reportable.prototype.injectCss = function () {
	if (!document.querySelector('head style.reportable-styles')) {
		var css = '\n\t\t<style class="reportable-styles">\n\t\t\t* {\n\t\t\t\tbox-sizing: border-box;\n\t\t\t}\n\n\t\t\t.reportable {\n\t\t\t\tfont-family: roboto;\n\t\t\t\t-webkit-font-smoothing: antialiased;\n\t\t\t\ttext-shadow: rgba(0,0,0,.01) 0 0 1px;\n\t\t\t}\n\n\t\t\t.reportable .table-header {\n\t\t\t\tposition: relative;\n\t\t\t\theight: 68px;\n\t\t\t\twidth: 100%;\n\t\t\t\tpadding: 24px;\n\t\t\t}\n\n\t\t\t.reportable .title-wrapper {\n\t\t\t\tposition: absolute;\n\t\t\t\ttop: 50%;\n\t\t\t\tleft: 24px;\n\t\t\t\ttransform: translateY(-50%);\n\t\t\t\twidth: 50%;\n\t\t\t}\n\n\t\t\t.reportable .title-wrapper .title {\n\t\t\t\tfont-size: 20px;\n\t\t\t\ttext-transform: capitalize;\n\t\t\t\tfont-weight: 400;\n\t\t\t\tcolor: #212121;\n\t\t\t\ttext-overflow: ellipsis;\n\t\t\t}\n\n\t\t\t.reportable .table-header .table-tools {\n\t\t\t\tposition: absolute;\n\t\t\t\tright: 24px;\n\t\t\t\ttop: 50%;\n\t\t\t\ttransform: translateY(-50%);\n\t\t\t\twidth: 50%;\n\t\t\t\tmax-width: 240px;\n\t\t\t}\n\n\t\t\t.reportable .table-header .search {\n\t\t\t\tposition: relative;\n\t\t\t\tmax-width: 100%;\n\t\t\t\twidth: 240px;\n\t\t\t}\n\n\t\t\t.reportable .table-header .search input {\n\t\t\t\twidth: 100%;\n\t\t\t\toutline: none;\n\t\t\t\tpadding: 4px 2px;\n\t\t\t\tborder: none;\n\t\t\t\tborder-bottom: 1px solid #e0e0e0;\n\t\t\t}\n\n\t\t\t.reportable .table-header .search input:focus {\n\t\t\t\tborder-bottom: 2px solid #2196F3;\n\t\t\t}\n\n\t\t\t.reportable table {\n\t\t\t\twidth: 100%;\n\t\t\t\tmin-width: 100%;\n\t\t\t\tborder-collapse: collapse;\n\t\t\t\tmargin-bottom: 1px;\n\t\t\t}\n\n\t\t\t.reportable table thead tr {\n\t\t\t\theight: 56px;\n\t\t\t}\n\n\t\t\t.reportable table thead tr th {\n\t\t\t\tposition: relative;\n\t\t\t\tborder-bottom: 1px solid #e0e0e0;\n\t\t\t\ttext-align: left;\n\t\t\t\twidth: auto;\n\t\t\t\tfont-size: 12px;\n\t\t\t\tcolor: #757575;\n\t\t\t\tfont-weight: 500;\n\t\t\t\ttext-transform: capitalize;\n\t\t\t\tcursor: pointer;\n\t\t\t\tpadding-right: 24px;\n\t\t\t}\n\n\t\t\t.reportable table thead tr th:first-child,\n\t\t\t.reportable table thead tr th:last-child {\n\t\t\t\tpadding-left: 24px;\n\t\t\t}\n\t\t\t\n\t\t\t.reportable table thead tr th span.material-icons {\n\t\t\t\tfont-size: 16px;\n\t\t\t\tposition: absolute;\n\t\t\t\tright: 24px;\n\t\t\t\ttop: 50%;\n\t\t\t\ttransform: translateY(-50%);\n\t\t\t}\n\n\t\t\t.reportable table thead tr th.align-right {\n\t\t\t\ttext-align: right;\n\t\t\t}\n\n\t\t\t.reportable table thead tr th[data-sort-order="asc"] span.material-icons {\n\t\t\t\ttransform: translateY(-50%) rotate(0deg);\n\t\t\t}\n\n\t\t\t.reportable table thead tr th[data-sort-order="desc"] span.material-icons {\n\t\t\t\ttransform: translateY(-50%) rotate(180deg);\n\t\t\t}\n\n\t\t\t.reportable table thead tr th[data-sorting-column="true"] span.material-icons {\n\t\t\t\topacity: 1;\n\t\t\t}\n\n\t\t\t.reportable table thead tr th[data-sorting-column="false"] span.material-icons {\n\t\t\t\topacity: .3;\n\t\t\t}\n\n\t\t\t.reportable table tbody tr {\n\t\t\t\theight: 48px;\n\t\t\t}\n\n\t\t\t.reportable table tbody tr td {\n\t\t\t\tborder-bottom: 1px solid #e0e0e0;\n\t\t\t\ttext-align: left;\n\t\t\t\tfont-size: 13px;\n\t\t\t\tcolor: #212121;\n\t\t\t\tfont-weight: 400;\n\t\t\t\tpadding-right: 24px;\n\t\t\t}\n\n\t\t\t.reportable table tbody tr td:first-child,\n\t\t\t.reportable table tbody tr td:last-child {\n\t\t\t\tpadding-left: 24px;\n\t\t\t}\n\n\t\t\t.reportable table tbody tr td.align-right {\n\t\t\t\ttext-align: right;\n\t\t\t}\n\n\t\t\t.reportable .table-footer {\n\t\t\t\theight: 56px;\n\t\t\t\tpadding: 12px;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .pagination,\n\t\t\t.reportable .table-footer .table-info,\n\t\t\t.reportable .table-footer .rows-per-page {\n\t\t\t\tfloat: right;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .table-info {\n\t\t\t\tposition: relative;\n\t\t\t\tdisplay: table;\n\t\t\t\tmargin-right: 15px;\n\t\t\t\theight: 100%;\n\t\t\t} \n\n\t\t\t.reportable .table-footer .table-info span {\n\t\t\t\tfont-size: 12px;\n\t\t\t\tdisplay: table-cell;\n\t\t\t\tvertical-align: middle;\n\t\t\t\tcolor: #757575;\n\t\t\t}\n\t\t\t\n\t\t\t.reportable .table-footer .rows-per-page {\n\t\t\t\tposition: relative;\n\t\t\t\tdisplay: table;\n\t\t\t\tmargin-right: 15px;\n\t\t\t\theight: 100%;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .rows-per-page label {\n\t\t\t\tfont-size: 12px;\n\t\t\t\tvertical-align: middle;\n\t\t\t\tdisplay: table-cell;\n\t\t\t\tcolor: #757575;\n\t\t\t\tpadding-right: 5px;\n\t\t\t}\n\t\t\t\n\t\t\t.reportable .table-footer .rows-per-page .select-wrapper {\n\t\t\t\tdisplay: table-cell;\n\t\t\t\tvertical-align: middle;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .rows-per-page .select-wrapper select {\n\t\t\t\tfont-size: 12px;\n\t\t\t\tmargin: 0 15px;\n\t\t\t\tborder: none;\n\t\t\t\toutline: none;\n\t\t\t\tcolor: #757575;\n\t\t\t}\t\t\t\t\t\n\n\t\t\t.reportable .table-footer .pagination button {\n\t\t\t\tposition: relative;\n\t\t\t\theight: 30px;\n\t\t\t\twidth: 30px;\n\t\t\t\tborder-radius: 50%;\n\t\t\t\tborder: none;\n\t\t\t\toutline: none;\n\t\t\t\tbackground: transparent;\n\t\t\t\tcursor: pointer;\n\t\t\t\ttransition: background .18s, color .18s;\n\t\t\t\tcolor: #545454;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .pagination button:first-child {\n\t\t\t\tmargin: 0 15px;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .pagination button:hover:not(:disabled) {\n\t\t\t\tbackground: rgba(75,75,75,.1);\n\t\t\t\tcolor: #212121;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .pagination button:active:not(:disabled) {\n\t\t\t\tbackground: rgba(75,75,75,.175);\n\t\t\t}\n\n\t\t\t.reportable .table-footer .pagination button:disabled {\n\t\t\t\tbackground: transparent;\n\t\t\t\tcolor: #aaa;\n\t\t\t\tcursor: default;\n\t\t\t}\n\n\t\t\t.reportable .table-footer .pagination button span {\n\t\t\t\tposition: absolute;\n\t\t\t\ttop: 50%;\n\t\t\t\tleft: 50%;\n\t\t\t\ttransform: translate(-50%, -50%);\n\t\t\t}\n\t\t\t</style>\n\t\t\t';
		document.querySelector('head').insertAdjacentHTML('beforeend', css);
	}
};

module.exports = Reportable;