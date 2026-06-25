async function loadDashboard() {

    try {

        const response = await fetch("data/education.json");
        const data = await response.json();

        // ---------------- SCHOOL INFO ----------------

        document.getElementById("schoolName").textContent =
            data.school.name;

        document.getElementById("studentsCount").textContent =
            data.school.students_count;

        document.getElementById("teachersCount").textContent =
            data.school.teachers_count;

        document.getElementById("attendanceCount").textContent =
            data.school.attendance_rate + "%";

        document.getElementById("classesCount").textContent =
            data.school.classes_count;

        // ---------------- STUDENTS TABLE ----------------

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

        // ---------------- TEACHERS TABLE ----------------

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

        // ---------------- ATTENDANCE CHART ----------------

        new Chart(
            document.getElementById("attendanceChart"),
            {
                type: "line",

                data: {
                    labels: [
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                        "Sun"
                    ],

                    datasets: [{
                        label: "Attendance",

                        data: data.attendance_trend,

                        borderColor: "#8b5cf6",

                        backgroundColor: "rgba(139,92,246,0.20)",

                        fill: true,

                        tension: 0.4
                    }]
                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }

            }
        );

        // ---------------- FEE CHART ----------------

        new Chart(
            document.getElementById("feeChart"),
            {

                type: "doughnut",

                data: {

                    labels: [
                        "Paid",
                        "Pending"
                    ],

                    datasets: [{

                        data: [
                            data.fees.paid_students,
                            data.fees.pending_students
                        ],

                        backgroundColor: [
                            "#8b5cf6",
                            "#f6c453"
                        ]

                    }]

                },

                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }

            }
        );

        // ---------------- STUDENTS BAR CHART ----------------

        const classData = {};

        data.students.forEach(student => {

            classData[student.class] =
                (classData[student.class] || 0) + 1;

        });

        new Chart(

            document.getElementById("studentsChart"),

            {

                type: "bar",

                data: {

                    labels: Object.keys(classData),

                    datasets: [{

                        label: "Students",

                        data: Object.values(classData),

                        backgroundColor: "#8b5cf6"

                    }]

                },

                options: {

                    responsive: true,
                    maintainAspectRatio: false

                }

            }

        );

        // ---------------- TEACHERS BAR ----------------

        const departmentData = {};

        data.teachers.forEach(teacher => {

            departmentData[teacher.department] =
                (departmentData[teacher.department] || 0) + 1;

        });

        new Chart(

            document.getElementById("teacherChart"),

            {

                type: "bar",

                data: {

                    labels: Object.keys(departmentData),

                    datasets: [{

                        label: "Teachers",

                        data: Object.values(departmentData),

                        backgroundColor: "#22d3ee"

                    }]

                },

                options: {

                    indexAxis: "y",

                    responsive: true,

                    maintainAspectRatio: false

                }

            }

        );

    }

    catch (error) {

        console.error(error);

    }

}

loadDashboard();