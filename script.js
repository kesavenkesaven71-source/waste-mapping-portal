// =====================================================
// WASTE MAPPING PORTAL - MAIN JAVASCRIPT
// =====================================================


// =====================================================
// VARIABLES
// =====================================================

let latitude = null;
let longitude = null;

let selectedPhoto = "";

let reports =
    JSON.parse(localStorage.getItem("wasteReports")) || [];

let map = null;

let wasteChart = null;
let statusChart = null;


// =====================================================
// LOGIN
// =====================================================

function login() {

    const username =
        document.getElementById("username").value.trim();

    const password =
        document.getElementById("password").value.trim();

    const message =
        document.getElementById("loginMessage");


    if (
        username === "admin" &&
        password === "admin123"
    ) {

        document.getElementById("loginPage").style.display =
            "none";

        document.getElementById("portalPage").style.display =
            "block";

        sessionStorage.setItem(
            "wastePortalLoggedIn",
            "true"
        );

        message.innerText = "";

        initializePortal();

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

    document.getElementById("portalPage").style.display =
        "none";

    document.getElementById("loginPage").style.display =
        "flex";

    document.getElementById("username").value =
        "";

    document.getElementById("password").value =
        "";

    document.getElementById("loginMessage").innerText =
        "";
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

        document.getElementById("loginPage").style.display =
            "none";

        document.getElementById("portalPage").style.display =
            "block";

        initializePortal();

    } else {

        document.getElementById("loginPage").style.display =
            "flex";

        document.getElementById("portalPage").style.display =
            "none";
    }
}


// =====================================================
// INITIALIZE PORTAL
// =====================================================

function initializePortal() {

    initializeMap();

    displayReports();

    updateStats();

    updateAnalytics();

    loadSavedReports();
}


// =====================================================
// MAP INITIALIZATION
// =====================================================

function initializeMap() {

    if (map !== null) {

        setTimeout(function () {

            map.invalidateSize();

        }, 300);

        return;
    }


    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }


    map = L.map("map").setView(
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


    setTimeout(function () {

        map.invalidateSize();

    }, 300);
}


// =====================================================
// GET LOCATION
// =====================================================

function getLocation() {

    if (!navigator.geolocation) {

        document.getElementById("location").innerText =
            "❌ Location support இல்லை.";

        return;
    }


    document.getElementById("location").innerText =
        "📍 Detecting location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            document.getElementById("location").innerText =
                "📍 Location: " +
                latitude.toFixed(6) +
                ", " +
                longitude.toFixed(6);


            if (map === null) {
                initializeMap();
            }


            map.setView(
                [latitude, longitude],
                16
            );


            L.marker([
                latitude,
                longitude
            ])
                .addTo(map)
                .bindPopup(
                    "📍 Your Current Location"
                )
                .openPopup();

        },

        function (error) {

            let errorMessage =
                "❌ Location கிடைக்கவில்லை.";

            if (error.code === 1) {
                errorMessage =
                    "❌ Location permission denied.";
            }

            if (error.code === 2) {
                errorMessage =
                    "❌ Location unavailable.";
            }

            if (error.code === 3) {
                errorMessage =
                    "❌ Location request timed out.";
            }


            document.getElementById("location").innerText =
                errorMessage;
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
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


    if (!file.type.startsWith("image/")) {

        alert(
            "Please select an image file."
        );

        document.getElementById(
            "wastePhoto"
        ).value = "";

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
            "⚠️ Please select waste type."
        );

        return;
    }


    if (description === "") {

        alert(
            "⚠️ Please enter waste description."
        );

        return;
    }


    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "📍 முதலில் Get My Location click பண்ணுங்க."
        );

        return;
    }


    const newReport = {

        id: Date.now(),

        wasteType:
            wasteType,

        description:
            description,

        latitude:
            latitude,

        longitude:
            longitude,

        date:
            new Date().toLocaleString(),

        status:
            "Pending",

        photo:
            selectedPhoto
    };


    reports.push(
        newReport
    );


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


    clearReportForm();
}


// =====================================================
// CLEAR REPORT FORM
// =====================================================

