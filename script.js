/* =====================================================
   AUTHENTICATION
===================================================== */

let users =
    JSON.parse(localStorage.getItem("wastePortalUsers")) || [];

let currentUser =
    JSON.parse(localStorage.getItem("wastePortalCurrentUser")) || null;


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

let reports =
    JSON.parse(localStorage.getItem("wasteReports")) || [];

let map = null;

let heatLayer = null;

let heatmapEnabled = false;

let selectedPhoto = "";

let latitude = null;

let longitude = null;

let currentLocationMarker = null;

let reportMarkers = {};

let wasteChart = null;

let statusChart = null;

let portalInitialized = false;


/* =====================================================
   LOGIN / SIGNUP UI
===================================================== */

function showSignup() {

    document
        .getElementById("loginSection")
        .classList.add("hidden");

    document
        .getElementById("signupSection")
        .classList.remove("hidden");

}


function showLogin() {

    document
        .getElementById("signupSection")
        .classList.add("hidden");

    document
        .getElementById("loginSection")
        .classList.remove("hidden");

}


/* =====================================================
   CREATE ACCOUNT
===================================================== */

function createAccount(event) {

    event.preventDefault();

    const name =
        document.getElementById("signupName").value.trim();

    const username =
        document.getElementById("signupUsername").value.trim();

    const password =
        document.getElementById("signupPassword").value;

    const confirmPassword =
        document.getElementById("signupConfirmPassword").value;

    const message =
        document.getElementById("signupMessage");


    if (password !== confirmPassword) {

        message.textContent =
            "❌ Passwords do not match.";

        message.className =
            "auth-message error";

        return;
    }


    const existingUser =
        users.find(
            user =>
                user.username.toLowerCase() ===
                username.toLowerCase()
        );


    if (existingUser) {

        message.textContent =
            "❌ Username already exists.";

        message.className =
            "auth-message error";

        return;
    }


    const newUser = {

        id: Date.now(),

        name: name,

        username: username,

        password: password

    };


    users.push(newUser);

    localStorage.setItem(
        "wastePortalUsers",
        JSON.stringify(users)
    );


    message.textContent =
        "✅ Account created successfully!";

    message.className =
        "auth-message success";


    document.getElementById("signupForm").reset();


    setTimeout(() => {

        showLogin();

        document.getElementById("loginUsername").value =
            username;

    }, 800);

}


/* =====================================================
   LOGIN
===================================================== */

function loginUser(event) {

    event.preventDefault();

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const message =
        document.getElementById("loginMessage");


    const user =
        users.find(
            item =>
                item.username.toLowerCase() ===
                username.toLowerCase() &&
                item.password === password
        );


    if (!user) {

        message.textContent =
            "❌ Invalid username or password.";

        message.className =
            "auth-message error";

        return;
    }


    currentUser = user;

    localStorage.setItem(
        "wastePortalCurrentUser",
        JSON.stringify(currentUser)
    );


    message.textContent =
        "✅ Login successful!";

    message.className =
        "auth-message success";


    setTimeout(() => {

        openPortal();

    }, 500);

}


/* =====================================================
   OPEN PORTAL
===================================================== */

function openPortal() {

    document
        .getElementById("authPage")
        .classList.add("hidden");

    document
        .getElementById("portalPage")
        .classList.remove("hidden");


    document.getElementById("currentUserName").textContent =
        `👤 ${currentUser?.name || "User"}`;


    initializePortal();

}


/* =====================================================
   LOGOUT
===================================================== */

function logoutUser() {

    localStorage.removeItem(
        "wastePortalCurrentUser"
    );

    currentUser = null;

    location.reload();

}


/* =====================================================
   PORTAL INITIALIZATION
===================================================== */

function initializePortal() {

    if (!portalInitialized) {

        initializeMap();

        portalInitialized = true;

    }


    updateStats();

    displayReports();

    updateAnalytics();

    updatePriorityDashboard();

    loadSavedMarkers();

    filterMapMarkers();

    updateHeatmap();

}


/* =====================================================
   MAP
===================================================== */

