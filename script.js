// =====================================================
// VARIABLES
// =====================================================

let latitude = null;
let longitude = null;

let selectedPhoto = "";

let reports =
    JSON.parse(
        localStorage.getItem("wasteReports")
    ) || [];


// =====================================================
// MAP
// =====================================================

let map = L.map("map").setView(
    [9.9252, 78.1198],
    13
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            "© OpenStreetMap contributors"
    }
).addTo(map);


// =====================================================
// CHARTS
// =====================================================

let wasteChart = null;
let statusChart = null;


// =====================================================
// LOGIN
// =====================================================

function login() {

    const username =
        document
            .getElementById("username")
            .value
            .trim();

    const password =
        document
            .getElementById("password")
            .value
            .trim();

    const message =
        document.getElementById(
            "loginMessage"
        );


    if (
        username === "admin" &&
        password === "1234"
    ) {

        document.getElementById(
            "loginPage"
        ).style.display = "none";


        document.getElementById(
            "portalPage"
        ).style.display = "block";


        sessionStorage.setItem(
            "wastePortalLoggedIn",
            "true"
        );


        message.innerText = "";


        setTimeout(function () {

            map.invalidateSize();

        }, 300);


        displayReports();

        updateStats();

        updateAnalytics();

    } else {

        message.innerText =
            "❌ Invalid username or password";

        message.style.color =
            "#dc3545";
    }
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    sessionStorage.removeItem(
        "wastePortalLoggedIn"
    );


    document.getElementById(
        "portalPage"
    ).style.display = "none";


    document.getElementById(
        "loginPage"
    ).style.display = "flex";


    document.getElementById(
        "username"
    ).value = "";

    document.getElementById(
        "password"
    ).value = "";

    document.getElementById(
        "loginMessage"
    ).innerText = "";
}


// =====================================================
// LOGIN CHECK
// =====================================================

function checkLogin() {

    const loggedIn =
        sessionStorage.getItem(
            "wastePortalLoggedIn"
        );


    if (loggedIn === "true") {

        document.getElementById(
            "loginPage"
        ).style.display = "none";

        document.getElementById(
            "portalPage"
        ).style.display = "block";

        setTimeout(function () {

            map.invalidateSize();

        }, 300);

    } else {

        document.getElementById(
            "loginPage"
        ).style.display = "flex";

        document.getElementById(
            "portalPage"
        ).style.display = "none";
    }
}


// =====================================================
// GET LOCATION
// =====================================================

function getLocation() {

    if (!navigator.geolocation) {

        document.getElementById(
            "location"
        ).innerText =
            "Location support இல்லை.";

        return;
    }


    document.getElementById(
        "location"
    ).innerText =
        "📍 Detecting location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            document.getElementById(
                "location"
            ).innerText =
                "Location: " +
                latitude.toFixed(6) +
                ", " +
                longitude.toFixed(6);


            map.setView(
                [
                    latitude,
                    longitude
                ],
                16
            );


            L.marker([
                latitude,
                longitude
            ])
                .addTo(map)
                .bindPopup(
                    "📍 Your Location"
                )
                .openPopup();
        },


        function () {

            document.getElementById(
                "location"
            ).innerText =
                "Location கிடைக்கவில்லை.";
        }
    );
}


// =====================================================
// PHOTO PREVIEW
// =====================================================