function clearReportForm() {

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
// ADD REPORT MARKER
// =====================================================

function addReportMarker(report) {

    if (map === null) {
        initializeMap();
    }


    const marker =
        L.marker([
            Number(report.latitude),
            Number(report.longitude)
        ])
        .addTo(map);


    marker.bindPopup(`

        <b>🗑️ Waste Report</b>

        <br><br>

        <b>Waste Type:</b>
        ${escapeHTML(report.wasteType)}

        <br>

        <b>Description:</b>
        ${escapeHTML(
            report.description ||
            "No description"
        )}

        <br>

        <b>Status:</b>
        ${escapeHTML(report.status)}

        <br>

        <b>Date:</b>
        ${escapeHTML(report.date)}

    `);
}


// =====================================================
// LOAD SAVED REPORTS
// =====================================================

function loadSavedReports() {

    if (map === null) {
        return;
    }


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
// DISPLAY REPORTS
// =====================================================

function displayReports() {

    const container =
        document.getElementById(
            "reports"
        );


    if (!container) {
        return;
    }


    const searchElement =
        document.getElementById(
            "searchReport"
        );

    const typeElement =
        document.getElementById(
            "filterType"
        );

    const statusElement =
        document.getElementById(
            "filterStatus"
        );


    const search =
        searchElement
            ? searchElement.value
                .toLowerCase()
                .trim()
            : "";


    const typeFilter =
        typeElement
            ? typeElement.value
            : "All";


    const statusFilter =
        statusElement
            ? statusElement.value
            : "All";


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
                            ${escapeHTML(
                                report.wasteType
                            )}
                        </h3>

                        <p>

                            <strong>
                                Description:
                            </strong>

                            ${
                                escapeHTML(
                                    report.description ||
                                    "No description"
                                )
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

                            ${escapeHTML(
                                report.date
                            )}

                        </p>

                        <p>

                            <strong>
                                Status:
                            </strong>

                            <span
                                class="status-badge
                                ${getStatusClass(
                                    report.status
                                )}"
                            >

                                ${getStatusIcon(
                                    report.status
                                )}

                                ${escapeHTML(
                                    report.status
                                )}

                            </span>

                        </p>

                        <select
                            class="status-select"
                            data-report-id="${report.id}"
                        >

                            <option
                                value="Pending"
                                ${
                                    report.status ===
                                    "Pending"
                                        ? "selected"
                                        : ""
                                }
                            >
                                🔴 Pending
                            </option>

                            <option
                                value="In Progress"
                                ${
                                    report.status ===
                                    "In Progress"
                                        ? "selected"
                                        : ""
                                }
                            >
                                🟡 In Progress
                            </option>

                            <option
                                value="Collected"
                                ${
                                    report.status ===
                                    "Collected"
                                        ? "selected"
                                        : ""
                                }
                            >
                                🟢 Collected
                            </option>

                        </select>

                    </div>
                `;


                const statusSelect =
                    card.querySelector(
                        ".status-select"
                    );


                statusSelect.addEventListener(
                    "change",
                    function () {

                        changeStatus(
                            report.id,
                            this.value
                        );
                    }
                );


                container.appendChild(
                    card
                );
            }
        );
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

                return Number(item.id) ===
                    Number(reportId);
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

    updateStats();

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

    const wasteCanvas =
        document.getElementById(
            "wasteChart"
        );

    const statusCanvas =
        document.getElementById(
            "statusChart"
        );


    if (
        !wasteCanvas ||
        !statusCanvas
    ) {
        return;
    }


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

                    maintainAspectRatio: true,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }
                    }
                }
            }
        );


    statusChart =
        new Chart(
            statusCanvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Pending",
                        "In Progress",
                        "Collected"
                    ],

                    datasets: [
                        {
                            data: [
                                pending,
                                inProgress,
                                collected
                            ],

                            backgroundColor: [
                                "#dc3545",
                                "#ffc107",
                                "#28a745"
                            ]
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: true,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }
                    }
                }
            }
        );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


// =====================================================
// PAGE LOAD
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        checkLogin();

    }
);
