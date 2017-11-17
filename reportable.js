const Reportable = class {
	constructor(data, options = {}) {
		if (data != undefined && Array.isArray(data) && data.length > 0) {
			this.container = document.querySelector(options.container);
			if (this.container) {
				this.defaultPageLength = (options.pageLength != undefined && options.pageLength.default != undefined) ? ((options.pageLength.default != 'all') ? ((isNaN(options.pageLength.default)) ? 5 : parseInt(options.pageLength.default)) : 'all') : 5;
				this.enablePagination = !!(options.pagination);
				this.enablePageInfo = !!(options.pageInfo);
				this.enablePageLength = !!(options.pageLength.enabled);
				this.enableSearch = !!(options.search);
				this.title = (options.title != undefined) ? options.title : '';
				this.searchdata = data.slice(1);
				this.tabledata = data.slice();
				this.injectCss();
				this.renderTable(data, this.container);
				this.addEventListeners();
			}
		}
	}

	sortRows(data, index = 0, order = 'asc') {
		if (data) {
			return data.sort((a, b) => {
				return (order === 'asc') ? (a[index] > b[index] ? 1 : -1) : (a[index] > b[index] ? -1 : 1);
			});
		}
		return [];
	}

	updatePaginationButtons() {
		let table = this.container.querySelector('table');
		let rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
		let leftArrow = this.container.querySelector('.table-footer .pagination button.left-arrow');
		let rightArrow = this.container.querySelector('.table-footer .pagination button.right-arrow');
		if (table && rowsperpage && leftArrow && rightArrow) {
			if (rowsperpage.value == 'all') {
				leftArrow.disabled = true;
				rightArrow.disabled = true;
			}
			else {
				let page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
				let numRowsVisible = (table.querySelectorAll('tbody tr')).length;
				leftArrow.disabled = (page == 0);
				rightArrow.disabled = (this.searchdata.length <= (parseInt(rowsperpage.value) * page) + numRowsVisible);
			}
		}
	}

	updateTableInfo() {
		let tableInfo = this.container.querySelector('.table-footer .table-info span');
		let rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
		let table = this.container.querySelector('table');
		if (tableInfo && rowsperpage && table) {
			let page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
			let numRowsVisible = (table.querySelectorAll('tbody tr')).length;
			let from = (rowsperpage.value == 'all') ? 1 : ((page * (parseInt(rowsperpage.value))) + 1);
			let to = (rowsperpage.value == 'all') ? this.searchdata.length : from + numRowsVisible - 1;
			tableInfo.innerText = `${from}-${to} of ${this.searchdata.length}`;
		}
		this.updatePaginationButtons();
	}

	updateTable(data, options = {}) {
		let viewitems = options.viewitems != undefined ? parseInt(options.viewitems) : 'all';
		let rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
		if (rowsperpage) viewitems = rowsperpage.value == 'all' ? 'all' : parseInt(rowsperpage.value);
		let startfrom = options.startfrom != undefined ? parseInt(options.startfrom) : 0;
		let table = this.container.querySelector('table');
		let tablebody = this.container.querySelector('table tbody');
		let tbody = '';
		let counter = 0;
		if (data.length > 0) {
			data.forEach((row, rowindex) => {
				if (rowindex < startfrom || ((viewitems != 'all') && (counter >= viewitems))) return;
				let tr = '';
				row.forEach((column, columnindex) => {
					tr += `
						<td>${column}</td>
					`;
				});
				tr = `
					<tr>
						${tr}
					</tr>
				`;
	
				tbody += tr;
				counter++;
			});
		}
		else {
			tbody = `
				<tr>
					<td colspan="${this.tabledata[0].length}" style="text-align: center;">
						No items
					</td>
				</tr>
			`;
		}
		
		tbody = `
			<tbody>
				${tbody}
			</tbody>
		`;
		tablebody.innerHTML = tbody;
		this.updateTableInfo();
	}

	addEventListeners() {
		// Search
		let searchinput = this.container.querySelector('.table-header .table-tools .search input[name="search"]');
		let displayMatches = () => {
			const regex = new RegExp(searchinput.value, 'gi');
			const matches = this.tabledata.slice(1).filter(arr => arr.some(item => item.toString().match(regex)));
			this.searchdata = matches;
			let table = this.container.querySelector('table');
			if (table) table.dataset.page = 0;
			this.updateTable(matches);
		};
		
		if (searchinput) {
			searchinput.addEventListener('change', displayMatches);
			searchinput.addEventListener('keyup', displayMatches);
		}

		// Sort
		let tableheaders = this.container.querySelectorAll('table th');
		if (tableheaders) {
			tableheaders.forEach(th => {
				th.addEventListener('click', () => {
					if (th.dataset.sortingColumn == 'true') {
						th.dataset.sortOrder = th.dataset.sortOrder == 'asc' ? 'desc' : 'asc';
					}
					else {
						let prevth =  this.container.querySelector('table th[data-sorting-column="true"]');
						if (prevth) prevth.dataset.sortingColumn = 'false';
						th.dataset.sortingColumn = 'true';
						th.dataset.sortOrder = 'asc';
					}

					let sortingColumn =  this.container.querySelector('table th[data-sorting-column="true"]');
					if (sortingColumn) {
						let sortIndex = sortingColumn.dataset.sortIndex;
						let sortOrder = sortingColumn.dataset.sortOrder;
						this.searchdata = this.sortRows(this.searchdata, sortIndex, sortOrder);
						let table = this.container.querySelector('table');
						if (table) table.dataset.page = 0;
						this.updateTable(this.searchdata);
					}
				});
			});
		}

		// Page length
		let rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
		if (rowsperpage) {
			rowsperpage.addEventListener('change', () => {
				let sortingColumn =  this.container.querySelector('table th[data-sorting-column="true"]');
				let table = this.container.querySelector('table');
				if (table) table.dataset.page = 0;
				if (sortingColumn) {
					let sortIndex = sortingColumn.dataset.sortIndex;
					let sortOrder = sortingColumn.dataset.sortOrder;
					this.searchdata = this.sortRows(this.searchdata, sortIndex, sortOrder);
					this.updateTable(this.searchdata);
				}	
				else {
					this.updateTable(this.searchdata);
				}
			});
		}		

		// Pagination buttons
		let leftArrow = this.container.querySelector('.table-footer .pagination button.left-arrow');
		let rightArrow = this.container.querySelector('.table-footer .pagination button.right-arrow');
		let table = this.container.querySelector('table');
		if (table && leftArrow && rightArrow) {
			leftArrow.addEventListener('click', () => {
				let page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
				page--;
				table.dataset.page = page;
				let sortingColumn =  this.container.querySelector('table th[data-sorting-column="true"]');
				if (sortingColumn) {
					let sortIndex = sortingColumn.dataset.sortIndex;
					let sortOrder = sortingColumn.dataset.sortOrder;
					this.searchdata = this.sortRows(this.searchdata, sortIndex, sortOrder);
				}	
				let rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
				let startfrom = (rowsperpage.value != 'all') ? parseInt(rowsperpage.value * page) : 0;
				this.updateTable(this.searchdata, {startfrom});
			});

			rightArrow.addEventListener('click', () => {
				let page = table.dataset.page != undefined ? parseInt(table.dataset.page) : 0;
				page++;
				table.dataset.page = page;
				let sortingColumn =  this.container.querySelector('table th[data-sorting-column="true"]');
				if (sortingColumn) {
					let sortIndex = sortingColumn.dataset.sortIndex;
					let sortOrder = sortingColumn.dataset.sortOrder;
					this.searchdata = this.sortRows(this.searchdata, sortIndex, sortOrder);
				}
				let rowsperpage = this.container.querySelector('.table-footer .rows-per-page select');
				let startfrom = (rowsperpage.value != 'all') ? parseInt(rowsperpage.value * page) : 0;
				this.updateTable(this.searchdata, {startfrom});
			});
		}
	}

	renderTable(data, container) {
		container.classList.add('reportable');
		let table;
		let thead = '';
		let tbody = '';
		let searchHtml = `
			<div class="search">
				<input type="text" name="search" placeholder="Search" autocomplete="off">
			</div>
		`;

		let tableheader = `
			<div class="table-header">
				<div class="title-wrapper">
					<h2 class="title">${this.title}</h2>
				</div>
				<div class="table-tools">
					${this.enableSearch ? searchHtml : ''}
				</div>
			</div>
		`;

		let rowsperpageHtml = `
			<div class="rows-per-page">
				<label>Rows per page:</label>
				<div class="select-wrapper">
					<select>
						<option value="5" ${this.defaultPageLength == 5 ? 'selected' : ''}>5</option>
						<option value="10" ${this.defaultPageLength == 10 ? 'selected' : ''}>10</option>
						<option value="25" ${this.defaultPageLength == 25 ? 'selected' : ''}>25</option>
						<option value="50" ${this.defaultPageLength == 50 ? 'selected' : ''}>50</option>
						<option value="100" ${this.defaultPageLength == 100 ? 'selected' : ''}>100</option>
						<option value="all" ${this.defaultPageLength == 'all' ? 'selected' : ''}>All</option>
					</select>
				</div>
			</div>
		`;
		
		let paginationHtml = `
			<div class="pagination">
				<button class="left-arrow"><span class="material-icons">keyboard_arrow_left</span></button>
				<button class="right-arrow"><span class="material-icons">keyboard_arrow_right</span></button>
			</div>
		`;

		let tablefooter = `
			<div class="table-footer">
				${this.enablePageLength && this.enablePagination ? paginationHtml : ''}	
				<div class="table-info">
					<span>1-10 of 100</span>
				</div>
				${this.enablePageLength && this.enablePagination ? rowsperpageHtml : ''}	
			</div>
		`;

		let headers = data[0];
		headers.forEach((header, index) => {
			thead += `<th data-sorting-column="false" data-sort-order="asc" data-sort-index="${index}">
				${header}<span class="material-icons">arrow_downward</span>
			</th>`;
		});

		thead = `
			<thead>
				<tr>
					${thead}
				</tr>
			</thead>
		`;

		let tablebodydata = data.slice(1);
		let viewitems = this.defaultPageLength;
		let counter = 0;
		tablebodydata.forEach((row, rowindex) => {
			if ((viewitems != 'all') && (counter >= viewitems)) return;
			let tr = '';
			row.forEach((column, columnindex) => {
				tr += `
					<td>${column}</td>
				`;
			});
			tr = `
				<tr>
					${tr}
				</tr>
			`;

			tbody += tr;
			counter++;
		});

		tbody = `
			<tbody>
				${tbody}
			</tbody>
		`;

		table = `
			${tableheader}
			<table>
			${thead}
			${tbody}
			<table>
			${tablefooter}
		`;

		container.innerHTML = table;
		this.updateTableInfo();
	}

	injectCss() {
		if (!(document.querySelector('head style.reportable-styles'))) {
			let css = `
			<style class="reportable-styles">
				* {
					box-sizing: border-box;
				}

				.reportable {
					font-family: roboto;
					-webkit-font-smoothing: antialiased;
					text-shadow: rgba(0,0,0,.01) 0 0 1px;
				}

				.reportable .table-header {
					position: relative;
					height: 68px;
					width: 100%;
					padding: 24px;
				}

				.reportable .title-wrapper {
					position: absolute;
					top: 50%;
					left: 24px;
					transform: translateY(-50%);
					width: 50%;
				}

				.reportable .title-wrapper .title {
					font-size: 20px;
					text-transform: capitalize;
					font-weight: 400;
					color: #212121;
					text-overflow: ellipsis;
				}

				.reportable .table-header .table-tools {
					position: absolute;
					right: 24px;
					top: 50%;
					transform: translateY(-50%);
					width: 50%;
					max-width: 240px;
				}

				.reportable .table-header .search {
					position: relative;
					max-width: 100%;
					width: 240px;
				}

				.reportable .table-header .search input {
					width: 100%;
          outline: none;
          padding: 4px 2px;
          border: none;
          border-bottom: 1px solid #e0e0e0;
				}

				.reportable .table-header .search input:focus {
          border-bottom: 2px solid #2196F3;
				}

				.reportable table {
					width: 100%;
					min-width: 100%;
					border-collapse: collapse;
					margin-bottom: 1px;
				}

				.reportable table thead tr {
					height: 56px;
				}

				.reportable table thead tr th {
					position: relative;
					border-bottom: 1px solid #e0e0e0;
					text-align: left;
					width: auto;
					font-size: 12px;
					color: #757575;
					font-weight: 500;
					text-transform: capitalize;
					cursor: pointer;
					padding-right: 24px;
				}

				.reportable table thead tr th:first-child,
				.reportable table thead tr th:last-child {
					padding-left: 24px;
				}
				
				.reportable table thead tr th span.material-icons {
					font-size: 16px;
					position: absolute;
					right: 24px;
					top: 50%;
					transform: translateY(-50%);
				}

				.reportable table thead tr th.align-right {
					text-align: right;
				}

				.reportable table thead tr th[data-sort-order="asc"] span.material-icons {
					transform: translateY(-50%) rotate(0deg);
				}

				.reportable table thead tr th[data-sort-order="desc"] span.material-icons {
					transform: translateY(-50%) rotate(180deg);
				}

				.reportable table thead tr th[data-sorting-column="true"] span.material-icons {
					opacity: 1;
				}

				.reportable table thead tr th[data-sorting-column="false"] span.material-icons {
					opacity: .3;
				}

				.reportable table tbody tr {
					height: 48px;
				}

				.reportable table tbody tr td {
					border-bottom: 1px solid #e0e0e0;
					text-align: left;
					font-size: 13px;
					color: #212121;
					font-weight: 400;
					padding-right: 24px;
				}

				.reportable table tbody tr td:first-child,
				.reportable table tbody tr td:last-child {
					padding-left: 24px;
				}

				.reportable table tbody tr td.align-right {
					text-align: right;
				}

				.reportable .table-footer {
					height: 56px;
					padding: 12px;
				}

				.reportable .table-footer .pagination,
				.reportable .table-footer .table-info,
				.reportable .table-footer .rows-per-page {
					float: right;
				}

				.reportable .table-footer .table-info {
					position: relative;
					display: table;
					margin-right: 15px;
					height: 100%;
				} 

				.reportable .table-footer .table-info span {
          font-size: 12px;
          display: table-cell;
          vertical-align: middle;
          color: #757575;
				}
				
				.reportable .table-footer .rows-per-page {
					position: relative;
					display: table;
					margin-right: 15px;
					height: 100%;
				}

				.reportable .table-footer .rows-per-page label {
          font-size: 12px;
          vertical-align: middle;
          display: table-cell;
          color: #757575;
          padding-right: 5px;
				}
				
				.reportable .table-footer .rows-per-page .select-wrapper {
          display: table-cell;
					vertical-align: middle;
				}

				.reportable .table-footer .rows-per-page .select-wrapper select {
					font-size: 12px;
					margin: 0 15px;
					border: none;
					outline: none;
					color: #757575;
				}					

				.reportable .table-footer .pagination button {
					position: relative;
					height: 30px;
					width: 30px;
					border-radius: 50%;
					border: none;
					outline: none;
					background: transparent;
					cursor: pointer;
					transition: background .18s, color .18s;
					color: #545454;
				}

				.reportable .table-footer .pagination button:first-child {
					margin: 0 15px;
				}

				.reportable .table-footer .pagination button:hover:not(:disabled) {
					background: rgba(75,75,75,.1);
					color: #212121;
				}

				.reportable .table-footer .pagination button:active:not(:disabled) {
					background: rgba(75,75,75,.175);
				}

				.reportable .table-footer .pagination button:disabled {
					background: transparent;
					color: #aaa;
					cursor: default;
				}

				.reportable .table-footer .pagination button span {
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
				}
				</style>
				`;
			document.querySelector('head').insertAdjacentHTML('beforeend', css);
		}
	}
};