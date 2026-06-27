const APP = {
    data: null,
    activeView: "dashboard",
    charts: {}
};

const VIEW_TITLES = {
    dashboard: "Education ERP Dashboard",
    students: "Student Administration",
    teachers: "Faculty Management",
    attendance: "Attendance Operations",
    timetable: "Timetable Planner",
    fees: "Fee Operations"
};

async function initEducationERP() {

    try {

        const response = await fetch("data/education.json");
        APP.data = await response.json();

        hydrateSharedHeader(APP.data);
        renderDashboard(APP.data);
        wireSidebarNavigation();

    } catch (error) {

        console.error(error);

    }

}

function hydrateSharedHeader(data) {

    document.getElementById("schoolName").textContent = data.school.name;

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

    if (view === "students") {
        renderStudentsView(APP.data);
    }

    if (view === "teachers") {
        renderTeachersView(APP.data);
    }

    if (view === "attendance") {
        renderAttendanceView(APP.data);
    }

    if (view === "timetable") {
        renderTimetableView(APP.data);
    }

    if (view === "fees") {
        renderFeesView(APP.data);
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

    document.getElementById("studentsCount").textContent = data.school.students_count;
    document.getElementById("teachersCount").textContent = data.school.teachers_count;
    document.getElementById("attendanceCount").textContent = data.school.attendance_rate + "%";
    document.getElementById("classesCount").textContent = data.school.classes_count;

    const studentsTable = document.getElementById("studentsTable");
    studentsTable.innerHTML = "";

    data.students.forEach(student => {
        studentsTable.innerHTML += `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.attendance}%</td>
                <td>${student.fees_status}</td>
            </tr>
        `;
    });

    const teachersTable = document.getElementById("teachersTable");
    teachersTable.innerHTML = "";

    data.teachers.forEach(teacher => {
        teachersTable.innerHTML += `
            <tr>
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td>${teacher.department}</td>
                <td>${teacher.status}</td>
                <td>${teacher.rating}</td>
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
                borderColor: "#4fb5ff",
                backgroundColor: "rgba(79,181,255,0.18)",
                fill: true,
                tension: 0.36
            }]
        },
        options: chartOptions()
    });

    APP.charts.fees = new Chart(document.getElementById("feeChart"), {
        type: "doughnut",
        data: {
            labels: ["Paid", "Pending"],
            datasets: [{
                data: [data.fees.paid_students, data.fees.pending_students],
                backgroundColor: ["#4fb5ff", "#f2a847"],
                borderWidth: 0
            }]
        },
        options: chartOptions()
    });

    const classData = {};
    data.students.forEach(student => {
        classData[student.class] = (classData[student.class] || 0) + 1;
    });

    APP.charts.students = new Chart(document.getElementById("studentsChart"), {
        type: "bar",
        data: {
            labels: Object.keys(classData),
            datasets: [{
                label: "Students",
                data: Object.values(classData),
                backgroundColor: "#4fb5ff",
                borderRadius: 8
            }]
        },
        options: chartOptions()
    });

    const departmentData = {};
    data.teachers.forEach(teacher => {
        departmentData[teacher.department] = (departmentData[teacher.department] || 0) + 1;
    });

    APP.charts.teachers = new Chart(document.getElementById("teacherChart"), {
        type: "bar",
        data: {
            labels: Object.keys(departmentData),
            datasets: [{
                label: "Teachers",
                data: Object.values(departmentData),
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
                    color: "#a6b7cd"
                }
            }
        },
        scales: {
            x: {
                ticks: { color: "#9bb0c8" },
                grid: { color: "rgba(152,173,201,0.14)" }
            },
            y: {
                ticks: { color: "#9bb0c8" },
                grid: { color: "rgba(152,173,201,0.14)" }
            }
        }
    };

}

function renderStudentsView(data) {

    const root = document.getElementById("studentsView");
    root.innerHTML = `
        <section class="panel erp-section">
            <div class="erp-toolbar">
                <div>
                    <p class="erp-kicker">Student Registry</p>
                    <h2 class="erp-heading">Students (${data.students.length})</h2>
                </div>
                <button class="erp-btn">Add Student</button>
            </div>
            <div class="erp-search-row">
                <input id="studentSearch" class="erp-input" type="search" placeholder="Search by name, ID, class, fee status">
            </div>
            <div class="erp-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Class</th>
                            <th>Attendance</th>
                            <th>Fees</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentDirectoryRows"></tbody>
                </table>
            </div>
        </section>
    `;

    const search = document.getElementById("studentSearch");
    const rows = document.getElementById("studentDirectoryRows");

    const draw = (query = "") => {
        const keyword = query.toLowerCase().trim();
        const filtered = data.students.filter(student => {
            return [student.id, student.name, student.class, student.fees_status]
                .join(" ")
                .toLowerCase()
                .includes(keyword);
        });

        rows.innerHTML = filtered.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.attendance}%</td>
                <td><span class="erp-badge ${student.fees_status === "Paid" ? "is-paid" : "is-pending"}">${student.fees_status}</span></td>
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

function renderTeachersView(data) {

    const root = document.getElementById("teachersView");
    root.innerHTML = `
        <section class="panel erp-section">
            <div class="erp-toolbar">
                <div>
                    <p class="erp-kicker">Faculty Directory</p>
                    <h2 class="erp-heading">Teachers (${data.teachers.length})</h2>
                </div>
                <button class="erp-btn">Add Teacher</button>
            </div>
            <div class="erp-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Rating</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.teachers.map(teacher => `
                            <tr>
                                <td>${teacher.id}</td>
                                <td>${teacher.name}</td>
                                <td>${teacher.department}</td>
                                <td><span class="erp-badge ${teacher.status === "Active" ? "is-paid" : "is-pending"}">${teacher.status}</span></td>
                                <td>${teacher.rating}</td>
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

function renderAttendanceView(data) {

    const root = document.getElementById("attendanceView");
    const presentCutoff = 94;
    const presentStudents = data.students.filter(student => student.attendance >= presentCutoff).length;
    const absentStudents = data.students.length - presentStudents;

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
                        <strong>${data.school.attendance_rate}%</strong>
                    </div>
                    <div class="mini-kpi">
                        <span>Present</span>
                        <strong>${presentStudents}</strong>
                    </div>
                    <div class="mini-kpi">
                        <span>Absent</span>
                        <strong>${absentStudents}</strong>
                    </div>
                </div>
                <div class="erp-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Attendance %</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.students.map(student => {
                                const isPresent = student.attendance >= presentCutoff;
                                return `
                                    <tr>
                                        <td>${student.id}</td>
                                        <td>${student.name}</td>
                                        <td>${student.class}</td>
                                        <td>${student.attendance}%</td>
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

function renderTimetableView(data) {

    const root = document.getElementById("timetableView");
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const periods = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM"];

    const slots = {};
    data.timetable.forEach(entry => {
        slots[`${entry.day}-${entry.time}`] = entry;
    });

    root.innerHTML = `
        <section class="panel erp-section">
            <div class="erp-toolbar">
                <div>
                    <p class="erp-kicker">Academic Schedule</p>
                    <h2 class="erp-heading">Weekly Timetable</h2>
                </div>
            </div>
            <div class="timetable-grid-wrap">
                <table class="timetable-grid">
                    <thead>
                        <tr>
                            <th>Day</th>
                            ${periods.map(period => `<th>${period}</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${days.map(day => `
                            <tr>
                                <td class="day-cell">${day}</td>
                                ${periods.map(period => {
                                    const slot = slots[`${day}-${period}`];
                                    if (!slot) {
                                        return "<td class='timetable-slot empty'>-</td>";
                                    }

                                    return `
                                        <td class="timetable-slot">
                                            <strong>${slot.subject}</strong>
                                            <span>${slot.class} • ${slot.teacher}</span>
                                            <small>Classroom ${slot.class}</small>
                                        </td>
                                    `;
                                }).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;

}

function renderFeesView(data) {

    const root = document.getElementById("feesView");
    const collectionRate = ((data.fees.paid_students / (data.fees.paid_students + data.fees.pending_students)) * 100).toFixed(1);
    const baseFee = Math.round(data.fees.total_collected / Math.max(data.fees.paid_students, 1));

    root.innerHTML = `
        <section class="erp-split-grid">
            <article class="panel erp-section">
                <div class="erp-toolbar">
                    <div>
                        <p class="erp-kicker">Finance Control</p>
                        <h2 class="erp-heading">Fee Status</h2>
                    </div>
                </div>
                <div class="mini-kpi-grid">
                    <div class="mini-kpi">
                        <span>Total Collected</span>
                        <strong>${formatCurrency(data.fees.total_collected)}</strong>
                    </div>
                    <div class="mini-kpi">
                        <span>Pending Amount</span>
                        <strong>${formatCurrency(data.fees.pending_amount)}</strong>
                    </div>
                    <div class="mini-kpi">
                        <span>Collection Rate</span>
                        <strong>${collectionRate}%</strong>
                    </div>
                </div>
                <div class="erp-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Class</th>
                                <th>Status</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.students.map(student => {
                                const isPaid = student.fees_status === "Paid";
                                return `
                                    <tr>
                                        <td>${student.id}</td>
                                        <td>${student.name}</td>
                                        <td>${student.class}</td>
                                        <td><span class="erp-badge ${isPaid ? "is-paid" : "is-pending"}">${student.fees_status}</span></td>
                                        <td>${formatCurrency(isPaid ? baseFee : baseFee)}</td>
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

initEducationERP();