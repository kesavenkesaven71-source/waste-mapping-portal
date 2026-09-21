/* =====================================================
   WASTE MAPPING PORTAL
   SIGNUP + LOGIN + STEP 3.3 HEATMAP
===================================================== */


/* =====================================================
   AUTHENTICATION
===================================================== */

let users =
    JSON.parse(
        localStorage.getItem("wastePortalUsers")
    ) || [];


let currentUser =
    JSON.parse(
        localStorage.getItem("wastePortalCurrentUser")
    ) || null;


/* ================= AUTH ELEMENTS ================= */

const authPage =
    document.getElementById("authPage");

const portal =
    document.getElementById("portal");

const loginSection =
    document.getElementById("loginSection");

const signupSection =
    document.getElementById("signupSection");


/* ================= SHOW LOGIN ================= */

function showLogin() {

    loginSection.classList.remove("hidden");

    signupSection.classList.add("hidden");

}


/* ================= SHOW SIGNUP ================= */

function showSignup() {

    loginSection.classList.add("hidden");

    signupSection.classList.remove("hidden");

}


/* ================= CREATE ACCOUNT ================= */

function createAccount(event) {

    event.preventDefault();


    const name =
        document
            .getElementById("signupName")
            .value
            .trim();


    const username =
        document
            .getElementById("signupUsername")
            .value
            .trim();


    const password =
        document
            .getElementById("signupPassword")
            .value;


    const confirmPassword =
        document
            .getElementById("signupConfirmPassword")
            .value;


    const message =
        document.getElementById(
            "signupMessage"
        );


    message.className =
        "auth-message";


    /*
     * Basic validation
     */

    if (
        name.length < 2
    ) {

        message.textContent =
            "❌ Please enter your name.";

        message.classList.add("error");

        return;

    }


    if (
        username.length < 3
    ) {

        message.textContent =
            "❌ Username must contain at least 3 characters.";

        message.classList.add("error");

        return;

    }


    if (
        password.length < 6
    ) {

        message.textContent =
            "❌ Password must contain at least 6 characters.";

        message.classList.add("error");

        return;

    }


    if (
        password !== confirmPassword
    ) {

        message.textContent =
            "❌ Passwords do not match.";

        message.classList.add("error");

        return;

    }


    /*
     * Check existing username
     */

    const existingUser =
        users.find(
            user =>
                user.username.toLowerCase() ===
                username.toLowerCase()
        );


    if (existingUser) {

        message.textContent =
            "❌ Username already exists.";

        message.classList.add("error");

        return;

    }


    /*
     * Create user
     */

    const newUser = {

        id:
            Date.now().toString(),

        name:
            name,

        username:
            username,

        password:
            password

    };


    users.push(newUser);


    /*
     * Save users
     */

    localStorage.setItem(
        "wastePortalUsers",
        JSON.stringify(users)
    );


    /*
     * Success
     */

    message.textContent =
        "✅ Account created successfully!";

    message.classList.add("success");


    /*
     * Clear form
     */

    document
        .getElementById("signupForm")
        .reset();


    /*
     * After short delay,
     * show login
     */

    setTimeout(
        function () {

            showLogin();

            document
                .getElementById(
                    "loginUsername"
                )
                .value =
                username;

            document
                .getElementById(
                    "loginPassword"
                )
                .focus();

        },
        1000
    );

}


/* ================= LOGIN ================= */

function loginUser(event) {

    event.preventDefault();


    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();


    const password =
        document
            .getElementById("loginPassword")
            .value;


    const message =
        document.getElementById(
            "loginMessage"
        );


    message.className =
        "auth-message";


    /*
     * Find user
     */

    const user =
        users.find(
            account =>
                account.username.toLowerCase() ===
                username.toLowerCase() &&
                account.password ===
                password
        );


    if (!user) {

        message.textContent =
            "❌ Incorrect username or password.";

        message.classList.add("error");

        return;

    }


    /*
     * Save logged-in user
     */

    currentUser = {

        id:
            user.id,

        name:
            user.name,

        username:
            user.username

    };


    localStorage.setItem(
        "wastePortalCurrentUser",
        JSON.stringify(currentUser)
    );


    /*
     * Show portal
     */

    openPortal();


    /*
     * Reset login
     */

    document
        .getElementById("loginForm")
        .reset();

}


/* ================= OPEN PORTAL ================= */

function openPortal() {

    authPage.classList.add("hidden");

    portal.classList.remove("hidden");


    /*
     * Show username
     */

    const welcomeUser =
        document.getElementById(
            "welcomeUser"
        );


    if (currentUser) {

        welcomeUser.textContent =
            `👤 ${currentUser.name}`;

    }


    /*
     * Initialize portal
     */

    initializePortal();

}


/* ================= LOGOUT ================= */

function logoutUser() {

    localStorage.removeItem(
        "wastePortalCurrentUser"
    );


    currentUser = null;


    location.reload();

}


/* =====================================================
   WASTE PORTAL
===================================================== */

let latitude = null;
let longitude = null;

let selectedPhoto = null;

let reports =
    JSON.parse(
        localStorage.getItem("wasteReports")
    ) || [];

let map = null;

let heatLayer = null;

let heatmapEnabled = true;

let wasteChart = null;

let statusChart = null;

let reportMarkers = [];

let currentLocationMarker = null;

let portalInitialized = false;


/* ================= INITIALIZE ================= */

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


/* ================= MAP ================= */