function initializeMap() {

    map = L.map("map").setView(
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

}


/* =====================================================
   WASTE ICON
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

        iconSize: [35, 35],

        iconAnchor: [17, 17],

        popupAnchor: [0, -17]

    });

}


/* =====================================================
   PRIORITY
===================================================== */

function calculatePriority(report) {

    let score = 0;


    /* Waste type */

    if (report.type === "Electronic") {

        score += 35;

    } else if (report.type === "Plastic") {

        score += 25;

    } else if (report.type === "Organic") {

        score += 20;

    } else {

        score += 15;

    }


    /* Quantity */

    if (report.quantity === "Large") {

        score += 35;

    } else if (report.quantity === "Medium") {

        score += 20;

    } else {

        score += 10;

    }


    /* Status */

    if (report.status === "Pending") {

        score += 20;

    } else if (report.status === "In Progress") {

        score += 10;

    }


    /* Description keywords */

    const description =
        (report.description || "").toLowerCase();


    const urgentWords = [
        "overflow",
        "danger",
        "dangerous",
        "fire",
        "sharp",
        "medical",
        "toxic",
        "leak",
        "blocked"
    ];


    if (
        urgentWords.some(
            word => description.includes(word)
        )
    ) {

        score += 20;

    }


    if (score >= 70) {

        return "High";

    }

    if (score >= 45) {

        return "Medium";

    }

    return "Low";

}


/* =====================================================
   PRIORITY COLOR
===================================================== */

function getPriorityEmoji(priority) {

    if (priority === "High") {

        return "🔴";

    }

    if (priority === "Medium") {

        return "🟠";

    }

    return "🟢";

}


/* =====================================================
   HOTSPOT DETECTION
===================================================== */

function detectHotspots() {

    const hotspots = [];

    const radius = 0.01;

    reports.forEach(report => {

        if (
            report.latitude === null ||
            report.longitude === null
        ) {
            return;
        }


        let nearbyCount = 0;

        reports.forEach(other => {

            if (
                other.latitude === null ||
                other.longitude === null
            ) {
                return;
            }


            const latDifference =
                Math.abs(
                    report.latitude -
                    other.latitude
                );

            const lngDifference =
                Math.abs(
                    report.longitude -
                    other.longitude
                );


            if (
                latDifference <= radius &&
                lngDifference <= radius
            ) {

                nearbyCount++;

            }

        });


        if (nearbyCount >= 3) {

            hotspots.push({

                latitude: report.latitude,

                longitude: report.longitude,

                count: nearbyCount

            });

        }

    });


    return hotspots;

}


/* =====================================================
   PRIORITY DASHBOARD
===================================================== */

function updatePriorityDashboard() {

    let high = 0;

    let medium = 0;

    let low = 0;


    reports.forEach(report => {

        const priority =
            calculatePriority(report);


        if (priority === "High") {

            high++;

        } else if (priority === "Medium") {

            medium++;

        } else {

            low++;

        }

    });


    const hotspots =
        detectHotspots();


    document.getElementById(
        "highPriorityCount"
    ).textContent = high;


    document.getElementById(
        "mediumPriorityCount"
    ).textContent = medium;


    document.getElementById(
        "lowPriorityCount"
    ).textContent = low;


    document.getElementById(
        "hotspotCount"
    ).textContent =
        hotspots.length;

}


/* =====================================================
   ADD REPORT MARKER
===================================================== */

function addReportMarker(report) {

    if (
        report.latitude === null ||
        report.longitude === null
    ) {
        return;
    }


    const priority =
        calculatePriority(report);


    const priorityEmoji =
        getPriorityEmoji(priority);


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
        );


    const imageHTML =
        report.photo
            ? `
                <img
                    src="${report.photo}"
                    class="popup-photo"
                >
              `
            : "";


    marker.bindPopup(`

        <div class="map-popup">

            <h3>
                ${getWasteEmoji(report.type)}
                ${escapeHTML(report.type)}
            </h3>

            ${imageHTML}

            <p>
                <strong>Priority:</strong>
                ${priorityEmoji}
                ${priority}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(report.status)}
            </p>

            <p>
                <strong>Quantity:</strong>
                ${escapeHTML(report.quantity)}
            </p>

            <p>
                ${escapeHTML(report.description)}
            </p>

        </div>

    `);


    marker.addTo(map);


    reportMarkers[report.id] =
        marker;

}


/* =====================================================
   LOAD MARKERS
===================================================== */

function loadSavedMarkers() {

    if (!map) return;


    Object.values(reportMarkers)
        .forEach(marker => {

            map.removeLayer(marker);

        });


    reportMarkers = {};


    reports.forEach(report => {

        addReportMarker(report);

    });


    filterMapMarkers();

}


/* =====================================================
   MAP FILTER
===================================================== */