function previewPhoto() {

    const file =
        document.getElementById(
            "wastePhoto"
        ).files[0];

    const preview =
        document.getElementById(
            "photoPreview"
        );

    const container =
        document.getElementById(
            "photoPreviewContainer"
        );


    if (!file) {

        selectedPhoto = "";

        container.style.display =
            "none";

        preview.src = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function (event) {

        selectedPhoto =
            event.target.result;

        preview.src =
            selectedPhoto;

        container.style.display =
            "block";
    };


    reader.readAsDataURL(file);
}


// =====================================================
// SUBMIT REPORT
// =====================================================

function submitReport() {

    const wasteType =
        document.getElementById(
            "wasteType"
        ).value;

    const description =
        document.getElementById(
            "description"
        ).value.trim();


    if (wasteType === "") {

        alert(
            "Waste type select பண்ணுங்க."
        );

        return;
    }


    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "முதலில் Get My Location click பண்ணுங்க."
        );

        return;
    }


    const newReport = {

        id:
            Date.now(),

        wasteType:
            wasteType,

        description:
            description,

        latitude:
            latitude,

        longitude:
            longitude,

        date:
            new Date()
                .toLocaleString(),

        status:
            "Pending",

        photo:
            selectedPhoto
    };


    reports.push(newReport);


    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );


    addReportMarker(
        newReport
    );


    displayReports();

    updateStats();

    updateAnalytics();


    alert(
        "✅ Waste report successfully submitted!"
    );


    // Clear form

    document.getElementById(
        "wasteType"
    ).value = "";

    document.getElementById(
        "description"
    ).value = "";

    document.getElementById(
        "wastePhoto"
    ).value = "";

    document.getElementById(
        "location"
    ).innerText =
        "Location not detected";


    document.getElementById(
        "photoPreviewContainer"
    ).style.display =
        "none";

    document.getElementById(
        "photoPreview"
    ).src = "";


    selectedPhoto = "";

    latitude = null;

    longitude = null;
}


// =====================================================
// ADD MAP MARKER
// =====================================================

function addReportMarker(report) {

    const marker =
        L.marker([
            Number(report.latitude),
            Number(report.longitude)
        ])
        .addTo(map);


    marker.bindPopup(

        "<b>Waste Type:</b> " +
        report.wasteType +

        "<br><b>Description:</b> " +
        (
            report.description ||
            "No description"
        ) +

        "<br><b>Status:</b> " +
        report.status +

        "<br><b>Date:</b> " +
        report.date
    );
}


// =====================================================
// LOAD SAVED MARKERS
// =====================================================

function loadSavedReports() {

    reports.forEach(
        function (report) {

            addReportMarker(
                report
            );
        }
    );
}


// =====================================================
// STATUS CLASS
// =====================================================

function getStatusClass(status) {

    if (status === "Pending") {
        return "status-pending";
    }

    if (status === "In Progress") {
        return "status-progress";
    }

    return "status-collected";
}


// =====================================================
// DISPLAY REPORTS
// =====================================================

function displayReports() {

    const container =
        document.getElementById(
            "reports"
        );


    const search =
        document.getElementById(
            "searchReport"
        )?.value
        .toLowerCase()
        .trim() || "";


    const typeFilter =
        document.getElementById(
            "filterType"
        )?.value || "All";


    const statusFilter =
        document.getElementById(
            "filterStatus"
        )?.value || "All";


    const filteredReports =
        reports.filter(
            function (report) {

                const searchText = (

                    report.wasteType +
                    " " +
                    report.description +
                    " " +
                    report.date

                ).toLowerCase();


                const matchesSearch =
                    searchText.includes(
                        search
                    );


                const matchesType =
                    typeFilter === "All" ||
                    report.wasteType ===
                    typeFilter;


                const matchesStatus =
                    statusFilter === "All" ||
                    report.status ===
                    statusFilter;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus
                );
            }
        );


    container.innerHTML = "";


    if (
        filteredReports.length === 0
    ) {

        container.innerHTML =
            "<p>No matching reports found.</p>";

        return;
    }


    // Latest report first

    filteredReports
        .slice()
        .reverse()
        .forEach(
            function (report) {

                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "report-card";


                const photoHTML =
                    report.photo

                    ? `
                        <img
                            src="${report.photo}"
                            class="report-photo"
                            alt="Waste photo"
                        >
                      `

                    : `
                        <div class="report-photo">
                            📷 No Photo
                        </div>
                      `;


                card.innerHTML = `

                    <div>
                        ${photoHTML}
                    </div>

                    <div class="report-info">

                        <h3>
                            ${report.wasteType}
                        </h3>

                        <p>
                            <strong>
                                Description:
                            </strong>

                            ${
                                report.description ||
                                "No description"
                            }
                        </p>

                        <p>
                            <strong>
                                Location:
                            </strong>

                            ${Number(
                                report.latitude
                            ).toFixed(6)},

                            ${Number(
                                report.longitude
                            ).toFixed(6)}
                        </p>

                        <p>
                            <strong>
                                Date:
                            </strong>

                            ${report.date}
                        </p>

                        <p>
                            <strong>
                                Status:
                            </strong>

                            <span
                                class="status-badge
                                ${getStatusClass(
                                    report.status
                                )}">
                                ${getStatusIcon(
                                    report.status
                                )}
                                ${report.status}
                            </span>
                        </p>

                        <select
                            class="status-select"
                            onchange="
                                changeStatus(
                                    ${report.id},
                                    this.value
                                )
                            ">

                            <option
                                value="Pending"
                                ${
                                    report.status ===
                                    "Pending"
                                    ? "selected"
                                    : ""
                                }>
                                🔴 Pending
                            </option>

                            <option
                                value="In Progress"
                                ${
                                    report.status ===
                                    "In Progress"
                                    ? "selected"
                                    : ""
                                }>
                                🟡 In Progress
                            </option>

                            <option
                                value="Collected"
                                ${
                                    report.status ===
                                    "Collected"
                                    ? "selected"
                                    : ""
                                }>
                                🟢 Collected
                            </option>

                        </select>

                    </div>
                `;


                container.appendChild(
                    card
                );
            }
        );
}


