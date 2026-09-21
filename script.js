/* =========================================================
   WASTE MAPPING PORTAL - MAIN JAVASCRIPT
   ========================================================= */


/* ================= GLOBAL VARIABLES ================= */

let latitude = null;
let longitude = null;

let selectedPhoto = "";

let reports =
    JSON.parse(localStorage.getItem("wasteReports")) || [];

let map = null;

let wasteChart = null;
let statusChart = null;

let reportMarkers = [];


/* ================= INITIALIZE PORTAL ================= */

function initializePortal() {

    initializeMap();

    updateStats();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

}


/* ================= INITIALIZE MAP ================= */

function initializeMap() {

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        return;
    }


    // Prevent map from initializing twice
    if (map !== null) {

        setTimeout(() => {
            map.invalidateSize();
        }, 200);

        return;
    }


    // Default location: Madurai
    map = L.map("map").setView(
        [9.9252, 78.1198],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    setTimeout(() => {
        map.invalidateSize();
    }, 300);
}


/* ================= GET LOCATION ================= */

function getLocation() {

    const locationStatus =
        document.getElementById("locationStatus");


    if (!navigator.geolocation) {

        locationStatus.textContent =
            "❌ Geolocation not supported";

        return;
    }


    locationStatus.textContent =
        "📍 Getting location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            locationStatus.textContent =
                `📍 Location detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;


            if (map) {

                map.setView(
                    [latitude, longitude],
                    16
                );


                L.marker(
                    [latitude, longitude]
                )
                    .addTo(map)
                    .bindPopup(
                        "📍 Your Current Location"
                    )
                    .openPopup();
            }

        },

        function () {

            locationStatus.textContent =
                "❌ Unable to get location";

        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }

    );
}


/* ================= PHOTO PREVIEW ================= */

function previewPhoto() {

    const fileInput =
        document.getElementById("wastePhoto");

    const preview =
        document.getElementById("photoPreview");


    if (
        !fileInput ||
        !fileInput.files ||
        !fileInput.files[0]
    ) {

        selectedPhoto = "";

        preview.style.display = "none";

        return;
    }


    const file =
        fileInput.files[0];


    const reader =
        new FileReader();


    reader.onload = function (event) {

        selectedPhoto =
            event.target.result;

        preview.src =
            selectedPhoto;

        preview.style.display =
            "block";
    };


    reader.readAsDataURL(file);
}


/* ================= SUBMIT REPORT ================= */

function submitReport(event) {

    event.preventDefault();


    const wasteType =
        document.getElementById("wasteType").value;

    const description =
        document.getElementById("description").value.trim();


    if (!wasteType) {

        alert("Please select a waste type.");

        return;
    }


    if (!description) {

        alert("Please enter a description.");

        return;
    }


    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "Please click 'Get My Location' before submitting."
        );

        return;
    }


    const report = {

        id: Date.now(),

        type: wasteType,

        description: description,

        latitude: latitude,

        longitude: longitude,

        photo: selectedPhoto,

        status: "Pending",

        createdAt:
            new Date().toLocaleString()

    };


    reports.unshift(report);


    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );


    // Add marker
    addReportMarker(report);


    // Update dashboard
    updateStats();

    displayReports();

    updateAnalytics();


    // Reset form
    document.querySelector("form").reset();


    selectedPhoto = "";

    latitude = null;

    longitude = null;


    document.getElementById(
        "photoPreview"
    ).style.display = "none";


    document.getElementById(
        "locationStatus"
    ).textContent =
        "Location not selected";


    alert(
        "✅ Waste report submitted successfully!"
    );
}


/* ================= WASTE MARKER ================= */

function getWasteIcon(type) {

    let emoji = "⚫";


    if (type === "Plastic") {

        emoji = "🔵";

    }

    else if (type === "Organic") {

        emoji = "🟢";

    }

    else if (type === "Electronic") {

        emoji = "🟣";

    }

    else {

        emoji = "⚫";

    }


    return L.divIcon({

        className:
            "custom-waste-marker",

        html: `
            <div class="waste-marker">
                ${emoji}
            </div>
        `,

        iconSize: [35, 35],

        iconAnchor: [17, 17],

        popupAnchor: [0, -17]

    });
}


/* ================= STATUS ICON ================= */

function getStatusIcon(status) {

    if (status === "Pending") {
        return "⏳";
    }

    if (status === "In Progress") {
        return "🚛";
    }

    if (status === "Collected") {
        return "✅";
    }

    return "📌";
}


/* ================= ADD REPORT MARKER ================= */

function addReportMarker(report) {

    if (!map) {
        return;
    }


    if (
        report.latitude === null ||
        report.longitude === null
    ) {
        return;
    }


    const marker =
        L.marker(
            [
                report.latitude,
                report.longitude
            ],
            {
                icon:
                    getWasteIcon(
                        report.type
                    )
            }
        ).addTo(map);


    const popupContent = `

        <div style="min-width:200px">

            <h3>
                ${getStatusIcon(report.status)}
                ${escapeHTML(report.type)}
            </h3>

            <p>
                <strong>Description:</strong><br>
                ${escapeHTML(report.description)}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(report.status)}
            </p>

            <p>
                <strong>Reported:</strong><br>
                ${escapeHTML(report.createdAt)}
            </p>

        </div>

    `;


    marker
        .bindPopup(popupContent);


    reportMarkers.push({

        id: report.id,

        marker: marker

    });
}


/* ================= LOAD SAVED MARKERS ================= */

function loadSavedMarkers() {

    if (!map) {
        return;
    }


    // Clear existing markers
    reportMarkers.forEach(
        function (item) {

            map.removeLayer(
                item.marker
            );

        }
    );


    reportMarkers = [];


    reports.forEach(
        function (report) {

            addReportMarker(report);

        }
    );
}


/* ================= ESCAPE HTML ================= */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


/* ================= STATUS CLASS ================= */

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


    return "";
}


/* ================= DISPLAY REPORTS ================= */

function displayReports() {

    const container =
        document.getElementById(
            "reportsContainer"
        );


    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "searchReport"
        );


    const typeFilter =
        document.getElementById(
            "filterType"
        );


    const statusFilter =
        document.getElementById(
            "filterStatus"
        );


    const searchText =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const selectedType =
        typeFilter
            ? typeFilter.value
            : "All";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "All";


    const filteredReports =
        reports.filter(
            function (report) {


                const matchesSearch =

                    report.type
                        .toLowerCase()
                        .includes(searchText)

                    ||

                    report.description
                        .toLowerCase()
                        .includes(searchText);


                const matchesType =

                    selectedType === "All"

                    ||

                    report.type ===
                        selectedType;


                const matchesStatus =

                    selectedStatus === "All"

                    ||

                    report.status ===
                        selectedStatus;


                return (
                    matchesSearch &&
                    matchesType &&
                    matchesStatus
                );

            }
        );


    if (filteredReports.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>📭 No reports found</h3>

                <p>
                    No waste reports match
                    your current filters.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        filteredReports
            .map(
                function (report) {


                    const imageHTML =
                        report.photo

                            ? `
                                <img
                                    src="${report.photo}"
                                    class="report-image"
                                    alt="Waste Photo"
                                >
                              `

                            : `
                                <div class="no-image">
                                    📷
                                    <br>
                                    No Photo
                                </div>
                              `;


                    return `

                        <div
                            class="report-card"
                            id="report-${report.id}"
                        >

                            ${imageHTML}


                            <div class="report-info">

                                <h3>
                                    ${getStatusIcon(report.status)}
                                    ${escapeHTML(report.type)}
                                </h3>


                                <p>
                                    <strong>Description:</strong>
                                    ${escapeHTML(report.description)}
                                </p>


                                <p>
                                    <strong>Location:</strong>
                                    ${Number(report.latitude).toFixed(5)},
                                    ${Number(report.longitude).toFixed(5)}
                                </p>


                                <p>
                                    <strong>Reported:</strong>
                                    ${escapeHTML(report.createdAt)}
                                </p>


                                <span
                                    class="status-badge
                                    ${getStatusClass(report.status)}"
                                >
                                    ${escapeHTML(report.status)}
                                </span>


                                <br>


                                <button
                                    class="status-btn"
                                    onclick="changeStatus(${report.id})"
                                >
                                    🔄 Change Status
                                </button>


                                <button
                                    class="map-btn"
                                    onclick="focusReportOnMap(${report.id})"
                                >
                                    📍 View on Map
                                </button>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}


