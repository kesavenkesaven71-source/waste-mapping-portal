/* =====================================================
   SMART WASTE MANAGEMENT PORTAL
   ===================================================== */


/* ================= GLOBAL VARIABLES ================= */

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

let portalInitialized = false;


/* ================= INITIALIZE PORTAL ================= */

function initializePortal() {

    if (portalInitialized) {

        updateStats();
        displayReports();
        updateAnalytics();

        return;
    }

    portalInitialized = true;

    initializeMap();

    updateStats();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

}


/* ================= MAP ================= */

function initializeMap() {

    if (map !== null) {
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
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);

}


/* ================= GET LOCATION ================= */

function getLocation() {

    if (!navigator.geolocation) {

        alert(
            "❌ Geolocation is not supported by your browser."
        );

        return;
    }


    const locationText =
        document.getElementById("locationText");

    locationText.textContent =
        "📡 Getting location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            locationText.textContent =
                `📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;


            if (map) {

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

            }

        },

        function () {

            locationText.textContent =
                "❌ Unable to get location.";

            alert(
                "Please allow location permission."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}


/* ================= PHOTO PREVIEW ================= */

function previewPhoto(event) {

    const file =
        event.target.files[0];

    const preview =
        document.getElementById("photoPreview");


    if (!file) {

        selectedPhoto = "";

        preview.classList.add("hidden");

        preview.src = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function (e) {

        selectedPhoto = e.target.result;

        preview.src = selectedPhoto;

        preview.classList.remove("hidden");

    };


    reader.readAsDataURL(file);

}


/* ================= SUBMIT REPORT ================= */

function submitReport(event) {

    event.preventDefault();


    const type =
        document.getElementById("wasteType").value;

    const description =
        document.getElementById("description").value.trim();


    if (!type) {

        alert("Please select waste type.");

        return;
    }


    if (!description) {

        alert("Please enter description.");

        return;
    }


    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "Please get your location before submitting."
        );

        return;
    }


    const report = {

        id: Date.now(),

        type: type,

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


    addReportMarker(report);


    updateStats();

    displayReports();

    updateAnalytics();


    document.getElementById(
        "reportForm"
    ).reset();


    document.getElementById(
        "photoPreview"
    ).classList.add("hidden");


    document.getElementById(
        "photoPreview"
    ).src = "";


    document.getElementById(
        "locationText"
    ).textContent =
        "Location not selected";


    selectedPhoto = "";

    latitude = null;

    longitude = null;


    alert(
        "✅ Waste report submitted successfully!"
    );

}


/* ================= WASTE ICON ================= */

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

    return "📋";

}


/* ================= ADD MAP MARKER ================= */

function addReportMarker(report) {

    if (!map) {
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
                    getWasteIcon(report.type)
            }
        )
        .addTo(map);


    const popupHTML = `

        <div class="map-popup">

            <h3>
                ${escapeHTML(report.type)} Waste
            </h3>

            <p>
                <strong>Status:</strong>
                ${getStatusIcon(report.status)}
                ${escapeHTML(report.status)}
            </p>

            <p>
                ${escapeHTML(report.description)}
            </p>

            <p>
                <small>
                    ${escapeHTML(report.createdAt)}
                </small>
            </p>

        </div>

    `;


    marker.bindPopup(popupHTML);


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


    reportMarkers.forEach(item => {

        map.removeLayer(item.marker);

    });


    reportMarkers = [];


    reports.forEach(report => {

        addReportMarker(report);

    });

}


/* ================= ESCAPE HTML ================= */

function escapeHTML(value) {

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


    const search =
        document.getElementById(
            "searchInput"
        ).value
        .toLowerCase()
        .trim();


    const typeFilter =
        document.getElementById(
            "typeFilter"
        ).value;


    const statusFilter =
        document.getElementById(
            "statusFilter"
        ).value;


    const filteredReports =
        reports.filter(report => {

            const matchesSearch =

                report.type
                    .toLowerCase()
                    .includes(search)

                ||

                report.description
                    .toLowerCase()
                    .includes(search);


            const matchesType =

                typeFilter === "All" ||

                report.type === typeFilter;


            const matchesStatus =

                statusFilter === "All" ||

                report.status === statusFilter;


            return (

                matchesSearch &&
                matchesType &&
                matchesStatus

            );

        });


    if (filteredReports.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div>
                    📭
                </div>

                <h3>
                    No Reports Found
                </h3>

                <p>
                    Try changing your search or filters.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        filteredReports.map(report => `

        <div class="report-card">

            <div class="report-header">

                <h3>
                    ${getStatusIcon(report.status)}
                    ${escapeHTML(report.type)} Waste
                </h3>

                <span class="
                    report-status
                    ${getStatusClass(report.status)}
                ">
                    ${escapeHTML(report.status)}
                </span>

            </div>


            ${
                report.photo
                ?
                `
                    <img
                        src="${report.photo}"
                        class="report-image"
                        alt="Waste photo"
                    >
                `
                :
                `
                    <div class="no-image">
                        📷 No Photo
                    </div>
                `
            }


            <p class="report-description">

                ${escapeHTML(report.description)}

            </p>


            <div class="report-details">

                <p>
                    📍
                    ${report.latitude.toFixed(5)},
                    ${report.longitude.toFixed(5)}
                </p>

                <p>
                    🕒
                    ${escapeHTML(report.createdAt)}
                </p>

            </div>


            <div class="report-actions">

                <button
                    class="map-btn"
                    onclick="focusReportOnMap(${report.id})"
                >
                    📍 View on Map
                </button>


                <select
                    onchange="
                        changeStatus(
                            ${report.id},
                            this.value
                        )
                    "
                >

                    <option
                        value="Pending"
                        ${report.status === "Pending"
                            ? "selected"
                            : ""}
                    >
                        ⏳ Pending
                    </option>


                    <option
                        value="In Progress"
                        ${report.status === "In Progress"
                            ? "selected"
                            : ""}
                    >
                        🚛 In Progress
                    </option>


                    <option
                        value="Collected"
                        ${report.status === "Collected"
                            ? "selected"
                            : ""}
                    >
                        ✅ Collected
                    </option>

                </select>

            </div>

        </div>

    `).join("");

}


/* ================= FOCUS REPORT ON MAP ================= */

function focusReportOnMap(reportId) {

    const report =
        reports.find(
            r => r.id === reportId
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
            item => item.id === reportId
        );


    if (markerData) {

        markerData.marker.openPopup();

    }

}


/* ================= CHANGE STATUS ================= */

function changeStatus(
    reportId,
    newStatus
) {

    const report =
        reports.find(
            r => r.id === reportId
        );


    if (!report) {
        return;
    }


    report.status = newStatus;


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


    const pending =
        reports.filter(
            r => r.status === "Pending"
        ).length;


    const inProgress =
        reports.filter(
            r => r.status === "In Progress"
        ).length;


    const collected =
        reports.filter(
            r => r.status === "Collected"
        ).length;


    document.getElementById(
        "totalReports"
    ).textContent = total;


    document.getElementById(
        "plasticCount"
    ).textContent = plastic;


    document.getElementById(
        "organicCount"
    ).textContent = organic;


    document.getElementById(
        "electronicCount"
    ).textContent = electronic;


    document.getElementById(
        "pendingCount"
    ).textContent = pending;


    document.getElementById(
        "progressCount"
    ).textContent = inProgress;


    document.getElementById(
        "collectedCount"
    ).textContent = collected;

}


/* ================= ANALYTICS ================= */

function updateAnalytics() {

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


    /* Waste Chart */

    const wasteCanvas =
        document.getElementById(
            "wasteChart"
        );


    if (wasteCanvas) {

        if (wasteChart) {

            wasteChart.destroy();

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

                        maintainAspectRatio: false

                    }

                }

            );

    }


    /* Status Chart */

    const statusCanvas =
        document.getElementById(
            "statusChart"
        );


    if (statusCanvas) {

        if (statusChart) {

            statusChart.destroy();

        }


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
                                    "Reports",

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

                                beginAtZero: true,

                                ticks: {

                                    precision: 0

                                }

                            }

                        }

                    }

                }

            );

    }

}


/* ================= DOM EVENTS ================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const locationBtn =
            document.getElementById(
                "locationBtn"
            );


        const photoInput =
            document.getElementById(
                "photo"
            );


        const reportForm =
            document.getElementById(
                "reportForm"
            );


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        const typeFilter =
            document.getElementById(
                "typeFilter"
            );


        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        if (locationBtn) {

            locationBtn.addEventListener(
                "click",
                getLocation
            );

        }


        if (photoInput) {

            photoInput.addEventListener(
                "change",
                previewPhoto
            );

        }


        if (reportForm) {

            reportForm.addEventListener(
                "submit",
                submitReport
            );

        }


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                displayReports
            );

        }


        if (typeFilter) {

            typeFilter.addEventListener(
                "change",
                displayReports
            );

        }


        if (statusFilter) {

            statusFilter.addEventListener(
                "change",
                displayReports
            );

        }