function filterMapMarkers() {

    if (!map) return;


    const typeFilter =
        document.getElementById(
            "mapTypeFilter"
        ).value;


    const statusFilter =
        document.getElementById(
            "mapStatusFilter"
        ).value;


    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        ).value;


    reports.forEach(report => {

        const marker =
            reportMarkers[report.id];


        if (!marker) return;


        const priority =
            calculatePriority(report);


        const typeMatch =
            typeFilter === "All" ||
            report.type === typeFilter;


        const statusMatch =
            statusFilter === "All" ||
            report.status === statusFilter;


        const priorityMatch =
            priorityFilter === "All" ||
            priority === priorityFilter;


        const visible =
            typeMatch &&
            statusMatch &&
            priorityMatch;


        if (visible) {

            if (!map.hasLayer(marker)) {

                marker.addTo(map);

            }

        } else {

            if (map.hasLayer(marker)) {

                map.removeLayer(marker);

            }

        }

    });


    updateHeatmap();

}


/* =====================================================
   HEATMAP
===================================================== */

function getHeatIntensity(report) {

    const priority =
        calculatePriority(report);


    if (priority === "High") {

        return 1.0;

    }

    if (priority === "Medium") {

        return 0.65;

    }

    return 0.35;

}


function updateHeatmap() {

    if (!map) return;


    if (heatLayer) {

        map.removeLayer(heatLayer);

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
            "Leaflet heat plugin not loaded."
        );

        return;

    }


    const typeFilter =
        document.getElementById(
            "mapTypeFilter"
        ).value;


    const statusFilter =
        document.getElementById(
            "mapStatusFilter"
        ).value;


    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        ).value;


    const points = [];


    reports.forEach(report => {

        if (
            report.latitude === null ||
            report.longitude === null
        ) {
            return;
        }


        const priority =
            calculatePriority(report);


        const typeMatch =
            typeFilter === "All" ||
            report.type === typeFilter;


        const statusMatch =
            statusFilter === "All" ||
            report.status === statusFilter;


        const priorityMatch =
            priorityFilter === "All" ||
            priority === priorityFilter;


        if (
            typeMatch &&
            statusMatch &&
            priorityMatch
        ) {

            points.push([
                report.latitude,
                report.longitude,
                getHeatIntensity(report)
            ]);

        }

    });


    if (points.length === 0) {

        return;

    }


    heatLayer =
        L.heatLayer(
            points,
            {
                radius: 30,
                blur: 20,
                maxZoom: 15
            }
        ).addTo(map);

}


/* =====================================================
   HEATMAP TOGGLE
===================================================== */

function toggleHeatmap() {

    heatmapEnabled =
        !heatmapEnabled;


    const button =
        document.getElementById(
            "heatmapToggle"
        );


    if (heatmapEnabled) {

        button.textContent =
            "❌ Hide Heatmap";

        button.classList.add(
            "active"
        );

    } else {

        button.textContent =
            "🔥 Show Heatmap";

        button.classList.remove(
            "active"
        );

    }


    updateHeatmap();

}


/* =====================================================
   GET LOCATION
===================================================== */

function getLocation() {

    const locationText =
        document.getElementById(
            "locationText"
        );


    if (!navigator.geolocation) {

        locationText.textContent =
            "❌ Geolocation not supported.";

        return;

    }


    locationText.textContent =
        "📡 Getting location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            locationText.textContent =
                `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;


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
                    "📍 Selected Report Location"
                )
                .openPopup();


            map.setView(
                [
                    latitude,
                    longitude
                ],
                15
            );

        },

        error => {

            locationText.textContent =
                "❌ Unable to get location.";

            console.error(error);

        }

    );

}


/* =====================================================
   PHOTO PREVIEW
===================================================== */

function previewPhoto(event) {

    const file =
        event.target.files[0];


    if (!file) {

        selectedPhoto = "";

        document.getElementById(
            "photoPreview"
        ).innerHTML = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload = function(e) {

        selectedPhoto =
            e.target.result;


        document.getElementById(
            "photoPreview"
        ).innerHTML = `

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


    const type =
        document.getElementById(
            "wasteType"
        ).value;


    const quantity =
        document.getElementById(
            "wasteQuantity"
        ).value;


    const description =
        document.getElementById(
            "wasteDescription"
        ).value.trim();


    const message =
        document.getElementById(
            "reportMessage"
        );


    if (!latitude || !longitude) {

        message.textContent =
            "📍 Please get your location first.";

        message.className =
            "error-message";

        return;

    }


    const report = {

        id: Date.now(),

        type: type,

        quantity: quantity,

        description: de