/* ================= FOCUS REPORT ON MAP ================= */

function focusReportOnMap(reportId) {

    const report =
        reports.find(
            function (item) {

                return item.id === reportId;

            }
        );


    if (!report || !map) {
        return;
    }


    map.setView(

        [
            report.latitude,
            report.longitude
        ],

        17

    );


    const markerData =
        reportMarkers.find(
            function (item) {

                return item.id === reportId;

            }
        );


    if (markerData) {

        markerData.marker.openPopup();

    }


    const mapElement =
        document.getElementById("map");


    if (mapElement) {

        mapElement.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });

    }
}


/* ================= CHANGE STATUS ================= */

function changeStatus(reportId) {

    const report =
        reports.find(
            function (item) {

                return item.id === reportId;

            }
        );


    if (!report) {
        return;
    }


    if (report.status === "Pending") {

        report.status =
            "In Progress";

    }

    else if (
        report.status === "In Progress"
    ) {

        report.status =
            "Collected";

    }

    else {

        report.status =
            "Pending";

    }


    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );


    updateStats();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

}


/* ================= UPDATE STATS ================= */

function updateStats() {

    const total =
        reports.length;


    const plastic =
        reports.filter(
            function (report) {

                return report.type === "Plastic";

            }
        ).length;


    const organic =
        reports.filter(
            function (report) {

                return report.type === "Organic";

            }
        ).length;


    const electronic =
        reports.filter(
            function (report) {

                return report.type === "Electronic";

            }
        ).length;


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

        totalElement.textContent =
            total;

    }


    if (plasticElement) {

        plasticElement.textContent =
            plastic;

    }


    if (organicElement) {

        organicElement.textContent =
            organic;

    }


    if (electronicElement) {

        electronicElement.textContent =
            electronic;

    }
}


/* ================= ANALYTICS ================= */

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
        !statusCanvas ||
        typeof Chart === "undefined"
    ) {

        return;
    }


    const plastic =
        reports.filter(
            r => r.type === "Plastic"
        ).length;


    const organic =
        reports.filter(
            r => r.type === "Organic"
        ).length;


    const electronic =
        reports.filter(
            r => r.type === "Electronic"
        ).length;


    const other =
        reports.filter(
            r => r.type === "Other"
        ).length;


    const pending =
        reports.filter(
            r => r.status === "Pending"
        ).length;


    const progress =
        reports.filter(
            r => r.status === "In Progress"
        ).length;


    const collected =
        reports.filter(
            r => r.status === "Collected"
        ).length;


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
                            ]

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


    statusChart =
        new Chart(
            statusCanvas,
            {

                type: "bar",

                data: {

                    labels: [
                        "Pending",
                        "In Progress",
                        "Collected"
                    ],

                    datasets: [

                        {

                            label:
                                "Number of Reports",

                            data: [
                                pending,
                                progress,
                                collected
                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {

                            beginAtZe
