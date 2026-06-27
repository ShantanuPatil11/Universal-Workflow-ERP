const APP = {
	data: null,
	activeView: "dashboard",
	charts: {}
};

const VIEW_TITLES = {
	dashboard: "Corporate ERP Dashboard",
	employees: "Employee Administration",
	departments: "Department Management",
	attendance: "Attendance Operations",
	projects: "Project Control Center",
	payroll: "Payroll Operations"
};

async function initCorporateERP() {

	try {

		const response = await fetch("data/corporate.json");
		APP.data = await response.json();

		hydrateSharedHeader(APP.data);
		renderDashboard(APP.data);
		wireSidebarNavigation();

	} catch (error) {

		console.error(error);

	}

}

function hydrateSharedHeader(data) {

	document.getElementById("companyName").textContent = data.company.name;

}

function wireSidebarNavigation() {

	const navLinks = document.querySelectorAll(".sidebar-nav a[data-view]");

	navLinks.forEach(link => {
		link.addEventListener("click", (event) => {
			event.preventDefault();
			const view = link.dataset.view;
			if (!view || view === APP.activeView) {
				return;
			}

			APP.activeView = view;
			switchView(view);

			navLinks.forEach(item => item.classList.remove("active"));
			link.classList.add("active");
		});
	});

}

function switchView(view) {

	const views = document.querySelectorAll(".app-view");
	views.forEach(section => {
		const isActive = section.dataset.view === view;
		section.hidden = !isActive;
		section.classList.toggle("is-active", isActive);
	});

	const title = document.getElementById("viewTitle");
	title.textContent = VIEW_TITLES[view] || VIEW_TITLES.dashboard;

	if (view === "dashboard") {
		renderDashboard(APP.data);
		return;
	}

	if (view === "employees") {
		renderEmployeesView(APP.data);
	}

	if (view === "departments") {
		renderDepartmentsView(APP.data);
	}

	if (view === "attendance") {
		renderAttendanceView(APP.data);
	}

	if (view === "projects") {
		renderProjectsView(APP.data);
	}

	if (view === "payroll") {
		renderPayrollView(APP.data);
	}

}

function destroyCharts() {

	Object.values(APP.charts).forEach((instance) => {
		if (instance) {
			instance.destroy();
		}
	});

	APP.charts = {};

}

function renderDashboard(data) {

	destroyCharts();

	document.getElementById("employeesCount").textContent = data.company.employees_count;
	document.getElementById("departmentsCount").textContent = data.company.departments_count;
	document.getElementById("attendanceCount").textContent = data.company.attendance_rate + "%";
	document.getElementById("projectsCount").textContent = data.company.projects_count;

	const employeesTable = document.getElementById("employeesTable");
	employeesTable.innerHTML = "";

	data.employees.forEach(employee => {
		employeesTable.innerHTML += `
			<tr>
				<td>${employee.id}</td>
				<td>${employee.name}</td>
				<td>${employee.department}</td>
				<td>${employee.attendance}%</td>
				<td>${employee.payroll_status}</td>
			</tr>
		`;
	});

	const departmentsTable = document.getElementById("departmentsTable");
	departmentsTable.innerHTML = "";

	data.departments.forEach(department => {
		departmentsTable.innerHTML += `
			<tr>
				<td>${department.id}</td>
				<td>${department.name}</td>
				<td>${department.head}</td>
				<td>${department.status}</td>
				<td>${department.headcount}</td>
			</tr>
		`;
	});

	APP.charts.attendance = new Chart(document.getElementById("attendanceChart"), {
		type: "line",
		data: {
			labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			datasets: [{
				label: "Attendance",
				data: data.attendance_trend,
				borderColor: "#58acff",
				backgroundColor: "rgba(88,172,255,0.16)",
				fill: true,
				tension: 0.35
			}]
		},
		options: chartOptions()
	});

	APP.charts.payroll = new Chart(document.getElementById("payrollChart"), {
		type: "doughnut",
		data: {
			labels: ["Processed", "Pending"],
			datasets: [{
				data: [data.payroll.processed_employees, data.payroll.pending_employees],
				backgroundColor: ["#58acff", "#f2a847"],
				borderWidth: 0
			}]
		},
		options: chartOptions()
	});

	const employeeData = {};
	data.employees.forEach(employee => {
		employeeData[employee.department] = (employeeData[employee.department] || 0) + 1;
	});

	APP.charts.employees = new Chart(document.getElementById("employeesChart"), {
		type: "bar",
		data: {
			labels: Object.keys(employeeData),
			datasets: [{
				label: "Employees",
				data: Object.values(employeeData),
				backgroundColor: "#58acff",
				borderRadius: 8
			}]
		},
		options: chartOptions()
	});

	const projectStatus = {};
	data.projects.forEach(project => {
		projectStatus[project.status] = (projectStatus[project.status] || 0) + 1;
	});

	APP.charts.projects = new Chart(document.getElementById("projectsChart"), {
		type: "bar",
		data: {
			labels: Object.keys(projectStatus),
			datasets: [{
				label: "Projects",
				data: Object.values(projectStatus),
				backgroundColor: "#20c4b7",
				borderRadius: 8
			}]
		},
		options: {
			...chartOptions(),
			indexAxis: "y"
		}
	});

}