// =====================================================
// STATUS ICON
// =====================================================

function getStatusIcon(status) {

    if (status === "Pending") {
        return "🔴";
    }

    if (status === "In Progress") {
        return "🟡";
    }

    return "🟢";
}


// =====================================================
// CHANGE STATUS
// =====================================================

function changeStatus(
    reportId,
    newStatus
) {

    const report =
        reports.find(
            function (item) {

                return item.id ===
                    reportId;
            }
        );


    if (!report) {
        return;
    }


    report.status =
        newStatus;


    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );


    displayReports();

    updateAnalytics();
}


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStats() {

    let plastic = 0;

    let organic = 0;

    let electronic = 0;


    reports.forEach(
        function (report) {

            if (
                report.wasteType ===
                "Plastic"
            ) {
                plastic++;
            }


            if (
                report.wasteType ===
                "Organic"
            ) {
                organic++;
            }


            if (
                report.wasteType ===
                "Electronic"
            ) {
                electronic++;
            }
        }
    );


    document.getElementById(
        "totalReports"
    ).innerText =
        reports.length;


    document.getElementById(
        "plasticCount"
    ).innerText =
        plastic;


    document.getElementById(
        "organicCount"
    ).innerText =
        organic;


    document.getElementById(
        "electronicCount"
    ).innerText =
        electronic;
}


// =====================================================
// ANALYTICS
// =====================================================

function updateAnalytics() {

    let plastic = 0;

    let organic = 0;

    let electronic = 0;

    let other = 0;


    let pending = 0;

    let inProgress = 0;

    let collected = 0;


    reports.forEach(
        function (report) {

            if (
                report.wasteType ===
                "Plastic"
            ) {
                plastic++;
            }

            else if (
                report.wasteType ===
                "Organic"
            ) {
                organic++;
            }

            else if (
                report.wasteType ===
                "Electronic"
            ) {
                electronic++;
            }

            else {
                other++;
            }


            if (
                report.status ===
                "Pending"
            ) {
                pending++;
            }

            else if (
                report.status ===
                "In Progress"
            ) {
                inProgress++;
            }

            else if (
                report.status ===
                "Collected"
            ) {
                collected++;
            }
        }
    );


    const wasteCanvas =
        document.getElementById(
            "wasteChart"
        );


    const statusCanvas =
        document.getElementById(
            "statusChart"
        );


    if (wasteChart) {
        wasteChart.destroy();
    }


    if (statusChart) {
        statusChart.destroy();
    }


    wasteChart =
        new Chart(
            wasteCanvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Plastic",
                        "Organic",
                        "Electronic",
                        "Other"
                    ],

                    datasets: [
                        {
                            data: [
                                plastic,
                                organic,
                                electronic,
                                other
                            ],

                            backgroundColor: [
                                "#2196f3",
                                "#4caf50",
                                "#9c27b0",
                                "#ff9800"
                            ]
                        }
                    ]
                },

                options: {
                    responsive: true,

                    plugins: {
                        legend: {
                            position: "bottom"
                        }
