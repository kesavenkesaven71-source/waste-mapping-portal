/* =====================================================
   WASTE MAPPING PORTAL
   STEP 3.3 - WASTE HEATMAP
===================================================== */


/* ================= GLOBAL VARIABLES ================= */

let latitude = null;
let longitude = null;

let selectedPhoto = null;

let reports =
    JSON.parse(localStorage.getItem("wasteReports")) || [];

let map = null;

let heatLayer = null;

let heatmapEnabled = true;

let wasteChart = null;
let statusChart = null;

let reportMarkers = [];

let currentLocationMarker = null;

let portalInitialized = false;


/* ================= INITIALIZE PORTAL ================= */

function initializePortal() {

    if (portalInitialized) {

        updateStats();
        displayReports();
        updateAnalytics();
        loadSavedMarkers();
        updateHeatmap();

        return;
    }


    portalInitialized = true;


    initializeMap();

    updateStats();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

    updateHeatmap();

}


/* ================= INITIALIZE MAP ================= */

function initializeMap() {

    if (map) {
        return;
    }


    /*
     * Default location:
     * Madurai, Tamil Nadu
     */
    map = L.map("map").setView(
        [9.9252, 78.1198],
        12
    );


    /*
     * OpenStreetMap tiles
     */
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);


    /*
     * Small map control
     */
    L.control.scale().addTo(map);

}


/* ================= GET LOCATION ================= */

