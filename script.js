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

    // Initialize map
    if (!map) {
        initializeMap();
    }

    // Load data
    displayReports();
    updateStats();
    updateAnalytics();
    loadSavedMarkers();

    // Fix Leaflet rendering
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

    const mapElement =
        document.getElementById("map");

    if (!mapElement) {
        console.error("Map element not found.");
        return;
    }

    // Default location: Madurai
    map = L.map("map").setView(
        [9.9252, 78.1198],
        13
    );

    // OpenStreetMap
    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);
}


// =====================================================
// GET USER LOCATION
// =====================================================

function getLocation() {

    if (!navigator.geolocation) {

        document.getElementById(
            "location"
        ).innerText =
            "❌ Location support is not available.";

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
            .bindPopup(
                "📍 Your Current Location"
            )
            .openPopup();

        },

        function (error) {

            console.error(
                "Location error:",
                error
            );

            let message =
                "❌ Location could not be detected.";

            if (error.code === 1) {
                message =
                    "❌ Location permission denied.";
            }

            else if (error.code === 2) {
                message =
                    "❌ Location unavailable.";
            }

            else if (error.code === 3) {
                message =
                    "❌ Location request timed out.";
            }

            document.getElementById(
                "location"
            ).innerText = message;

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

    reader.onload =
        function (event) {

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
        document.getElementById(
            "wasteType"
        ).value;

    const description =
        document.getElementById(
            "description"
        )
        .value
        .trim();


    // Validate waste type
    if (wasteType === "") {

        alert(
            "⚠️ Please select a waste type."
        );

        return;
    }


    // Validate location
    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "📍 Please click 'Get My Location' first."
        );

        return;
    }


    // Create report
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


    // Save
    reports.push(
        newReport
    );

    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );


    // Add marker
    addReportMarker(
        newReport
    );


    // Update UI
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
// GET WASTE ICON
// =====================================================

function getWasteIcon(
    wasteType
) {

    if (
        wasteType === "Plastic"
    ) {
        return "♻️";
    }

    if (
        wasteType === "Organic"
    ) {
        return "🌱";
    }

    if (
        wasteType === "Electronic"
    ) {
        return "💻";
    }

    return "🗑️";
}


// =====================================================
// GET STATUS ICON
// =====================================================

function getStatusIcon(
    status
) {

    if (
        status === "Pending"
    ) {
        return "🔴";
    }

    if (
        status === "In Progress"
    ) {
        return "🟡";
    }

    if (
        status === "Collected"
    ) {
        return "🟢";
    }

    return "⚪";
}


// =====================================================
// ADD REPORT MARKER
// =====================================================

function addReportMarker(
    report
) {

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
        L.marker([
            lat,
            lng
        ])
        .addTo(map);


    const icon =
        getWasteIcon(
            report.wasteType
        );

    const statusIcon =
        getStatusIcon(
            report.status
        );


    marker.bindPopup(`

        <div style="min-width:220px">

            <h3>
                ${icon}
                ${escapeHTML(
                    report.wasteType
                )}
            </h3>

            <p>
                <strong>
                    📝 Description:
                </strong>
                ${escapeHTML(
                    report.description ||
                    "No description"
                )}
            </p>

            <p>
                <strong>
                    📊 Status:
                </strong>
                ${statusIcon}
                ${escapeHTML(
                    report.status
                )}
            </p>

            <p>
                <strong>
                    📅 Date:
                </strong>
                ${escapeHTML(
                    report.date
                )}
            </p>

            <p>
                <strong>
                    📍 Coordinates:
                </strong><br>
                ${lat.toFixed(6)},
                ${lng.toFixed(6)}
            </p>

        </div>

    `);


    reportMarkers.push(
        marker
    );
}


// =====================================================
// LOAD SAVED MARKERS
// =====================================================

function loadSavedMarkers() {

    if (!map) {
        initializeMap();
    }


    // Remove existing markers
    reportMarkers.forEach(
        function (marker) {

            map.removeLayer(
                marker
            );

        }
    );


    reportMarkers = [];


    // Add saved reports
    reports.forEach(
        function (report) {

            addReportMarker(
                report
            );

        }
    );
}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

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
// STATUS CLASS
// =====================================================

function getStatusClass(
    status
) {

    if (
        status === "Pending"
    ) {
        return "status-pending";
    }

    if (
        status === "In Progress"
    ) {
        return "status-progress";
    }

    if (
        status === "Collected"
    ) {
        return "status-collected";
    }

    return "status-pending";
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

                )
                .toLowerCase();


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

                }

                else {

                    photoHTML = `

                        <div class="report-photo"
                             style="
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:28px;
                             ">

                            📷

                        </div>

                    `;
                }


                const lat =
                    Number(
                        report.latitude
                    );

                const lng =
                    Number(
                        report.longitude
                    );


                card.innerHTML = `

                    <div>
                        ${photoHTML}
                    </div>


                    <div class="report-info">

                        <h3>

                            ${getWasteIcon(
                                report.wasteType
                            )}

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

                return Number(
                    item.id
                ) === Number(
                    reportId
                );

            }
        );


    if (!report) {
        return;
    }


    report.status =
        newStatus;


    localStorage.setItem(
        "wasteReports",
        JSON.stringify(
            reports
        )
    );


    displayReports();

    updateStats
