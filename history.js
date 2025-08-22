api.controller = function($scope, $timeout, spUtil) {
	spUtil.get("boomi_exosphere_resource_loader", { loadTableStyles: true, bodyFontSizeLess: false }).then(function(response) {
            $scope.boomiExosphereResourceLoader = response;
   	 });
    let gridApi;

    $scope.noResults = false;
    $scope.noActivity = false;
    $scope.selectedPage = 1;
    $scope.pageSize = 10;
    $scope.pagination = true;
    $scope.originalRecords = [];
    $scope.paginatedRecords = [];
    $scope.filteredRecords = $scope.originalRecords;
    $scope.treeData = [];
    $scope.selectMenuData = [];
    $scope.modelName = getQueryParam("modelName");
    $scope.recordTitle = getQueryParam("recTitle");
    $scope.recordId = getQueryParam("recordId");
    $scope.transactionId = "";
    $scope.repositoryName = sessionStorage.getItem("repositoryName") || "Default Repository";
    $scope.showJwtErrorMessage = false;
    $scope.boomiAccountId = $scope.data.boomiAccountId;
    $scope.user = $scope.user || {
        email: '',
        accountId: '',
        apiToken: ''
    };
    $scope.message = "";
	$scope.errorRestricted = false;
    $scope.selectedIndex = 0;
    $scope.showElements = $scope.selectedIndex === 0 || $scope.selectedIndex === 2;
    $scope.recordsLoader = false;
    $scope.FormMetaData = [];
    $scope.selectedRecordDetails = "";
    $scope.recordsData = [];

    $scope.switchTab = function(index) {
        $scope.selectedIndex = index;

        if (index === 0) {
            gridApi.setGridOption("loading", true);
            $scope.originalRecords = [];
            $timeout(() => {
                fetchChangesData();
            }, 0);
        } else if (index === 1) {
            $scope.recordsLoader = true;
            fetchNewRecords();
        } else if (index === 2) {
            gridApi.setGridOption("loading", true);
            $timeout(() => {
                fetchActivityData();
            }, 0);
        }
    };

    $scope.createLink = function(type) {
        const hostname = window.location.hostname;
        const path = "command_center";
        const id = type;
        const recordId = $scope.recordId;
        const repositoryId = getQueryParam("repositoryId");
        const universeId = getQueryParam("universeId");
        const modelName = getQueryParam("modelName");
        const recordTitle = $scope.recordTitle;
        const url = "https://" + hostname + "/" + path + "?id=" + id + "&recordId=" + recordId + "&repositoryId=" + repositoryId + "&universeId=" + universeId + "&modelName=" + modelName + "&recTitle=" + recordTitle;
        url.target = "_self";
        return url;
    };

    $scope.createGR360Link = function() {
        return $scope.createLink("golden_record_360_view");
    };

    $scope.createSourceLink = function() {
        return $scope.createLink("sources");
    };

    $scope.createHistoryLink = function() {
        return $scope.createLink("history");
    };

    $scope.refreshData = async function() {
        gridApi.setGridOption("loading", true);
        $scope.recordsLoader = true;
        $scope.$applyAsync(() => {
            $scope.selectedIndex = 0;
        });

        await fetchChangesData();
        $scope.recordsLoader = false;
        return;

    };

    $scope.lastUpdatedTime = formatDate(new Date());

    this.$onInit = function() {
        initializeGridOptions();

        if ($scope.selectedIndex === 0) {
            fetchChangesData();
        }

    };

    function formatDate(date) {
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).format(date).replace(/,/g, '');
    }

    function formatDateWithMs(dateString) {

        if (dateString === "\u2013") return dateString;

        var adjustedDateString = dateString.replace(/^(\d{2})-(\d{2})-(\d{4})/, '$3-$1-$2');

        // Parse the date string
        var adjustedDate = new Date(adjustedDateString);

        // Format the output to remove milliseconds
        var formattedDate = adjustedDate.toISOString().replace(/\.\d{3}Z$/, 'Z');

        // Create a Date object
        var date = (new Date(formattedDate)).toISOString().replace(/\.\d{3}Z$/, 'Z');

        return formatDateActivity(date);

    }

    function formatDateActivity(inputDate) {

        if (inputDate === "\u2013") return inputDate;
        var date = new Date(inputDate);

        var options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        };
        var formattedDate = date.toLocaleDateString('en-GB', options);

        var hours = date.getUTCHours() + 5;
        var minutes = date.getUTCMinutes() + 30;
        var seconds = date.getUTCSeconds();

        if (minutes >= 60) {
            minutes -= 60;
            hours += 1;
        }
        if (hours >= 24) {
            hours -= 24;
        }

        return formattedDate + ' ' + hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');

    }

    function initializeGridOptions() {
        angular.element("ex-table")[0].gridOptions = {
            rowHeight: 48,
			//enableBrowserTooltips: true,
            defaultColDef: {
                sortable: true,
                resizable: true,
                filter: true,
                flex: 1,
                minWidth: 150,
                cellStyle: {
                    fontSize: '14px'
                },
			//tooltipComponent: 'agTooltipComponent',
                filterParams: {
                    closeOnApply: true,
                    buttons: ["reset", "apply"],
                },
							
							//HUB-6356
							//  cellRenderer: (params) => {
							// 		const value = params.value.toString();
							// 		return value.length > 20 ? value.substring(0, 20) + "..." : value;
							// 	},
							// 	tooltipValueGetter: (params) => {
							// 		const value = params.value.toString();
							// 		return value.length > 20 ? value : null;
							// 	},
		
        headerComponentParams: {
                    template: `
                           			<div class="ag-cell-label-container" role="presentation" style="height: 37px;">
												<span data-ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>
												 <span data-ref="eFilterButton" class="filter-button filter-icon-container" aria-hidden="false" style="position: relative;display: inline-flex;">
														<!-- Dot icon -->
														<span class="filter-dot" data-ref="filterDot" style="display: none;">
																<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" fill="none"
																		style="position: absolute;  right: -2px;">
																		<circle cx="4.00017" cy="4" r="3.5" fill="#FF7C66" stroke="white"/>
																</svg>
														</span>
												</span>
												</span>
												<div data-ref="eLabel" class="ag-header-cell-label" role="presentation">
														<span data-ref="eText" class="ag-header-cell-text" role="columnheader" style="font-size: 14px; line-height: 40px;"></span>
														<span data-ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>
														<span data-ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>
														<span data-ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>
														<span data-ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>
														<span data-ref="eFilter" class="ag-header-icon ag-filter-icon"></span>
												</div>
										</div>`
                }
							
            },
						tooltipShowDelay: 0,      
						tooltipHideDelay: 2000,
            columnDefs: [
							
							// {
							// 	field: "previous_value",
							//    cellRenderer: (params) => {
							//    const value = params.value.toString();
							//    return value.length > 20 ? value.substring(0, 20) + "..." : value;
							// 	},
							//  	tooltipValueGetter: (params) => {
							//  		const value = params.value.toString();
							//  		return value.length > 20 ? value : null;
							//  	},
		
							// },
							// {
							// 	field: "current_value",
							// 	cellRenderer: (params) => {
							//      const value = params.value.toString();
							//   		return value.length > 20 ? value.substring(0, 20) + "..." : value;
							// 	},
							//  	tooltipValueGetter: (params) => {
							//  		const value = params.value.toString();
							//  		return value.length > 20 ? value : null;
							//  	},
							// }
  
							
						],
		
            rowData: null,
            domLayout: "autoHeight",
            suppressDragLeaveHidesColumns: true,
            suppressMenuHide: true,
            suppressPopups: false,
            suppressPaginationPanel: true,
            suppressNoRowsOverlay: true,
            pagination: true,
            paginationPageSize: $scope.pageSize,
            onGridReady: handleGridReady,
            onFilterChanged: function(event) {
                updateFilterDot(event.api);

                const filterModel = event.api.getFilterModel();
                const colIds = Object.keys(filterModel);

                if (colIds.length === 0) {
                    $scope.filteredRecords = $scope.originalRecords;
                    updatePagination($scope.originalRecords);

                    $scope.noResults = $scope.originalRecords.length === 0;
                    updateHorizontalScrollVisibility($scope.noResults);
                    $scope.$applyAsync();

                    return;
                }



                const promises = colIds.map(colId =>
                    event.api.getColumnFilterInstance(colId).then(instance => ({
                        colId,
                        instance
                    }))
                );

                Promise.all(promises).then(filterInstances => {
                    const filteredData = $scope.originalRecords.filter(row => {
                        for (const {
                                colId,
                                instance
                            }
                            of filterInstances) {

                            if (instance && !instance.doesFilterPass({
                                    data: row
                                })) {
                                return false;
                            }
                        }
                        return true;
                    });

                    $scope.filteredRecords = filteredData;
                    updatePagination(filteredData);

                    $scope.noResults = filteredData.length === 0;
                    updateHorizontalScrollVisibility($scope.noResults);
                    $scope.$applyAsync();
                });
            }
        };
    }

    function updatePagination(filteredData) {
        const pagination = document.querySelector("ex-pagination");
        if (pagination) {
            pagination.selectedPage = 1;
            pagination.totalItems = filteredData.length;
        }

        applyPaginatedData(filteredData, 1);
    }

    function applyPaginatedData(sourceData, selectedPage) {
        const startIdx = (selectedPage - 1) * $scope.pageSize;
        const endIdx = startIdx + $scope.pageSize;

        const pagedData = sourceData.slice(startIdx, endIdx);

        $scope.$applyAsync(() => {
            $scope.paginatedRecords = [...pagedData];

            gridApi.setGridOption("rowData", []);
            gridApi.applyTransaction({
                add: pagedData,
                remove: gridApi.getDisplayedRowCount() ? gridApi.getDisplayedRowData() : []
            });
            gridApi.refreshCells();
        });
    }

    function updateHorizontalScrollVisibility(noResults) {
        const exTableElement = document.querySelector("ex-table");
        const shadowRoot = exTableElement?.shadowRoot;

        if (!shadowRoot) return;

        const scrollBar = shadowRoot.querySelector(".ag-body-horizontal-scroll");
        if (scrollBar) {
            scrollBar.style.display = noResults ? "none" : "";
        }

        const stickyBottom = shadowRoot.querySelector(".ag-sticky-bottom");
        if (stickyBottom) {
            stickyBottom.style.display = noResults ? "none" : "";
        }
    }

    $scope.removeFilters = function() {
        $scope.isRemovingFilters = true;
        document.activeElement.blur();
        $scope.noResults = false;

        if (gridApi) {
            gridApi.setFilterModel(null);
            $scope.isRemovingFilters = false;
            $scope.noResults = false;
        }
    };

    function fetchChanges() {
        return new Promise((resolve, reject) => {
            var ga = new GlideAjax("x_boomi_cmd_center.GetGoldenRecordHistoryNew");
            ga.addParam("sysparm_name", "getData");
            ga.addParam("sysparm_universeId", getQueryParam("universeId"));
            ga.addParam("sysparm_repositoryId", getQueryParam("repositoryId"));
            ga.addParam("sysparm_recordId", getQueryParam("recordId"));


            ga.getXMLAnswer((response) => {
                if (response) {
                    try {

                        const parsedResponse = JSON.parse(response);

                        if (parsedResponse.showjwterrormessage) {
                            console.warn("Invalid Jwt Token or Missing Api Token");

                            $scope.$applyAsync(() => {
                                getBoomiAccountId();

                                $scope.showJwtErrorMessage = true;
                            });
                            return;
                        }
                        if (parsedResponse.statusCode === 401) {
                            $scope.errorRestricted = true;
							return;
                        }						
                        let recordsData = parsedResponse.responseBody || [];

                        if (!Array.isArray(recordsData)) {
                            recordsData = [recordsData];
                        }
                        resolve(recordsData);
                    } catch (error) {
                        reject(`Error parsing response: ${error.message}`);
                    }
                } else {
                    reject("No response received from the server.");
                }
            });
        });
    }

    function fetchActivity() {
        return new Promise((resolve, reject) => {
            var ga = new GlideAjax("x_boomi_cmd_center.GetTransactions");
            ga.addParam("sysparm_name", "getData");
            ga.addParam("sysparm_universeId", getQueryParam("universeId"));
            ga.addParam("sysparm_repositoryId", getQueryParam("repositoryId"));
            ga.addParam("sysparm_recordId", getQueryParam("recordId"));
            ga.addParam("sysparm_transactionId", $scope.transactionId);


            ga.getXMLAnswer((response) => {
                if (response) {
                    try {
                        const parsedResponse = JSON.parse(response);

                        if (parsedResponse.showjwterrormessage) {
                            console.warn("Invalid Jwt Token or Missing Api Token");

                            $scope.$applyAsync(() => {
                                getBoomiAccountId();

                                $scope.showJwtErrorMessage = true;
                            });
                            return;
                        }
                        if (parsedResponse.statusCode === 401) {
                            $scope.errorRestricted = true;
							return;
                        }						
                        let recordsData = parsedResponse.responseBody || [];
                        if (!Array.isArray(recordsData)) {
                            recordsData = [recordsData]; // Ensure it's an array
                        }
                        resolve(recordsData);
                    } catch (error) {
                        reject(`Error parsing response: ${error.message}`);
                    }
                } else {
                    reject("No response received from the server.");
                }
            });
        });
    }

    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function fetchColumnDefsList(tabIndex) {
        if (tabIndex === 0) return getColumnDefinitionsForChanges();
        if (tabIndex === 2) return getColumnDefinitionsForActivity();
    }
	

	//HUB-6356