function initializeMap() {

    if (map) {
        return;
    }


    map =
        L.map("map").setView(
            [9.9252, 78.1198],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    L.control
        .scale()
        .addTo(map);

}


/* =====================================================
   LOCATION
===================================================== */

function getLocation() {

    const status =
        document.getElementById(
            "locationStatus"
        );


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


            document.getElementById(
                "latitude"
            ).value =
                latitude;


            document.getElementById(
                "longitude"
            ).value =
                longitude;


            status.textContent =
                `✅ Location selected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;


            if (map) {

                map.setView(
                    [
                        latitude,
                        longitude
                    ],
                    16
                );


                if (currentLocationMarker) {

                    map.removeLayer(
                        currentLocationMarker
                    );

                }


                currentLocationMarker =
                    L.marker(
                        [
                            latitude,
                            longitude
                        ]
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


            status.textContent =
                message;

        }

    );

}


/* =====================================================
   PHOTO
===================================================== */

function previewPhoto(event) {

    const file =
        event.target.files[0];


    const preview =
        document.getElementById(
            "photoPreview"
        );


    if (!file) {

        selectedPhoto = null;

        preview.innerHTML = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

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


/* =====================================================
   SUBMIT REPORT
===================================================== */

function submitReport(event) {

    event.preventDefault();


    const wasteType =
        document.getElementById(
            "wasteType"
        ).value;


    const description =
        document.getElementById(
            "description"
        ).value
        .trim();


    if (!wasteType) {

        alert(
            "Please select a waste type."
        );

        return;

    }


    if (!description) {

        alert(
            "Please enter a description."
        );

        return;

    }


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
            new Date().toLocaleString(),

        reportedBy:
            currentUser
                ? currentUser.username
                : "User"

    };


    reports.unshift(report);


    saveReports();


    document
        .getElementById(
            "reportForm"
        )
        .reset();


    document
        .getElementById(
            "photoPreview"
        )
        .innerHTML = "";


    document
        .getElementById(
            "locationStatus"
        )
        .textContent =
        "Location not selected";


    selectedPhoto = null;

    latitude = null;

    longitude = null;


    document.getElementById(
        "latitude"
    ).value = "";


    document.getElementById(
        "longitude"
    ).value = "";


    updateStats();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

    updateHeatmap();


    alert(
        "✅ Waste report submitted successfully!"
    );

}


/* ================= SAVE ================= */

function saveReports() {

    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );

}


/* =====================================================
   MARKERS
===================================================== */

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


/* ================= ADD MARKER ================= */

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
                    getWasteIcon(
                        report.type
                    )
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
                ${getStatusEmoji(report.status)}
                ${escapeHTML(report.status)}
            </p>

            <p>
                <strong>Reported By:</strong>
                ${escapeHTML(report.reportedBy || "User")}
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


/* ================= LOAD MARKERS ================= */

function loadSavedMarkers() {

    if (!map) {
        return;
    }


    reportMarkers.forEach(
        function (item) {

            if (
                map.hasLayer(
                    item.marker
                )
            ) {

                map.removeLayer(
                    item.marker
                );

            }

        }
    );


    reportMarkers = [];


    reports.forEach(
        function (report) {

            addReportMarker(report);

        }
    );


    filterMapMarkers();

}


/* ================= FILTER MARKERS ================= */

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


    reportMarkers.forEach(
        function (item) {

            const report =
                reports.find(
                    r =>
                        r.id ===
                        item.id
                );


            if (!report) {
                return;
            }


            const typeMatch =
                typeFilter === "All" ||
                report.type ===
                    typeFilter;


            const statusMatch =
                statusFilter === "All" ||
                report.status ===
                    statusFilter;


            if (
                typeMatch &&
                statusMatch
            ) {

                if (
                    !map.hasLayer(
                        item.marker
                    )
                ) {

                    item.marker.addTo(map);

                }

            } else {

                if (
                    map.hasLayer(
                        item.marker
                    )
                ) {

                    map.removeLayer(
                        item.marker
                    );

                }

            }

        }
    );

}


/* =====================================================
   HEATMAP
===================================================== */

function getHeatIntensity(report) {

    let intensity = 0.6;


    if (
        report.type === "Plastic"
    ) {

        intensity = 0.8;

    } else if (
        report.type === "Organic"
    ) {

        intensity = 0.6;

    } else if (
        report.type === "Electronic"
    ) {

        intensity = 1.0;

    } else if (
        report.type === "Other"
    ) {

        intensity = 0.5;

    }


    if (
        report.status === "Pending"
    ) {

        intensity += 0.2;

    }


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


    if (heatLayer) {

        map.removeLayer(
            heatLayer
        );

        heatLayer = null;

    }


    if (!heatmapEnabled) {

        return;

    }


    if (
        typeof L.heatLayer !==
        "function"
    ) {

        console.warn(
            "Heatmap plugin not loaded."
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


    const heatPoints =
        reports
            .filter(
                function (report) {

                    const typeMatch =
                        typeFilter ===
                            "All" ||
                        report.type ===
                            typeFilter;


                    const statusMatch =
                        statusFilter ===
                            "All" ||
                        report.status ===
                            statusFilter;


                    return (
                        typeMatch &&
                        statusMatch &&
                        report.latitude !==
                            null &&
                        report.longitude !==
                            null
                    );

                }
            )
            .map(
                function (report) {

                    return [

                        Number(
                            report.latitude
