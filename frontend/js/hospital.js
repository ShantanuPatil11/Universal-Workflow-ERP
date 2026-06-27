const APP = {
	data: null,
	activeView: "dashboard",
	charts: {}
};

const VIEW_TITLES = {
	dashboard: "Hospital ERP Dashboard",
	patients: "Patient Administration",
	doctors: "Doctor Management",
	appointments: "Appointment Operations",
	pharmacy: "Pharmacy Operations",
	billing: "Billing Operations"
};

async function initHospitalERP() {

	try {

		const response = await fetch("data/hospital.json");
		APP.data = await response.json();

		hydrateSharedHeader(APP.data);
		renderDashboard(APP.data);
		wireSidebarNavigation();

	} catch (error) {

		console.error(error);

	}

}

function hydrateSharedHeader(data) {

	document.getElementById("hospitalName").textContent = data.hospital.name;

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

	if (view === "patients") {
		renderPatientsView(APP.data);
	}

	if (view === "doctors") {
		renderDoctorsView(APP.data);
	}

	if (view === "appointments") {
		renderAppointmentsView(APP.data);
	}

	if (view === "pharmacy") {
		renderPharmacyView(APP.data);
	}

	if (view === "billing") {
		renderBillingView(APP.data);
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

	document.getElementById("patientsCount").textContent = data.hospital.patients_count;
	document.getElementById("doctorsCount").textContent = data.hospital.doctors_count;
	document.getElementById("appointmentsCount").textContent = data.hospital.appointments_count;
	document.getElementById("occupancyCount").textContent = data.hospital.occupancy_rate + "%";

	const patientsTable = document.getElementById("patientsTable");
	patientsTable.innerHTML = "";

	data.patients.forEach(patient => {
		patientsTable.innerHTML += `
			<tr>
				<td>${patient.id}</td>
				<td>${patient.name}</td>
				<td>${patient.department}</td>
				<td>${patient.status}</td>
				<td>${patient.bill_status}</td>
			</tr>
		`;
	});

	const doctorsTable = document.getElementById("doctorsTable");
	doctorsTable.innerHTML = "";

	data.doctors.forEach(doctor => {
		doctorsTable.innerHTML += `
			<tr>
				<td>${doctor.id}</td>
				<td>${doctor.name}</td>
				<td>${doctor.specialization}</td>
				<td>${doctor.status}</td>
				<td>${doctor.rating}</td>
			</tr>
		`;
	});

	APP.charts.patients = new Chart(document.getElementById("patientsChart"), {
		type: "line",
		data: {
			labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			datasets: [{
				label: "Patient Inflow",
				data: data.patient_inflow,
				borderColor: "#58acff",
				backgroundColor: "rgba(88,172,255,0.16)",
				fill: true,
				tension: 0.35
			}]
		},
		options: chartOptions()
	});

	APP.charts.billing = new Chart(document.getElementById("billingChart"), {
		type: "doughnut",
		data: {
			labels: ["Settled", "Pending"],
			datasets: [{
				data: [data.billing.settled_patients, data.billing.pending_patients],
				backgroundColor: ["#58acff", "#f2a847"],
				borderWidth: 0
			}]
		},
		options: chartOptions()
	});

	const specializationData = {};
	data.doctors.forEach(doctor => {
		specializationData[doctor.specialization] = (specializationData[doctor.specialization] || 0) + 1;
	});

	APP.charts.doctors = new Chart(document.getElementById("doctorsChart"), {
		type: "bar",
		data: {
			labels: Object.keys(specializationData),
			datasets: [{
				label: "Doctors",
				data: Object.values(specializationData),
				backgroundColor: "#58acff",
				borderRadius: 8
			}]
		},
		options: chartOptions()
	});

	const appointmentStatus = {};
	data.appointments.forEach(appointment => {
		appointmentStatus[appointment.status] = (appointmentStatus[appointment.status] || 0) + 1;
	});

	APP.charts.appointments = new Chart(document.getElementById("appointmentsChart"), {
		type: "bar",
		data: {
			labels: Object.keys(appointmentStatus),
			datasets: [{
				label: "Appointments",
				data: Object.values(appointmentStatus),
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

function renderPatientsView(data) {

	const root = document.getElementById("patientsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Patient Registry</p>
					<h2 class="erp-heading">Patients (${data.patients.length})</h2>
				</div>
				<button class="erp-btn">Add Patient</button>
			</div>
			<div class="erp-search-row">
				<input id="patientSearch" class="erp-input" type="search" placeholder="Search by name, ID, department, status">
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Department</th>
							<th>Status</th>
							<th>Billing</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody id="patientDirectoryRows"></tbody>
				</table>
			</div>
		</section>
	`;

	const search = document.getElementById("patientSearch");
	const rows = document.getElementById("patientDirectoryRows");

	const draw = (query = "") => {
		const keyword = query.toLowerCase().trim();
		const filtered = data.patients.filter(patient => {
			return [patient.id, patient.name, patient.department, patient.status]
				.join(" ")
				.toLowerCase()
				.includes(keyword);
		});

		rows.innerHTML = filtered.map(patient => `
			<tr>
				<td>${patient.id}</td>
				<td>${patient.name}</td>
				<td>${patient.department}</td>
				<td><span class="erp-badge ${patient.status === "Discharged" ? "is-paid" : "is-pending"}">${patient.status}</span></td>
				<td><span class="erp-badge ${patient.bill_status === "Settled" ? "is-paid" : "is-pending"}">${patient.bill_status}</span></td>
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

function renderDoctorsView(data) {

	const root = document.getElementById("doctorsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Clinical Staff</p>
					<h2 class="erp-heading">Doctors (${data.doctors.length})</h2>
				</div>
				<button class="erp-btn">Add Doctor</button>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Specialization</th>
							<th>Status</th>
							<th>Rating</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						${data.doctors.map(doctor => `
							<tr>
								<td>${doctor.id}</td>
								<td>${doctor.name}</td>
								<td>${doctor.specialization}</td>
								<td><span class="erp-badge ${doctor.status === "On Duty" ? "is-paid" : "is-pending"}">${doctor.status}</span></td>
								<td>${doctor.rating}</td>
								<td>
									<div class="erp-actions">
										<button class="erp-action-btn">Edit</button>
										<button class="erp-action-btn erp-danger">Delete</button>
									</div>
								</td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderAppointmentsView(data) {

	const root = document.getElementById("appointmentsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Care Scheduling</p>
					<h2 class="erp-heading">Appointments (${data.appointments.length})</h2>
				</div>
				<button class="erp-btn">Add Appointment</button>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Patient</th>
							<th>Doctor</th>
							<th>Department</th>
							<th>Time</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						${data.appointments.map(appointment => `
							<tr>
								<td>${appointment.id}</td>
								<td>${appointment.patient}</td>
								<td>${appointment.doctor}</td>
								<td>${appointment.department}</td>
								<td>${appointment.time}</td>
								<td><span class="erp-badge ${appointment.status === "Confirmed" || appointment.status === "Completed" ? "is-paid" : "is-pending"}">${appointment.status}</span></td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderPharmacyView(data) {

	const root = document.getElementById("pharmacyView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Medication Supply</p>
					<h2 class="erp-heading">Pharmacy Inventory</h2>
				</div>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Medicine</th>
							<th>Category</th>
							<th>Stock</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						${data.pharmacy.map(item => `
							<tr>
								<td>${item.id}</td>
								<td>${item.medicine}</td>
								<td>${item.category}</td>
								<td>${item.stock}</td>
								<td><span class="erp-badge ${item.status === "In Stock" ? "is-paid" : "is-pending"}">${item.status}</span></td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderBillingView(data) {

	const root = document.getElementById("billingView");
	const settlementRate = ((data.billing.settled_patients / (data.billing.settled_patients + data.billing.pending_patients)) * 100).toFixed(1);

	root.innerHTML = `
		<section class="erp-split-grid">
			<article class="panel erp-section">
				<div class="erp-toolbar">
					<div>
						<p class="erp-kicker">Revenue Cycle</p>
						<h2 class="erp-heading">Billing Status</h2>
					</div>
				</div>
				<div class="mini-kpi-grid">
					<div class="mini-kpi">
						<span>Total Billed</span>
						<strong>${formatCurrency(data.billing.total_billed)}</strong>
					</div>
					<div class="mini-kpi">
						<span>Pending Amount</span>
						<strong>${formatCurrency(data.billing.pending_amount)}</strong>
					</div>
					<div class="mini-kpi">
						<span>Settlement Rate</span>
						<strong>${settlementRate}%</strong>
					</div>
				</div>
				<div class="erp-table-wrap">
					<table>
						<thead>
							<tr>
								<th>Patient ID</th>
								<th>Name</th>
								<th>Department</th>
								<th>Status</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody>
							${data.patients.map(patient => {
								const isSettled = patient.bill_status === "Settled";
								return `
									<tr>
										<td>${patient.id}</td>
										<td>${patient.name}</td>
										<td>${patient.department}</td>
										<td><span class="erp-badge ${isSettled ? "is-paid" : "is-pending"}">${patient.bill_status}</span></td>
										<td>${formatCurrency(patient.bill_amount)}</td>
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

initHospitalERP();
const APP = {
	data: null,
	activeView: "dashboard",
	charts: {}
};

const VIEW_TITLES = {
	dashboard: "Hospital ERP Dashboard",
	patients: "Patient Administration",
	doctors: "Doctor Management",
	appointments: "Appointment Operations",
	pharmacy: "Pharmacy Operations",
	billing: "Billing Operations"
};

async function initHospitalERP() {

	try {

		const response = await fetch("data/hospital.json");
		APP.data = await response.json();

		hydrateSharedHeader(APP.data);
		renderDashboard(APP.data);
		wireSidebarNavigation();

	} catch (error) {

		console.error(error);

	}

}

function hydrateSharedHeader(data) {

	document.getElementById("hospitalName").textContent = data.hospital.name;

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

	if (view === "patients") {
		renderPatientsView(APP.data);
	}

	if (view === "doctors") {
		renderDoctorsView(APP.data);
	}

	if (view === "appointments") {
		renderAppointmentsView(APP.data);
	}

	if (view === "pharmacy") {
		renderPharmacyView(APP.data);
	}

	if (view === "billing") {
		renderBillingView(APP.data);
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

	document.getElementById("patientsCount").textContent = data.hospital.patients_count;
	document.getElementById("doctorsCount").textContent = data.hospital.doctors_count;
	document.getElementById("appointmentsCount").textContent = data.hospital.appointments_count;
	document.getElementById("occupancyCount").textContent = data.hospital.occupancy_rate + "%";

	const patientsTable = document.getElementById("patientsTable");
	patientsTable.innerHTML = "";

	data.patients.forEach(patient => {
		patientsTable.innerHTML += `
			<tr>
				<td>${patient.id}</td>
				<td>${patient.name}</td>
				<td>${patient.department}</td>
				<td>${patient.status}</td>
				<td>${patient.bill_status}</td>
			</tr>
		`;
	});

	const doctorsTable = document.getElementById("doctorsTable");
	doctorsTable.innerHTML = "";

	data.doctors.forEach(doctor => {
		doctorsTable.innerHTML += `
			<tr>
				<td>${doctor.id}</td>
				<td>${doctor.name}</td>
				<td>${doctor.specialization}</td>
				<td>${doctor.status}</td>
				<td>${doctor.rating}</td>
			</tr>
		`;
	});

	APP.charts.patients = new Chart(document.getElementById("patientsChart"), {
		type: "line",
		data: {
			labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
			datasets: [{
				label: "Patient Inflow",
				data: data.patient_inflow,
				borderColor: "#58acff",
				backgroundColor: "rgba(88,172,255,0.16)",
				fill: true,
				tension: 0.35
			}]
		},
		options: chartOptions()
	});

	APP.charts.billing = new Chart(document.getElementById("billingChart"), {
		type: "doughnut",
		data: {
			labels: ["Settled", "Pending"],
			datasets: [{
				data: [data.billing.settled_patients, data.billing.pending_patients],
				backgroundColor: ["#58acff", "#f2a847"],
				borderWidth: 0
			}]
		},
		options: chartOptions()
	});

	const doctorBySpec = {};
	data.doctors.forEach(doctor => {
		doctorBySpec[doctor.specialization] = (doctorBySpec[doctor.specialization] || 0) + 1;
	});

	APP.charts.doctors = new Chart(document.getElementById("doctorsChart"), {
		type: "bar",
		data: {
			labels: Object.keys(doctorBySpec),
			datasets: [{
				label: "Doctors",
				data: Object.values(doctorBySpec),
				backgroundColor: "#58acff",
				borderRadius: 8
			}]
		},
		options: chartOptions()
	});

	const appointmentStatus = {};
	data.appointments.forEach(appointment => {
		appointmentStatus[appointment.status] = (appointmentStatus[appointment.status] || 0) + 1;
	});

	APP.charts.appointments = new Chart(document.getElementById("appointmentsChart"), {
		type: "bar",
		data: {
			labels: Object.keys(appointmentStatus),
			datasets: [{
				label: "Appointments",
				data: Object.values(appointmentStatus),
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

function renderPatientsView(data) {

	const root = document.getElementById("patientsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Patient Registry</p>
					<h2 class="erp-heading">Patients (${data.patients.length})</h2>
				</div>
				<button class="erp-btn">Add Patient</button>
			</div>
			<div class="erp-search-row">
				<input id="patientSearch" class="erp-input" type="search" placeholder="Search by name, ID, department, status">
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Department</th>
							<th>Status</th>
							<th>Bill Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody id="patientDirectoryRows"></tbody>
				</table>
			</div>
		</section>
	`;

	const search = document.getElementById("patientSearch");
	const rows = document.getElementById("patientDirectoryRows");

	const draw = (query = "") => {
		const keyword = query.toLowerCase().trim();
		const filtered = data.patients.filter(patient => {
			return [patient.id, patient.name, patient.department, patient.status]
				.join(" ")
				.toLowerCase()
				.includes(keyword);
		});

		rows.innerHTML = filtered.map(patient => `
			<tr>
				<td>${patient.id}</td>
				<td>${patient.name}</td>
				<td>${patient.department}</td>
				<td>${patient.status}</td>
				<td><span class="erp-badge ${patient.bill_status === "Settled" ? "is-paid" : "is-pending"}">${patient.bill_status}</span></td>
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

function renderDoctorsView(data) {

	const root = document.getElementById("doctorsView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Clinical Staff</p>
					<h2 class="erp-heading">Doctors (${data.doctors.length})</h2>
				</div>
				<button class="erp-btn">Add Doctor</button>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Specialization</th>
							<th>Status</th>
							<th>Rating</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						${data.doctors.map(doctor => `
							<tr>
								<td>${doctor.id}</td>
								<td>${doctor.name}</td>
								<td>${doctor.specialization}</td>
								<td><span class="erp-badge ${doctor.status === "On Duty" ? "is-paid" : "is-pending"}">${doctor.status}</span></td>
								<td>${doctor.rating}</td>
								<td>
									<div class="erp-actions">
										<button class="erp-action-btn">Edit</button>
										<button class="erp-action-btn erp-danger">Delete</button>
									</div>
								</td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderAppointmentsView(data) {

	const root = document.getElementById("appointmentsView");
	root.innerHTML = `
		<section class="erp-split-grid">
			<article class="panel erp-section">
				<div class="erp-toolbar">
					<div>
						<p class="erp-kicker">Schedule Board</p>
						<h2 class="erp-heading">Appointments</h2>
					</div>
					<input class="erp-input date-input" type="date" aria-label="Appointment date selector">
				</div>
				<div class="mini-kpi-grid">
					<div class="mini-kpi">
						<span>Total</span>
						<strong>${data.appointments.length}</strong>
					</div>
					<div class="mini-kpi">
						<span>Confirmed</span>
						<strong>${data.appointments.filter(appointment => appointment.status === "Confirmed").length}</strong>
					</div>
					<div class="mini-kpi">
						<span>Completed</span>
						<strong>${data.appointments.filter(appointment => appointment.status === "Completed").length}</strong>
					</div>
				</div>
				<div class="erp-table-wrap">
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Patient</th>
								<th>Doctor</th>
								<th>Department</th>
								<th>Time</th>
								<th>Status</th>
							</tr>
						</thead>
						<tbody>
							${data.appointments.map(appointment => {
								const isHealthy = appointment.status === "Confirmed" || appointment.status === "Completed";
								return `
									<tr>
										<td>${appointment.id}</td>
										<td>${appointment.patient}</td>
										<td>${appointment.doctor}</td>
										<td>${appointment.department}</td>
										<td>${appointment.time}</td>
										<td><span class="erp-badge ${isHealthy ? "is-paid" : "is-pending"}">${appointment.status}</span></td>
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

function renderPharmacyView(data) {

	const root = document.getElementById("pharmacyView");
	root.innerHTML = `
		<section class="panel erp-section">
			<div class="erp-toolbar">
				<div>
					<p class="erp-kicker">Medication Inventory</p>
					<h2 class="erp-heading">Pharmacy Stock</h2>
				</div>
				<button class="erp-btn">Add Medicine</button>
			</div>
			<div class="erp-table-wrap">
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Medicine</th>
							<th>Category</th>
							<th>Stock</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						${data.pharmacy.map(item => `
							<tr>
								<td>${item.id}</td>
								<td>${item.medicine}</td>
								<td>${item.category}</td>
								<td>${item.stock}</td>
								<td><span class="erp-badge ${item.status === "In Stock" ? "is-paid" : "is-pending"}">${item.status}</span></td>
							</tr>
						`).join("")}
					</tbody>
				</table>
			</div>
		</section>
	`;

}

function renderBillingView(data) {

	const root = document.getElementById("billingView");
	const settlementRate = ((data.billing.settled_patients / (data.billing.settled_patients + data.billing.pending_patients)) * 100).toFixed(1);

	root.innerHTML = `
		<section class="erp-split-grid">
			<article class="panel erp-section">
				<div class="erp-toolbar">
					<div>
						<p class="erp-kicker">Revenue Desk</p>
						<h2 class="erp-heading">Billing Status</h2>
					</div>
				</div>
				<div class="mini-kpi-grid">
					<div class="mini-kpi">
						<span>Total Billed</span>
						<strong>${formatCurrency(data.billing.total_billed)}</strong>
					</div>
					<div class="mini-kpi">
						<span>Pending Amount</span>
						<strong>${formatCurrency(data.billing.pending_amount)}</strong>
					</div>
					<div class="mini-kpi">
						<span>Settlement Rate</span>
						<strong>${settlementRate}%</strong>
					</div>
				</div>
				<div class="erp-table-wrap">
					<table>
						<thead>
							<tr>
								<th>Patient ID</th>
								<th>Name</th>
								<th>Department</th>
								<th>Status</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody>
							${data.patients.map(patient => {
								const isSettled = patient.bill_status === "Settled";
								return `
									<tr>
										<td>${patient.id}</td>
										<td>${patient.name}</td>
										<td>${patient.department}</td>
										<td><span class="erp-badge ${isSettled ? "is-paid" : "is-pending"}">${patient.bill_status}</span></td>
										<td>${formatCurrency(patient.bill_amount)}</td>
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

initHospitalERP();