function chartOptions() {

	return {
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		plugins: {
			legend: {
				labels: {
					color: "#a4b3c7"
				}
			}
		},
		scales: {
			x: {
				ticks: { color: "#97a7be" },
				grid: { color: "rgba(144,161,184,0.14)" }
			},
			y: {
				ticks: { color: "#97a7be" },
				grid: { color: "rgba(144,161,184,0.14)" }
			}
		}
	};

}

function renderEmployeesView(data) {

	const root = document.getElementById("employeesView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">People Registry</p>
					<h2 class="erp-heading">Employees (${data.employees.length})</h2>
				</div>
				<button class="erp-btn">Add Employee</button>
			</div>
			<div class="erp-search-row">
				<input id="employeeSearch" class="erp-input" type="search" placeholder="Search by name, ID, department, designation">
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Department</th>
							<th>Designation</th>
							<th>Attendance</th>
							<th>Payroll</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody id="employeeDirectoryRows"></tbody>
				</table>
			</div>
		</section>
	`;

	const search = document.getElementById("employeeSearch");
	const rows = document.getElementById("employeeDirectoryRows");

	const draw = (query = "") => {
		const keyword = query.toLowerCase().trim();
		const filtered = data.employees.filter(employee => {
			return [employee.id, employee.name, employee.department, employee.designation]
				.join(" ")
				.toLowerCase()
				.includes(keyword);
		});

		rows.innerHTML = filtered.map(employee => `
			<tr>
				<td>${employee.id}</td>
				<td>${employee.name}</td>
				<td>${employee.department}</td>
				<td>${employee.designation}</td>
				<td>${employee.attendance}%</td>
				<td><span class="erp-badge ${employee.payroll_status === "Processed" ? "is-paid" : "is-pending"}">${employee.payroll_status}</span></td>
				<td>
					<div class="erp-actions">
						<button class="erp-action-btn">Edit</button>
						<button class="erp-action-btn erp-danger">Delete</button>
					</div>
				</td>
			</tr>
		`).join("");
	};

	draw();
	search.addEventListener("input", (event) => draw(event.target.value));

}

function renderDepartmentsView(data) {

	const root = document.getElementById("departmentsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Business Units</p>
					<h2 class="erp-heading">Departments (${data.departments.length})</h2>
				</div>
				<button class="erp-btn">Add Department</button>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Department</th>
							<th>Head</th>
							<th>Headcount</th>
							<th>Status</th>
							<th>Budget Utilization</th>
						</tr>
					</thead>
					<tbody>
						${data.departments.map(department => `
							<tr>
								<td>${department.id}</td>
								<td>${department.name}</td>
								<td>${department.head}</td>
								<td>${department.headcount}</td>
								<td><span class="erp-badge ${department.status === "Watch" ? "is-pending" : "is-paid"}">${department.status}</span></td>
								<td>${department.budget_utilization}%</td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderAttendanceView(data) {

	const root = document.getElementById("attendanceView");
	const presentCutoff = 93;
	const presentEmployees = data.employees.filter(employee => employee.attendance >= presentCutoff).length;
	const absentEmployees = data.employees.length - presentEmployees;

	root.innerHTML = `
		<section class="erp-split-grid">
			<article class="panel erp-section">
				<div class="erp-toolbar">
					<div>
						<p class="erp-kicker">Attendance Register</p>
						<h2 class="erp-heading">Daily Attendance</h2>
					</div>
					<input class="erp-input date-input" type="date" aria-label="Attendance date selector">
				</div>
				<div class="mini-kpi-grid">
					<div class="mini-kpi">
						<span>Attendance</span>
						<strong>${data.company.attendance_rate}%</strong>
					</div>
					<div class="mini-kpi">
						<span>Present</span>
						<strong>${presentEmployees}</strong>
					</div>
					<div class="mini-kpi">
						<span>Absent</span>
						<strong>${absentEmployees}</strong>
					</div>
				</div>
				<div class="erp-table-wrap">
					<table>
						<thead>
							<tr>
								<th>Employee ID</th>
								<th>Name</th>
								<th>Department</th>
								<th>Attendance %</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							${data.employees.map(employee => {
								const isPresent = employee.attendance >= presentCutoff;
								return `
									<tr>
										<td>${employee.id}</td>
										<td>${employee.name}</td>
										<td>${employee.department}</td>
										<td>${employee.attendance}%</td>
										<td><span class="erp-badge ${isPresent ? "is-paid" : "is-pending"}">${isPresent ? "Present" : "Absent"}</span></td>
									</tr>
								`;
							}).join("")}
						</tbody>
					</table>
				</div>
			</article>
		</section>
	`;

}

function renderProjectsView(data) {

	const root = document.getElementById("projectsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Execution Pipeline</p>
					<h2 class="erp-heading">Projects (${data.projects.length})</h2>
				</div>
				<button class="erp-btn">Add Project</button>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Project</th>
							<th>Department</th>
							<th>Owner</th>
							<th>Status</th>
							<th>Progress</th>
							<th>Deadline</th>
						</tr>
					</thead>
					<tbody>
						${data.projects.map(project => `
							<tr>
								<td>${project.id}</td>
								<td>${project.name}</td>
								<td>${project.department}</td>
								<td>${project.owner}</td>
								<td><span class="erp-badge ${project.status === "On Track" ? "is-paid" : "is-pending"}">${project.status}</span></td>
								<td>
									<div class="progress-track"><span class="progress-fill" style="width:${project.progress}%"></span></div>
									<small class="progress-copy">${project.progress}%</small>
								</td>
								<td>${project.deadline}</td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderPayrollView(data) {

	const root = document.getElementById("payrollView");
	const completionRate = ((data.payroll.processed_employees / (data.payroll.processed_employees + data.payroll.pending_employees)) * 100).toFixed(1);

	root.innerHTML = `
		<section class="erp-split-grid">
			<article class="panel erp-section">
				<div class="erp-toolbar">
					<div>
						<p class="erp-kicker">Compensation Control</p>
						<h2 class="erp-heading">Payroll Status</h2>
					</div>
				</div>
				<div class="mini-kpi-grid">
					<div class="mini-kpi">
						<span>Total Disbursed</span>
						<strong>${formatCurrency(data.payroll.total_disbursed)}</strong>
					</div>
					<div class="mini-kpi">
						<span>Pending Amount</span>
						<strong>${formatCurrency(data.payroll.pending_amount)}</strong>
					</div>
					<div class="mini-kpi">
						<span>Completion Rate</span>
						<strong>${completionRate}%</strong>
					</div>
				</div>
				<div class="erp-table-wrap">
					<table>
						<thead>
							<tr>
								<th>Employee ID</th>
								<th>Name</th>
								<th>Department</th>
								<th>Status</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody>
							${data.employees.map(employee => {
								const isProcessed = employee.payroll_status === "Processed";
								return `
									<tr>
										<td>${employee.id}</td>
										<td>${employee.name}</td>
										<td>${employee.department}</td>
										<td><span class="erp-badge ${isProcessed ? "is-paid" : "is-pending"}">${employee.payroll_status}</span></td>
										<td>${formatCurrency(employee.monthly_salary)}</td>
									</tr>
								`;
							}).join("")}
						</tbody>
					</table>
				</div>
			</article>
		</section>
	`;

}

function formatCurrency(amount) {

	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0
	}).format(amount);

}

initCorporateERP();
