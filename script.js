// =====================================================
// WASTE MAPPING PORTAL - MAIN JAVASCRIPT
// =====================================================

// =====================================================
// VARIABLES
// =====================================================

let latitude = null;
let longitude = null;

let selectedPhoto = "";

let reports = JSON.parse(
    localStorage.getItem("wasteReports")
) || [];

let map = null;

let wasteChart = null;
let statusChart = null;

let reportMarkers = [];


// =====================================================
// INITIALIZE PORTAL
// =====================================================

function initializePortal() {

    // Initialize map only once
    if (!map) {
        initializeMap();
    }

    // Load reports
    displayReports();
    updateStats();
    updateAnalytics();
    loadSavedMarkers();

    // Fix Leaflet map size
    setTimeout(function () {
        if (map) {
            map.invalidateSize();
        }
    }, 300);
}


// =====================================================
// MAP INITIALIZATION
// =====================================================

function initializeMap() {

    if (map) {
        return;
    }

    const mapElement = document.getElementById("map");

    if (!mapElement) {
        console.error("Map element not found.");
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
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);
}


// =====================================================
// GET LOCATION
// =====================================================

function getLocation() {

    if (!navigator.geolocation) {

        document.getElementById("location").innerText =
            "❌ Location support is not available.";

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

            if (!map) {
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
            .bindPopup("📍 Your Current Location")
            .openPopup();
        },

        function (error) {

            console.error(
                "Location error:",
                error
            );

            document.getElementById("location").innerText =
                "❌ Location could not be detected.";
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
        document.getElementById("wastePhoto").files[0];

    const preview =
        document.getElementById("photoPreview");

    const container =
        document.getElementById(
            "photoPreviewContainer"
        );

    if (!file) {

        selectedPhoto = "";

        container.style.display = "none";

        preview.src = "";

        return;
    }

    if (!file.type.startsWith("image/")) {

        alert("Please select an image file.");

        document.getElementById("wastePhoto").value = "";

        return;
    }

    const reader = new FileReader();

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
// SUBMIT WASTE REPORT
// =====================================================

function submitReport() {

    const wasteType =
        document.getElementById("wasteType").value;

    const description =
        document.getElementById("description")
            .value
            .trim();

    // Check waste type
    if (wasteType === "") {

        alert(
            "⚠️ Please select a waste type."
        );

        return;
    }

    // Check location
    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "📍 Please click 'Get My Location' first."
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

    // Add report
    reports.push(newReport);

    // Save report
    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );

    // Add marker
    addReportMarker(newReport);

    // Update dashboard
    displayReports();
    updateStats();
    updateAnalytics();

    alert(
        "✅ Waste report successfully submitted!"
    );

    // Clear form
    document.getElementById("wasteType").value = "";

    document.getElementById("description").value = "";

    document.getElementById("wastePhoto").value = "";

    document.getElementById("location").innerText =
        "Location not detected";

    document.getElementById(
        "photoPreviewContainer"
    ).style.display = "none";

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

    if (!map) {
        initializeMap();
    }

    const lat =
        Number(report.latitude);

    const lng =
        Number(report.longitude);

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {
        return;
    }

    const marker =
        L.marker([lat, lng])
        .addTo(map);

    marker.bindPopup(
        "<b>♻️ Waste Type:</b> " +
        escapeHTML(report.wasteType) +

        "<br><b>📝 Description:</b> " +
        escapeHTML(
            report.description ||
            "No description"
        ) +

        "<br><b>📊 Status:</b> " +
        escapeHTML(report.status) +

        "<br><b>📅 Date:</b> " +
        escapeHTML(report.date)
    );

    reportMarkers.push(marker);
}


// =====================================================
// LOAD SAVED MARKERS
// =====================================================

function loadSavedMarkers() {

    if (!map) {
        initializeMap();
    }

    // Remove old markers
    reportMarkers.forEach(
        function (marker) {

            map.removeLayer(marker);

        }
    );

    reportMarkers = [];

    reports.forEach(
        function (report) {

            addReportMarker(report);

        }
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value == null ? "" : String(value);

    return div.innerHTML;
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

    if (status === "Collected") {
        return "status-collected";
    }

    return "status-pending";
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

    if (status === "Collected") {
        return "🟢";
    }

    return "⚪";
}


// =====================================================
// DISPLAY REPORTS
// =====================================================

function displayReports() {

    const container =
        document.getElementById("reports");

    if (!container) {
        return;
    }

    const searchElement =
        document.getElementById("searchReport");

    const typeElement =
        document.getElementById("filterType");

    const statusElement =
        document.getElementById("filterStatus");

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

                )
                .toLowerCase();

                const matchesSearch =
                    searchText.includes(search);

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


    if (filteredReports.length === 0) {

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
                    document.createElement("div");

                card.className =
                    "report-card";


                // Photo
                let photoHTML = "";

                if (report.photo) {

                    photoHTML = `
                        <img
                            src="${report.photo}"
                            class="report-photo"
                            alt="Waste photo"
                        >
                    `;

                } else {

                    photoHTML = `
                        <div class="report-photo">
                            📷 No Photo
                        </div>
                    `;
                }


                const lat =
                    Number(report.latitude);

                const lng =
                    Number(report.longitude);


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

                            ${
                                Number.isFinite(lat)
                                    ? lat.toFixed(6)
                                    : "N/A"
                            },

                            ${
                                Number.isFinite(lng)
                                    ? lng.toFixed(6)
                                    : "N/A"
                            }
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
                                )}">

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
                            data-report-id="${report.id}">

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


                container.appendChild(card);

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

    // Refresh markers
    loadSavedMarkers();
}


// =====================================================
// UPDATE DASHBOARD STATISTICS
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


    const totalElement =
        document.getElementById(
            "totalReports"
        );

    const plasticElement =
        document.getElementById(
            "plasticCount"
        );

    const organicElement =
        document.getElementById(
            "organicCount"
        );

    const electronicElement =
        document.getElementById(
            "electronicCount"
        );


    if (totalElement) {
        totalElement.innerText =
            reports.length;
    }

    if (plasticElement) {
        plasticElement.innerText =
            plastic;
    }

    if (organicElement) {
        organicElement.innerText =
            organic;
    }

    if (electronicElement) {
        electronicElement.innerText =
            electronic;
    }
}


// =====================================================
// UPDATE ANALYTICS
// =====================================================

function updateAnalytics() {

    // Check Chart.js
    if (typeof Chart === "undefined") {

        console.error(
            "Chart.js is not loaded."
        );

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

            // Waste type
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


            // Status
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


    if (
        !wasteCanvas ||
        !statusCanvas
    ) {    
       return;
    }


    // Destroy old charts

    if (wasteChart) {

        wasteChart.destroy();

        wasteChart = null;
    }


    if (statusChart) {

        statusChart.destroy();

        statusChart = null;
    }


    // =================================================
    // WASTE TYPE CHART
    // =================================================

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
                            ],

                            borderWidth: 2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }
                }
            }
        );


    // =================================================
    // STATUS CHART
    // =================================================

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
                            ],

                            borderWidth: 2
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

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
// PAGE LOAD
// =====================================================

window.addEventListener(
    "DOMContentLoaded",
    function () {

        const loggedIn =
            sessionStorage.getItem(
                "loggedIn"
            );


        // If already logged in
        if (loggedIn === "true") {

            const loginPage =
                document.getElementById(
                    "loginPage"
                );

            const portalPage =
                document.getElementById(
                    "portalPage"
                );


            loginPage.style.display =
                "none";

            portalPage.style.display =
                "block";


            initializePortal();

        }

    }
);