function createValueCell(params, element) {
    const value = params.value || "";
    if (value.length <= 20) {
        return element;
    }

    const truncatedValue = value.substring(0, 20) + "...";
    element.textContent = truncatedValue;

    const tooltip = document.createElement("ex-tooltip");
    tooltip.setAttribute("tooltipdelay", "0");
    tooltip.setAttribute("position", "bottom");
    // This is the line that has been changed
    tooltip.setAttribute("alignment", "start"); 

    // Add a custom class for easier styling!
    tooltip.classList.add("custom-table-tooltip"); 

    const tooltipContent = document.createElement("div");
    tooltipContent.textContent = value;
    element.setAttribute("slot", "anchor");

    tooltip.appendChild(tooltipContent);
    tooltip.appendChild(element);

    return tooltip;
}


// Enhanced column definitions with proper tooltip implementation
function getColumnDefinitionsForChanges() {
    return [
        {
            field: "field_name",
            headerName: "Field",
            filter: customTextFilter,
            unSortIcon: true,
            filterParams: {
                closeOnApply: true,
                buttons: ["reset", "apply"]
            }
        },
        {
            field: "current_value",
            headerName: "Current Value",
            filter: false,
            unSortIcon: false,
            cellRenderer: (params) => {
                if (params.data.is_ref_field && params.data.current_value !== "\u2013") {
                    const hostname = window.location.hostname;
                    const path = "command_center";
                    const id = "golden_record_360_view";
                    const recordId = params.data.current_value_recordId || params.data.current_value;
                    const repositoryId = getQueryParam("repositoryId");
                    const universeId = params.data.referenceUniverseId;
                    const modelName = params.data.referenceUniverseName;
                    const recordTitle = params.data.current_value;
                    const link = document.createElement("a");
                    const iconElement = createBoxWithArrowIcon();

                    link.href = "https://" + hostname + "/" + path + "?id=" + id + "&recordId=" + recordId + "&repositoryId=" + repositoryId +
                        "&universeId=" + universeId + "&modelName=" + modelName + "&recTitle=" + recordTitle;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.style.color = "var(--exo-color-font-link)";
                    link.textContent = params.value;
                    link.style.display = "inline-flex";
                    link.style.alignItems = "center";
                    link.prepend(iconElement);

                    return createValueCell(params, link);
                }
                else {
                    const span = document.createElement("span");
                    span.textContent = params.value || "";
                    span.style.cursor = "default";
                    return createValueCell(params, span);
                }
            }
        },
        {
            field: "previous_value",
            headerName: "Previous Value",
            filter: false,
            unSortIcon: false,
            cellRenderer: (params) => {
                if (params.data.is_ref_field && params.data.previous_value !== "\u2013") {
                    const hostname = window.location.hostname;
                    const path = "command_center";
                    const id = "golden_record_360_view";
                    const recordId = params.data.previous_value_recordId || params.data.previous_value;
                    const repositoryId = getQueryParam("repositoryId");
                    const universeId = params.data.referenceUniverseId;
                    const modelName = params.data.referenceUniverseName;
                    const recordTitle = params.data.previous_value;
                    const link = document.createElement("a");
                    const iconElement = createBoxWithArrowIcon();

                    link.href = "https://" + hostname + "/" + path + "?id=" + id + "&recordId=" + recordId + "&repositoryId=" + repositoryId +
                        "&universeId=" + universeId + "&modelName=" + modelName + "&recTitle=" + recordTitle;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.style.color = "var(--exo-color-font-link)";
                    link.textContent = params.value;
                    link.style.display = "inline-flex";
                    link.style.alignItems = "center";
                    link.prepend(iconElement);

                    return createValueCell(params, link);
                }
                else {
                    const span = document.createElement("span");
                    span.textContent = params.value || "";
                    span.style.cursor = "default";
                    return createValueCell(params, span);
                }
            }
        },
        {
            field: "updated_timestamp",
            headerName: "Last Updated Date",
            filter: customDateFilter,
            unSortIcon: true,
            filterParams: {
                closeOnApply: true,
                buttons: ["reset", "apply"],
            },
            cellRenderer: (params) => {
                if (!params.value) {
                    const icon = document.createElement("ex-icon");
                    icon.icon = "In progress";
                    icon.size = "M";
                    icon.style.position = "relative";
                    icon.style.color = "var(--exo-color-font-link)";
                    icon.style.top = "13px";
                    return icon;
                }
                return formatDateWithMs(params.value);
            }
        },
        {
            field: "updated_by_source",
            headerName: "Last Updated Source",
            filter: false,
            unSortIcon: true,
            filterParams: {
                closeOnApply: true,
                buttons: ["reset", "apply"]
            }
        },
        {
            field: "no_of_changes",
            headerName: "Change History",
            filter: false,
            unSortIcon: true,
            cellRenderer: createLinkRenderer
        }
    ];
}

	
	
	



    function customDateFilter() {
        return {
            init(params) {
                this.params = params;
                this.selectedOperator = "Equals";
                this.filterValue = null;
                this.filterValueTo = null;
                this.setupGui();
            },

            setupGui() {
                let gui = document.createElement("div");
                gui.innerHTML = `
                <div class="text-filter" style="width: 200px; display: flex; flex-direction: column; align-items: flex-start;
                padding: 16px; box-sizing: border-box; border-radius: 4px; border: 1px solid var(--exo-color-border-secondary);
                background: var(--exo-color-background); box-shadow: 0px 12px 32px 0px rgba(0, 0, 0, 0.10);">
                    
                    <div class="select-menu" style="width: 168px;">
                        <ex-select id="selectFilter" selected="Equals" select-id="select" placeholder="" hideClearIcon="true">
                            <ex-menu-item value="Equals">Equals</ex-menu-item>
                            <ex-menu-item value="Does not equal">Does not equal</ex-menu-item>
                            <ex-menu-item value="Before">Before</ex-menu-item>
                            <ex-menu-item value="After">After</ex-menu-item>
                            <ex-menu-item value="Between">Between</ex-menu-item>
                            <ex-menu-item value="Has value">Has value</ex-menu-item>
                            <ex-menu-item value="Empty">Empty</ex-menu-item>
                        </ex-select>
                    </div>

                    <div id="singleDateContainer" class="inputfield" style="width: 168px; padding-top: 8px;">
                        <ex-input id="filterInput" placeholder="YYYY-MM-DD" type="date"></ex-input>
                    </div>

                    <div id="betweenDateContainer" class="inputfield" style="width: 168px; padding-top: 8px; display: none;">
                        <ex-input id="filterInputTo" placeholder="YYYY-MM-DD" type="date"></ex-input>
                    </div>

                    <div class="filter-buttons" style="display: flex; justify-content: flex-end; align-items: center;
                        gap: 8px; min-height: 32px; align-self: stretch;padding-top: 8px">
                        <ex-button id="resetFilter" flavor="branded" type="tertiary" size="default" buttontype="button">Reset</ex-button>
                        <ex-button id="applyFilter" flavor="base" type="secondary" size="default" buttontype="submit">Apply</ex-button>
                    </div>
                </div>`;

                this.gui = gui;
                this.selectFilter = gui.querySelector("#selectFilter");
                this.filterInput = gui.querySelector("#filterInput");
                this.filterInputTo = gui.querySelector("#filterInputTo");
                this.resetButton = gui.querySelector("#resetFilter");
                this.applyButton = gui.querySelector("#applyFilter");
                this.betweenDateContainer = gui.querySelector("#betweenDateContainer");
                this.singleDateContainer = gui.querySelector("#singleDateContainer");


                this.selectFilter.addEventListener("change", (event) => {
                    this.selectedOperator = event.detail.value;
                    this.toggleBetweenInput();
                });

                this.filterInput.addEventListener("onChange", (event) => {
                    this.filterValue = event.target.value;
                });

                this.filterInputTo.addEventListener("onChange", (event) => {
                    this.filterValueTo = event.target.value;
                });

                this.applyButton.addEventListener("click", () => {

                    this.params.api.onFilterChanged();
                    this.params.api.hidePopupMenu();
                });

                this.resetButton.addEventListener("click", () => {
                    this.filterValue = null;
                    this.filterValueTo = null;
                    this.filterInput.value = "";
                    this.filterInputTo.value = "";
                    this.selectedOperator = "Equals";
                    if (this.gui && this.gui.parentNode) {
                        this.gui.parentNode.removeChild(this.gui);
                    }

                    this.setupGui();

                    //this.params.api.setFilterModel(null);
                    let filterModel = this.params.api.getFilterModel();
                    delete filterModel[this.params.colDef.field];
                    this.params.api.setFilterModel(filterModel);
                    this.params.api.onFilterChanged();
                    this.params.api.hidePopupMenu();
                });
            },

            toggleBetweenInput() {
                if (this.selectedOperator === "Empty" || this.selectedOperator === "Has value") {
                    this.singleDateContainer.style.display = "none";
                    this.betweenDateContainer.style.display = "none";
                    this.filterInput.value = "";
                    this.filterInputTo.value = "";
                    this.filterValue = null;
                    this.filterValueTo = null;
                } else if (this.selectedOperator === "Between") {
                    this.singleDateContainer.style.display = "block";
                    this.betweenDateContainer.style.display = "block";
                } else {
                    this.singleDateContainer.style.display = "block";
                    this.betweenDateContainer.style.display = "none";
                }
            },

            doesFilterPass(params) {
                let cellValue = params.data[this.params.colDef.field];

                let hasValidCellValue = cellValue !== null && cellValue !== undefined &&
                    typeof cellValue === "string" && cellValue !== "" && cellValue !== "\u2013";

                if (this.selectedOperator === "Has value") {
                    return hasValidCellValue;
                }

                if (this.selectedOperator === "Empty") {
                    return !hasValidCellValue;
                }
                if (!hasValidCellValue) return false;
                let userPrefersMonthFirst = getUserLocalePreference(); // Detect locale preference


                let cellDate = this.parseDate(cellValue, userPrefersMonthFirst);
                let filterDate = this.parseDate(this.filterValue, userPrefersMonthFirst);
                let filterDateTo = this.parseDate(this.filterValueTo, userPrefersMonthFirst);

                if (!cellDate || (this.selectedOperator !== "Between" && !filterDate)) return false;

                let cellDateStr = cellDate.toISOString().split("T")[0];
                let filterDateStr = filterDate ? filterDate.toISOString().split("T")[0] : null;
                let filterDateToStr = filterDateTo ? filterDateTo.toISOString().split("T")[0] : null;


                switch (this.selectedOperator) {
                    case "Equals":
                        return filterDateStr && cellDateStr === filterDateStr;
                    case "Does not equal":
                        return filterDateStr && cellDateStr !== filterDateStr;
                    case "Before":
                        return filterDateStr && cellDate < filterDate;
                    case "After":
                        return filterDateStr && cellDate > filterDate;
                    case "Between":
                        return filterDateStr && filterDateToStr && cellDate >= filterDate && cellDate <= filterDateTo;
                    default:
                        return true;
                }
            },

            parseDate(dateString, prefersMonthFirst) {
                if (!dateString) return null;

                if (dateString.includes("T")) {
                    dateString = dateString.split("T")[0];
                }

                let dateParts, year, month, day;

                if (dateString.includes("-")) {
                    dateParts = dateString.split("-");
                } else if (dateString.includes("/")) {
                    dateParts = dateString.split("/");
                } else {
                    return null;
                }

                if (dateParts.length !== 3) return null;

                let [part1, part2, part3] = dateParts.map(Number);

                // Determine format based on the user's preference
                if (part1 > 31) {
                    // YYYY-MM-DD
                    year = part1;
                    month = part2 - 1;
                    day = part3;
                } else if (prefersMonthFirst) {
                    // MM/DD/YYYY or MM-DD-YYYY
                    month = part1 - 1;
                    day = part2;
                    year = part3;
                } else {
                    // DD/MM/YYYY or DD-MM-YYYY
                    day = part1;
                    month = part2 - 1;
                    year = part3;
                }

                let validDate = new Date(year, month, day);
                return isNaN(validDate.getTime()) ? null : validDate;
            },

            getGui() {
                return this.gui;
            },

            isFilterActive() {
                return this.selectedOperator === "Has value" || this.selectedOperator === "Empty" || !!this.filterValue;
            },

            getModel() {
                if (!this.isFilterActive()) return null;

                let model = {
                    type: this.selectedOperator
                };

                if (this.selectedOperator === "Between") {
                    model.filter = this.filterValue;
                    model.filterTo = this.filterValueTo;
                } else if (this.selectedOperator !== "Empty" && this.selectedOperator !== "Has value") {
                    model.filter = this.filterValue;
                }

                return model;
            },

            setModel(model) {
                if (!model) {
                    this.filterValue = null;
                    this.filterValueTo = null;
                    this.filterInput.value = "";
                    this.filterInputTo.value = "";
                    this.selectedOperator = "Equals";
                } else {
                    this.selectedOperator = model.type;
                    this.filterValue = model.filter || null;
                    this.filterValueTo = model.filterTo || null;
                    this.filterInput.value = this.filterValue || "";
                    this.filterInputTo.value = this.filterValueTo || "";
                }

                this.toggleBetweenInput();
            }

        };
    }

    function getUserLocalePreference() {
        let locale = navigator.language || "en-US";
				return locale;
    }

    function customTextFilter() {
        return {
            init(params) {
                this.params = params;
                this.filterText = null;
                this.selectedCondition = "Contains";
                this.setupGui();
            },

            setupGui() {
                this.gui = document.createElement("div");
                this.gui.innerHTML = `
                <div class="text-filter" style="width: 200px; display: flex; flex-direction: column; align-items: flex-start;
                padding: 16px; box-sizing: border-box; border-radius: 4px; border: 1px solid var(--exo-color-border-secondary);
                background: var(--exo-color-background); box-shadow: 0px 12px 32px 0px rgba(0, 0, 0, 0.10);">
                
                    <div class="select-menu" style="display: flex;width: 168px;flex-direction: column;align-items: flex-start;gap: 4px;">
                      <div>
														<ex-select id="selectFilter" selected="Contains" select-id="select" placeholder="Contains" hideClearIcon="true">
																<ex-menu-item value="Contains">Contains</ex-menu-item>
																<ex-menu-item value="Does not contain">Does not contain</ex-menu-item>
																<ex-menu-item value="Equals">Equals</ex-menu-item>
																<ex-menu-item value="Does not equal">Does not equal</ex-menu-item>
																<ex-menu-item value="Begins with">Begins with</ex-menu-item>
																<ex-menu-item value="Ends with">Ends with</ex-menu-item>
																<ex-menu-item value="Empty">Empty</ex-menu-item>
																<ex-menu-item value="Has Value">Has Value</ex-menu-item>
														</ex-select>
												</div>

                        <div class="inputfield" id="textInputContainer" style="width: 168px;min-width: 72px; padding-top: 8px; display: flex;" ><ex-input id="filterInput" input-id="default" placeholder="Input value" type="text" 
														help-text="" info-text="Please enter full name" error-msg="Error message" label="" 
														footertype="info" size="medium" flavor="white" leadingicon="" 
														
														
														text="Clear" 
														sanitize="" autocomplete="on" leadingiconlabel="" statusiconlabel="" style="width: 168px ; min-width: 72px;">
													</ex-input></div>

                        <div class="filter-buttons" style="display: flex; justify-content: flex-end; align-items: center;
                    			gap: 8px; min-height: 32px; align-self: stretch;padding-top: 8px">
                        <ex-button id="resetFilter" flavor="branded" type="tertiary" size="default" buttontype="button" style="min-height: 32px;">Reset</ex-button>
                        <ex-button id="applyFilter" flavor="base" type="secondary" size="default" buttontype="submit" style="min-height: 32px;">Apply</ex-button>
                    </div>
                    </div>
                </div>`;

                // Get elements

                this.selectFilter = this.gui.querySelector("#selectFilter");
                this.input = this.gui.querySelector("#filterInput");
                this.applyButton = this.gui.querySelector("#applyFilter");
                this.resetButton = this.gui.querySelector("#resetFilter");
                this.inputContainer = this.gui.querySelector("#textInputContainer");


                this.selectFilter.addEventListener("change", (event) => {
                    this.selectedCondition = event.detail.value;
                    this.toggleInputVisibility();
                });


                this.input.addEventListener("onInput", (event) => {
                    this.filterText = event.target.value;
                });


                this.applyButton.addEventListener("click", () => {
                    this.params.filterChangedCallback();
                    this.params.api.onFilterChanged();
                    this.params.api.hidePopupMenu();
                });


                this.resetButton.addEventListener("click", () => {
                    this.selectedCondition = "Contains";
                    this.filterText = "";

                    this.input.value = "";
                    this.selectFilter.setAttribute("selected", "Contains");

                    this.toggleInputVisibility();


                    if (this.gui && this.gui.parentNode) {
                        this.gui.parentNode.removeChild(this.gui);
                    }

                    this.setupGui();

                    let filterModel = this.params.api.getFilterModel();
                    delete filterModel[this.params.colDef.field];
                    this.params.api.setFilterModel(filterModel);
                    this.params.api.onFilterChanged();
                    this.params.api.hidePopupMenu();
                });


            },
            toggleInputVisibility() {
                if (this.selectedCondition === "Empty" || this.selectedCondition === "Has Value") {
                    this.inputContainer.style.display = "none";
                    this.input.value = "";
                } else {
                    this.inputContainer.style.display = "block";
                }
            },
            getGui() {
                return this.gui;
            },


            isFilterActive() {
                if (this.selectedCondition === "Empty" || this.selectedCondition === "Has Value") {
                    return true;
                }
                return !!this.filterText;
            },

            doesFilterPass(params) {
                const cellValue = params.data[this.params.colDef.field]?.toString().toLowerCase() || "";
                const filterText = this.filterText?.toLowerCase() || "";

                switch (this.selectedCondition) {
                    case "Contains":
                        return cellValue.includes(filterText);

                    case "Does not contain":
                        return !cellValue.includes(filterText);

                    case "Equals":
                        return cellValue === filterText;

                    case "Does not equal":
                        return cellValue !== filterText;

                    case "Begins with":
                        return cellValue.startsWith(filterText);

                    case "Ends with":
                        return cellValue.endsWith(filterText);

                    case "Empty":
                        return cellValue.trim() === "";

                    case "Has Value":
                        return cellValue.trim() !== "";

                    default:
                        return false;
                }

            },

            getModel() {
                return this.isFilterActive() ? {
                    condition: this.selectedCondition,
                    value: this.filterText
                } : null;
            },

            setModel(model) {
                this.selectedCondition = model?.condition || "Contains";
                this.filterText = model?.value || "";

                this.selectFilter.setAttribute("selected", this.selectedCondition);
                this.input.value = this.filterText;
            },
        };
    };

    function getColumnDefinitionsForActivity() {
        return [{
                field: "Update date",
                headerName: "Updated Date",
                filter: customDateFilter,
                unSortIcon: true,
                filterParams: {
                    closeOnApply: true,
                    buttons: ["reset", "apply"]
                },
                cellRenderer: (params) => {

                    if (!params.value) {
                        const icon = document.createElement("ex-icon");

                        icon.icon = "In progress";
                        icon.size = "M";
                        icon.style.position = "relative";
                        icon.style.color = "var(--exo-color-font-link)";
                        icon.style.top = "13px";
                        return icon;
                    }
                    return formatDateActivity(params.value);
                }
            },
            {
                field: "Description",
                headerName: "Description",
                filter: customTextFilter,
                unSortIcon: true,
                filterParams: {
                    closeOnApply: true,
                    buttons: ["reset", "apply"]
                }
            },
        ];
    }

    function createBoxWithArrowIcon() {
        const icon = document.createElement("ex-icon");
        icon.icon = "new-window";
        icon.size = "S";
        icon.label = "references";
        icon.style.top = "8px";
        icon.style.fontSize = "23px";
        return icon;
    }

    function createLinkRenderer(params) {

        if (params.data.no_of_changes == 0) {
            return 'Created';
        }

        const hostname = window.location.hostname;
        const path = "command_center";
        const id = "changelog";
        const recordId = $scope.recordId;
        const repositoryId = getQueryParam("repositoryId");
        const universeId = getQueryParam("universeId");
        const modelName = getQueryParam("modelName");
        const recordTitle = $scope.recordTitle;
        const link = document.createElement("a");
        const fieldName = params.data?.field_name;

        link.href = "https://" + hostname + "/" + path + "?id=" + id + "&recordId=" + recordId + "&repositoryId=" + repositoryId +
            "&universeId=" + universeId + "&modelName=" + modelName + "&recTitle=" + recordTitle + "&fieldId=" + fieldName;
        link.target = "_self";
        link.rel = "noopener noreferrer";
        link.style.color = "var(--exo-color-font-link)";
        link.textContent = params.value > 0 ? params.value + ' Updates' : null;


        return link;
    }

    function handleGridReady(event) {
        gridApi = event.api;
        gridApi.sizeColumnsToFit();
        gridApi.refreshCells();

        const resizeListener = () => gridApi.sizeColumnsToFit();
        window.addEventListener("resize", resizeListener);

        event.api.addEventListener("gridDestroyed", () => {
            window.removeEventListener("resize", resizeListener);
        });

        const pagination = document.querySelector("ex-pagination");

        pagination.addEventListener("on-change", (e) => {
            if (!$scope.filteredRecords || $scope.filteredRecords.length === 0) return;

            const selectedPage = e.detail.selectedPage;
            $scope.selectedPage = selectedPage;

            applyPaginatedData($scope.filteredRecords, selectedPage);
        });
    }

    function showLoadingState() {
        if (gridApi) {
            gridApi.setGridOption("columnDefs", []);
            gridApi.applyTransaction({
                remove: []
            });
            gridApi.showLoadingOverlay();
        }
        $scope.loading = true;
    }

    function updateGrid(recordsData, columnDefs) {
        if (!gridApi) {
            return;
        }

        if (!recordsData || recordsData.length === 0) {
            if (columnDefs === 0) {
                $scope.noResults = true;
                gridApi.showNoRowsOverlay();
            } else if (columnDefs === 2) {
                $scope.noActivity = true;
                gridApi.showNoRowsOverlay();
            }
        } else {
            $scope.noResults = false;
            $scope.noActivity = false;
        }

        $scope.$applyAsync(() => {
            gridApi.applyTransaction({
                remove: gridApi.getModel().rowsToDisplay.map(row => row.data)
            });

            gridApi.applyTransaction({
                add: recordsData
            });

            //gridApi.setGridOption("columnDefs", []);
            gridApi.setGridOption("columnDefs", columnDefs);

            gridApi.hideOverlay();
            gridApi.refreshCells();
            gridApi.sizeColumnsToFit();
            gridApi.setGridOption("loading", false);
        });
    }

    function handleGridError() {
        gridApi.applyTransaction({
            add: []
        });
        gridApi.setGridOption("columnDefs", []);
        gridApi.setGridOption("loading", false);
    }

    function finalizeGridUpdate() {
        $scope.lastUpdatedTime = formatDate(new Date());
        $scope.loading = false;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    }



    function capitalizeFirstLetter(str) {
        if (typeof str !== "string") return "";
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function stringifyValue(value) {
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value, null, 2);
        return String(value);
    }

    function computeIndeterminate(children) {
        if (!children || children.length === 0) return false;
        var checkedCount = children.filter(function(child) {
            return child.checked;
        }).length;
        return checkedCount > 0 && checkedCount < children.length;
    }

    function buildTree(key, value, columnMap, isChild = false) {
        var column = columnMap[key];
        var isReference = column && column.type === "REFERENCE";

        var node = {
            label: capitalizeFirstLetter(key),
            checked: false,
            icon: !isChild && isReference ? "Link" : "",
            iconLabel: !isChild && isReference ? "Reference Field" : "",
            prettyName: key,
            repeatable: Array.isArray(value) || (column && column.repeatable),
            children: []
        };

        if (Array.isArray(value)) {
            node.children = value.map(function(item) {
                if (typeof item === "object" && item !== null) {
                    return {
                        label: capitalizeFirstLetter(key),
                        checked: false,
                        icon: "",
                        iconLabel: "",
                        prettyName: key,
                        repeatable: Array.isArray(item) || (column && column.repeatable),
                        children: Object.keys(item).map(function(subKey) {
                            return buildTree(subKey, item[subKey], columnMap, true);
                        })
                    };
                }
                return {
                    label: capitalizeFirstLetter(key) + ": " + stringifyValue(item),
                    checked: false,
                    icon: "",
                    iconLabel: "",
                    prettyName: key,
                    repeatable: Array.isArray(value) || (column && column.repeatable),
                    children: []
                };
            });
        } else if (typeof value === "object" && value !== null) {
            node.children = Object.keys(value).map(function(subKey) {
                return buildTree(subKey, value[subKey], columnMap, true);
            });
        } else {
            node.label += ": " + stringifyValue(value);
        }

        node.indeterminate = computeIndeterminate(node.children);
        return node;
    }

    function createMeta(record) {
        var metadata = {
            ID: record?.id || "",
            Source: record?.updateSource || "",
            "Version ID": record?.versionId || "",
            Updated: record?.noOfChanges > 1 ? (record.noOfChanges + ' fields') : (record.noOfChanges + ' field') || "",
            selectLabel: (record?.updateDate + " by " + record?.updateSource) || ""
        };
        return metadata;

    }

    function transformRecordToTree2(columns, record) {

        if (!Array.isArray(columns) || !record) {
            return [];
        }

        var columnMap = columns.reduce(function(map, col) {
            map[col.name] = col;
            return map;
        }, {});

        var recordXml = record && record.recordXml || {};

        var filteredRecord = columns.reduce(function(filtered, col) {
            if (recordXml.hasOwnProperty(col.name)) {
                var value = recordXml[col.name];
                if (col.type === "REFERENCE") {
                    filtered[col.name] = typeof value === "object" ? {
                        recordTitle: value.recordTitle
                    } : {
                        [col.name]: value
                    };

                } else {
                    filtered[col.name] = value;
                }
            }
            return filtered;
        }, {});

        var treedata = Object.keys(filteredRecord).map(function(key) {
            return buildTree(key, filteredRecord[key], columnMap);
        });

        return treedata;
    }

    function findRecord(recordMap, filterId) {
        filterId = String(filterId);

        let recordsArray;

        if (recordMap instanceof Map) {
            recordsArray = Array.from(recordMap.values());
        } else if (Array.isArray(recordMap)) {
            recordsArray = recordMap;
        } else {
            console.error("Invalid data structure: Expected Map or Array");
            return null;
        }

        let exactMatch = recordsArray.find(record => record.version === filterId);
        if (exactMatch) {
            return exactMatch;
        }

        return exactMatch;
    }

    function fetchFieldsForUniverse() {
        return new Promise((resolve, reject) => {
            var ga = new GlideAjax("x_boomi_cmd_center.GetFieldsForUniverse");
            ga.addParam("sysparm_name", "getData");
            ga.addParam("sysparm_universeId", getQueryParam("universeId"));
            ga.addParam("sysparm_repositoryId", getQueryParam("repositoryId"));
            ga.addParam("sysparm_summarypage", false);

            ga.getXMLAnswer((response) => {
                if (response) {
                    try {
                        const parsedResponse = JSON.parse(response);
                        if (parsedResponse.showjwterrormessage) {
                            console.warn("Invalid Jwt Token or Missing Api Token");

                            $scope.$applyAsync(() => {
                                getBoomiAccountId();

                                $scope.showJwtErrorMessage = true;
                            });
                            return;
                        }
                        if (parsedResponse.statusCode === 401) {
                            $scope.errorRestricted = true;
							return;
                        }
                        let recordsData = parsedResponse.responseBody.columns || [];
                        if (!Array.isArray(recordsData)) {
                            recordsData = [recordsData];
                        }
                        resolve(recordsData);
                    } catch (error) {
                        reject(`Error parsing response: ${error.message}`);
                    }
                } else {
                    reject("No response received from the server.");
                }
            });
        });
    }

    function fetchRecordVersion() {
        return new Promise((resolve, reject) => {
            var ga = new GlideAjax("x_boomi_cmd_center.GetRecordVersion");
            ga.addParam("sysparm_name", "getData");
            ga.addParam("sysparm_universeId", getQueryParam("universeId"));
            ga.addParam("sysparm_repositoryId", getQueryParam("repositoryId"));
            ga.addParam("sysparm_recordId", getQueryParam("recordId"));
            ga.addParam("sysparm_modelName", getQueryParam("modelName"));

            ga.getXMLAnswer((response) => {
                if (response) {
                    try {
                        const parsedResponse = JSON.parse(response);

                        if (parsedResponse.showjwterrormessage) {
                            console.warn("Invalid Jwt Token or Missing Api Token");

                            $scope.$applyAsync(() => {
                                getBoomiAccountId();

                                $scope.showJwtErrorMessage = true;
                            });
                            return;
                        }
                        if (parsedResponse.statusCode === 401) {
                            $scope.errorRestricted = true;
							return;
                        }						
                        let recordsData = parsedResponse.responseBody || [];
                        if (!Array.isArray(recordsData)) {
                            recordsData = [recordsData];
                        }
											  // Set the total records count in the scope and versionId
												$scope.$applyAsync(() => {
														$scope.totalmodelRecords = recordsData.length;
														$scope.lastRecordVersionId = (recordsData?.[0] || {}).versionId || 0;
												});
											
                        resolve(recordsData);
                    } catch (error) {
                        reject(`Error parsing response: ${error.message}`);
                    }
                } else {
                    reject("No response received from the server.");
                }
            });
        });
    }

    function fetchNewRecords() {
        try {

            const [fields, records] = $scope.recordsData;
            //console.log('Trecords', records);
            if (!records) {
                return;
            }

            if (!$scope.selectedRecordDetails && records && records.length > 0) {
                $scope.selectedRecordDetails = records[0];
            }

            let filterId = $scope.selectedRecordDetails?.version;
            //console.log('TFilteredId', filterId);

            const recordMap = new Map(records.map(record => [record.version, record]));
            const selectedRecord = recordMap.get(Number(filterId)) || records[0];

            if (!selectedRecord) return [];

            let treeElement = transformRecordToTree2(fields || [], selectedRecord);
            // console.log('TtreeElement', treeElement);

            $scope.$applyAsync(() => {
				
				if(records){
					records.forEach((element) => {
						element.selectLabel = formatDateActivity(element.updateDate) + ' by ' + element.updateSource;
					});
				}
                $scope.selectMenuData = records;

                $scope.selectedRecordDetails = selectedRecord;
                $scope.transactionId = selectedRecord?.transactionId;
                $scope.FormMetaData = createMeta(selectedRecord);

                if (treeElement && treeElement.length > 0) {
                    $scope.recordsLoader = false;
                    $scope.treeData = treeElement;
                }
            })


            $timeout(function() {
                const treeElement = document.querySelector("ex-tree");
                const getSelectedOption = document.querySelector("ex-select");

                if (getSelectedOption) {
                    getSelectedOption.removeEventListener("change", handleDropdownChange);
                    getSelectedOption.addEventListener("change", handleDropdownChange);
                }
            }, 0);

            return treeElement;
        } catch (error) {
            console.error("Error fetching data:", error);
            return {
                treeData: [],
                metadataArray: []
            };
        }
    }

    function getIdsByVersion(dataArray, version) {
        return dataArray
            .find(item => item.version == version)
    }


    function handleDropdownChange(e) {
        const id = e.detail?.value;
        if (!id) return;

        const foundItem = getIdsByVersion($scope.selectMenuData, id);
        if (!foundItem) {
            console.warn("No matching record found for ID:", id);
            return;
        }

        $scope.$applyAsync(() => {
            $scope.recordId = foundItem.id;
            $scope.transactionId = foundItem.transactionId;
            $scope.selectedRecordDetails = foundItem;
            $scope.FormMetaData = createMeta(foundItem);

            if ($scope.selectedIndex === 1) {
                fetchNewRecords();
            } else if ($scope.selectedIndex === 2) {
                gridApi.setGridOption("loading", true);
                fetchActivityData();
            }
        });
    }

    async function fetchChangesData() {
        try {
            showLoadingState();
            const recordsData = await fetchChanges();

            if (!recordsData || recordsData.length === 0) {
                $scope.noResults = true;
                gridApi.setGridOption("loading", false);
                return;
            }
            $scope.originalRecords = recordsData;
            $scope.filteredRecords = recordsData;
            updateGrid(recordsData, fetchColumnDefsList(0));
            await fetchRecord();
        } catch (error) {
            handleGridError();
        } finally {
            finalizeGridUpdate();
        }
    }

    async function fetchActivityData() {
        try {
            showLoadingState();

            const recordsData = await fetchActivity();

            if (!recordsData || recordsData.length === 0) {
                //updateGrid([], fetchColumnDefsList(2));
                $scope.noActivity = true;
                gridApi.setGridOption("loading", false);
                return;
            }

            $scope.originalRecords = recordsData;
            $scope.filteredRecords = recordsData.map(record => ({
                ...record,
                _updateId: Date.now()
            }));

            updateGrid($scope.filteredRecords, fetchColumnDefsList(2));
        } catch (error) {
            console.error("Error fetching activity data:", error);
            handleGridError();
        } finally {
            finalizeGridUpdate();
        }
    }

    async function fetchRecord() {
        try {
            const [fields, records] = await Promise.all([fetchFieldsForUniverse(), fetchRecordVersion()]);


            if (!Array.isArray(fields) || !Array.isArray(records)) {
                console.error("Unexpected data format", fields, records);
                return [];
            }

            $scope.recordsData = [fields, records];

            if (fields.length > 0 && records.length > 0) {
                return fetchNewRecords();
            } else {
                return [];
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            return {
                treeData: [],
                metadataArray: []
            };
        }
    }

    function updateFilterDot(api) {
        const exTable = document.querySelector('ex-table');
        if (!exTable) {
            console.warn("ex-table not found in the DOM.");
            return;
        }

        const headerContainer = exTable.shadowRoot ?
            exTable.shadowRoot.querySelectorAll('.ag-header-cell') :
            exTable.querySelectorAll('.ag-header-cell');

        headerContainer.forEach((header, index) => {
            const colId = header.getAttribute('col-id');

            const filterButton = header.querySelector('[data-ref="eFilterButton"]');
            if (!filterButton) return;
            let filterDot = filterButton.querySelector('.filter-dot');

            if (!filterDot) {
                const exIcon = filterButton.querySelector('ex-icon');
                if (exIcon?.shadowRoot) {
                    filterDot = exIcon.shadowRoot.querySelector('.filter-dot');
                }
            }
            const filterModel = api.getFilterModel();
            const isActive = filterModel[colId] !== undefined;
            if (!filterDot) return;
            if (isActive) {
                filterDot.style.display = 'inline-block';
                filterDot.style.right = '-3px';
                filterDot.style.position = 'absolute';
                filterDot.style.top = '-3px';
            } else {
                filterDot.style.display = 'none';
            }
        });
    }

    $scope.updateApiToken = function() {
        $scope.user.apiToken = document.getElementById("apiToken").value;

        if (!$scope.user.apiToken) {
            console.log("[updateApiToken] API Token is required.");
            $scope.message = "Please enter an API token.";
            $scope.showJwtErrorMessage = true;
            $scope.updateFailed = true;
            $scope.message = "To access your account, provide valid account email, account ID, and user account API token. After 5 attempts, your Boomi account will lock.";
            return;
        }

        var requestData = JSON.stringify({
            email: $scope.user.email || '',
            accountId: $scope.user.accountId || '',
            apiToken: $scope.user.apiToken
        });



        var ga = new GlideAjax('x_boomi_cmd_center.FetchAccountId');
        ga.addParam('sysparm_name', 'validateJWTToken');
        ga.addParam('sysparm_userData', requestData);

        ga.getXMLAnswer(function(response) {


            try {
                var result = JSON.parse(response);


                if (result.statusCode === 200) {

                    $scope.showJwtErrorMessage = false;
                    $scope.updateFailed = false;

                    window.location.reload();

                } else {

                    $scope.showJwtErrorMessage = true;
                    $scope.updateFailed = true;
                    $scope.message = "To access your account, provide valid account email, account ID, and user account API token. After 5 attempts, your Boomi account will lock.";
                }

                if (result.showjwterrormessage) {
                    $scope.showJwtErrorMessage = true;
                } else {
                    $scope.showJwtErrorMessage = false;
                }

            } catch (error) {

                $scope.showJwtErrorMessage = true;
                $scope.updateFailed = true;
                $scope.message = "To access your account, provide valid account email, account ID, and user account API token. After 5 attempts, your Boomi account will lock.";
            }

            $scope.$apply(); // Ensure UI updates properly
        });
    };

    function getBoomiAccountId() {
        var ga = new GlideAjax('x_boomi_cmd_center.FetchAccountId');
        ga.addParam('sysparm_name', 'getBoomiAccountId');

        ga.getXMLAnswer(function(response) {


            if (response && response.trim() !== "") {
                try {
                    var parsedResponse = JSON.parse(response);
                    $scope.user.accountId = parsedResponse.boomiAccountId;
                    $scope.user.email = parsedResponse.email;


                    //$scope.$apply(); 
                } catch (error) {

                }
            } else {
                console.log("Boomi Account ID not found or empty response.");
            }
        });
    }

    $scope.logout = function() {
        window.location.href = "/logout.do?sysparm_goto_url=/command_center";
    };
};