function getLocation() {

    const status =
        document.getElementById("locationStatus");


    if (!navigator.geolocation) {

        status.textContent =
            "❌ Geolocation is not supported.";

        return;
    }


    status.textContent =
        "📍 Getting your location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            document.getElementById("latitude").value =
                latitude;

            document.getElementById("longitude").value =
                longitude;


            status.textContent =
                `✅ Location selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;


            /*
             * Move map
             */
            if (map) {

                map.setView(
                    [latitude, longitude],
                    16
                );


                /*
                 * Remove previous location marker
                 */
                if (currentLocationMarker) {

                    map.removeLayer(
                        currentLocationMarker
                    );

                }


                /*
                 * Add current location marker
                 */
                currentLocationMarker =
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

        function (error) {

            let message =
                "❌ Unable to get location.";

            if (error.code === 1) {
                message =
                    "❌ Location permission denied.";
            }

            if (error.code === 2) {
                message =
                    "❌ Location unavailable.";
            }

            if (error.code === 3) {
                message =
                    "❌ Location request timed out.";
            }

            status.textContent = message;

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

        selectedPhoto = null;

        preview.innerHTML = "";

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function (e) {

        selectedPhoto =
            e.target.result;


        preview.innerHTML = `
            <img
                src="${selectedPhoto}"
                alt="Waste preview"
            >
        `;

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


    /*
     * Validate waste type
     */
    if (!wasteType) {

        alert("Please select a waste type.");

        return;
    }


    /*
     * Validate description
     */
    if (!description) {

        alert("Please enter a description.");

        return;
    }


    /*
     * Validate location
     */
    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "Please get your location before submitting the report."
        );

        return;
    }


    const report = {

        id:
            Date.now().toString(),

        type:
            wasteType,

        description:
            description,

        latitude:
            latitude,

        longitude:
            longitude,

        photo:
            selectedPhoto,

        status:
            "Pending",

        createdAt:
            new Date().toLocaleString()

    };


    /*
     * Add report
     */
    reports.unshift(report);


    /*
     * Save
     */
    saveReports();


    /*
     * Reset form
     */
    document.getElementById("reportForm").reset();


    document.getElementById("photoPreview")
        .innerHTML = "";


    document.getElementById("locationStatus")
        .textContent =
        "Location not selected";


    selectedPhoto = null;

    latitude = null;
    longitude = null;


    document.getElementById("latitude").value = "";
    document.getElementById("longitude").value = "";


    /*
     * Refresh everything
     */
    updateStats();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

    updateHeatmap();


    alert(
        "✅ Waste report submitted successfully!"
    );

}


/* ================= SAVE REPORTS ================= */

function saveReports() {

    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );

}


/* ================= WASTE ICON ================= */

function getWasteIcon(type) {

    let emoji = "⚫";


    if (type === "Plastic") {

        emoji = "🔵";

    } else if (type === "Organic") {

        emoji = "🟢";

    } else if (type === "Electronic") {

        emoji = "🟣";

    }


    return L.divIcon({

        className:
            "custom-waste-marker",

        html: `
            <div class="waste-marker">
                ${emoji}
            </div>
        `,

        iconSize:
            [35, 35],

        iconAnchor:
            [17, 17],

        popupAnchor:
            [0, -17]

    });

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
                Number(report.latitude),
                Number(report.longitude)
            ],
            {
                icon:
                    getWasteIcon(report.type)
            }
        );


    const photoHTML =
        report.photo
            ? `
                <img
                    src="${report.photo}"
                    class="popup-photo"
                    alt="Waste photo"
                >
            `
            : "";


    marker.bindPopup(`

        <div class="map-popup">

            <h3>
                ${getWasteEmoji(report.type)}
                ${escapeHTML(report.type)} Waste
            </h3>

            ${photoHTML}

            <p>
                <strong>Description:</strong><br>
                ${escapeHTML(report.description)}
            </p>

            <p>
                <strong>Status:</strong>
                <span class="popup-status">
                    ${getStatusEmoji(report.status)}
                    ${escapeHTML(report.status)}
                </span>
            </p>

            <p>
                <strong>Reported:</strong><br>
                ${escapeHTML(report.createdAt)}
            </p>

        </div>

    `);


    reportMarkers.push({

        id:
            report.id,

        marker:
            marker

    });


    marker.addTo(map);

}


/* ================= LOAD SAVED MARKERS ================= */

function loadSavedMarkers() {

    if (!map) {
        return;
    }


    /*
     * Remove old markers
     */
    reportMarkers.forEach(function (item) {

        if (map.hasLayer(item.marker)) {

            map.removeLayer(item.marker);

        }

    });


    reportMarkers = [];


    /*
     * Add new markers
     */
    reports.forEach(function (report) {

        addReportMarker(report);

    });


    /*
     * Apply current filters
     */
    filterMapMarkers();

}


/* ================= MAP FILTER ================= */

function filterMapMarkers() {

    if (!map) {
        return;
    }


    const typeFilter =
        document.getElementById(
            "mapTypeFilter"
        )?.value || "All";


    const statusFilter =
        document.getElementById(
            "mapStatusFilter"
        )?.value || "All";


    reportMarkers.forEach(function (item) {

        const report =
            reports.find(
                function (r) {
                    return r.id === item.id;
                }
            );


        if (!report) {
            return;
        }


        const typeMatch =
            typeFilter === "All" ||
            report.type === typeFilter;


        const statusMatch =
            statusFilter === "All" ||
            report.status === statusFilter;


        if (
            typeMatch &&
            statusMatch
        ) {

            if (
                !map.hasLayer(item.marker)
            ) {

                item.marker.addTo(map);

            }

        } else {

            if (
                map.hasLayer(item.marker)
            ) {

                map.removeLayer(
                    item.marker
                );

            }

        }

    });

}


/* =====================================================
   STEP 3.3
   WASTE HEATMAP
===================================================== */


/* ================= GET HEATMAP INTENSITY ================= */

function getHeatIntensity(report) {

    /*
     * Different waste types can have slightly
     * different intensity values.
     */

    let intensity = 0.6;


    if (report.type === "Plastic") {

        intensity = 0.8;

    } else if (report.type === "Organic") {

        intensity = 0.6;

    } else if (report.type === "Electronic") {

        intensity = 1.0;

    } else if (report.type === "Other") {

        intensity = 0.5;

    }


    /*
     * Increase intensity for unresolved reports
     */
    if (report.status === "Pending") {

        intensity += 0.2;

    }


    /*
     * Limit maximum
     */
    return Math.min(
        intensity,
        1
    );

}


/* ================= UPDATE HEATMAP ================= */

function updateHeatmap() {

    if (!map) {
        return;
    }


    /*
     * Remove old heatmap
     */
    if (heatLayer) {

        map.removeLayer(
            heatLayer
        );

        heatLayer = null;

    }


    /*
     * Stop if heatmap disabled
     */
    if (!heatmapEnabled) {

        return;
    }


    /*
     * Make sure plugin loaded
     */
    if (
        typeof L.heatLayer !== "function"
    ) {

        console.warn(
            "Leaflet Heatmap plugin not loaded."
        );

        return;
    }


    const typeFilter =
        document.getElementById(
            "mapTypeFilter"
        )?.value || "All";


    const statusFilter =
        document.getElementById(
            "mapStatusFilter"
        )?.value || "All";


    /*
     * Build heat points
     */
    const heatPoints =
        reports
            .filter(function (report) {

                const typeMatch =
                    typeFilter === "All" ||
                    report.type === typeFilter;


                const statusMatch =
                    statusFilter === "All" ||
                    report.status === statusFilter;


                return (
                    typeMatch &&
                    statusMatch &&
                    report.latitude !== null &&
                    report.longitude !== null
                );

            })
            .map(function (report) {

                return [

                    Number(report.latitude),

                    Number(report.longitude),

                    getHeatIntensity(report)

                ];

            });


    /*
     * No data
     */
    if (heatPoints.length === 0) {

        return;

    }


    /*
     * Create heat layer
     */
    heatLayer =
        L.heatLayer(
            heatPoints,
            {

                radius: 35,

                blur: 25,

                maxZoom: 17,

                max: 1.0,

                minOpacity: 0.35

            }
        ).addTo(map);

}


/* ================= TOGGLE HEATMAP ================= */

function toggleHeatmap() {

    heatmapEnabled =
        !heatmapEnabled;


    const button =
        document.getElementById(
            "heatmapToggleBtn"
        );


    if (heatmapEnabled) {

        button.textContent =
            "🔥 Heatmap ON";

        button.classList.add(
            "active"
        );

        updateHeatmap();

    } else {

        button.textContent =
            "🔥 Heatmap OFF";

        button.classList.remove(
            "active"
        );


        if (heatLayer) {

            map.removeLayer(
                heatLayer
            );

            heatLayer = null;

        }

    }

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


    const search =
        document.getElementById(
            "searchReports"
        )?.value
        .toLowerCase()
        .trim() || "";


    const typeFilter =
        document.getElementById(
            "reportTypeFilter"
        )?.value || "All";


    const statusFilter =
        document.getElementById(
            "reportStatusFilter"
        )?.value || "All";


    const filteredReports =
        reports.filter(function (report) {

            const searchMatch =
                report.description
                    .toLowerCase()
                    .includes(search) ||
                report.type
                    .toLowerCase()
                    .includes(search) ||
                report.status
                    .toLowerCase()
                    .includes(search);


            const typeMatch =
                typeFilter === "All" ||
                report.type === typeFilter;


            const statusMatch =
                statusFilter === "All" ||
                report.status === statusFilter;


            return (
                searchMatch &&
                typeMatch &&
                statusMatch
            );

        });


    /*
     * Empty state
     */
    if (filteredReports.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🗑️
                </div>

                <h3>
                    No waste reports found
                </h3>

                <p>
                    Try changing your filters
                    or submit a new report.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        filteredReports
            .map(function (report) {

                return createReportCard(
                    report
                );

            })
            .join("");

}


/* ================= CREATE REPORT CARD ================= */

function createReportCard(report) {

    const photoHTML =
        report.photo

            ? `
                <img
                    src="${report.photo}"
                    alt="Waste photo"
                    class="report-image"
                >
            `

            : `
                <div class="no-photo">
                    📷 No Photo
                </div>
            `;


    return `

        <div class="report-card">

            <div class="report-card-header">

                <div>

                    <span class="waste-type-badge ${getTypeClass(report.type)}">

                        ${getWasteEmoji(report.type)}

                        ${escapeHTML(report.type)}

                    </span>

                </div>

                <span class="status-badge ${getStatusClass(report.status)}">

                    ${getStatusEmoji(report.status)}

                    ${escapeHTML(report.status)}

                </span>

            </div>


            ${photoHTML}


            <div class="report-content">

                <h3>
                    ${escapeHTML(report.type)} Waste Report
                </h3>

                <p class="report-description">
                    ${escapeHTML(report.description)}
                </p>


                <div class="report-info">

                    <p>
                        📍
                        <strong>Location:</strong>
                        ${Number(report.latitude).toFixed(5)},
                        ${Number(report.longitude).toFixed(5)}
                    </p>

                    <p>
                        🕒
                        <strong>Reported:</strong>
                        ${escapeHTML(report.createdAt)}
                    </p>

                </div>


                <div class="report-actions">

                    <button
                        class="map-view-btn"
                        onclick="focusReportOnMap('${report.id}')"
                    >
                        📍 View on Map
                    </button>


                    <select
                        class="status-select"
                        onchange="changeStatus('${report.id}', this.value)"
                    >

                        <option
                            value="Pending"
                            ${report.status === "Pending" ? "selected" : ""}
                        >
                            ⏳ Pending
                        </option>

                        <option
                            value="In Progress"
                            ${report.status === "In Progress" ? "selected" : ""}
                        >
                            🚛 In Progress
                        </option>

                        <option
                            value="Collected"
                            ${report.status === "Collected" ? "selected" : ""}
                        >
                            ✅ Collected
                        </option>

                    </select>

                </div>

            </div>

        </div>

    `;

}


/* ================= FOCUS REPORT ON MAP ================= */

function focusReportOnMap(reportId) {

    const report =
        reports.find(
            function (r) {
                return r.id === reportId;
            }
        );


    if
