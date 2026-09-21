/* =====================================================
   WASTE MAPPING PORTAL - STEP 3.4
   COMPLETE CORRECTED SCRIPT.JS
===================================================== */


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
   AUTH UI
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


    if (!name || !username || !password || !confirmPassword) {

        message.textContent =
            "❌ Please fill all fields.";

        message.className =
            "auth-message error";

        return;
    }


    if (password !== confirmPassword) {

        message.textContent =
            "❌ Passwords do not match.";

        message.className =
            "auth-message error";

        return;
    }


    if (username.length < 3) {

        message.textContent =
            "❌ Username must contain at least 3 characters.";

        message.className =
            "auth-message error";

        return;
    }


    if (password.length < 4) {

        message.textContent =
            "❌ Password must contain at least 4 characters.";

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


    document
        .getElementById("signupForm")
        .reset();


    setTimeout(() => {

        showLogin();

        document.getElementById(
            "loginUsername"
        ).value = username;

        document.getElementById(
            "loginPassword"
        ).focus();

    }, 800);

}


/* =====================================================
   LOGIN
===================================================== */

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

    const authPage =
        document.getElementById("authPage");

    const portalPage =
        document.getElementById("portalPage");


    if (authPage) {

        authPage.classList.add("hidden");

    }


    if (portalPage) {

        portalPage.classList.remove("hidden");

    }


    const currentUserName =
        document.getElementById("currentUserName");


    if (currentUserName) {

        currentUserName.textContent =
            `👤 ${currentUser?.name || "User"}`;

    }


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
   MAP INITIALIZATION
===================================================== */

function initializeMap() {

    const mapElement =
        document.getElementById("map");


    if (!mapElement) {

        return;

    }


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
   WASTE EMOJI
===================================================== */

function getWasteEmoji(type) {

    if (type === "Plastic") {

        return "🔵";

    }

    if (type === "Organic") {

        return "🟢";

    }

    if (type === "Electronic") {

        return "🟣";

    }

    return "⚫";

}


/* =====================================================
   STATUS EMOJI
===================================================== */

function getStatusEmoji(status) {

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


/* =====================================================
   PRIORITY CALCULATION
===================================================== */

function calculatePriority(report) {

    let score = 0;


    /* Waste Type */

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


    /* Description */

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


    const hasUrgentWord =
        urgentWords.some(
            word =>
                description.includes(word)
        );


    if (hasUrgentWord) {

        score += 20;

    }


    /* Final Priority */

    if (score >= 70) {

        return "High";

    }


    if (score >= 45) {

        return "Medium";

    }


    return "Low";

}


/* =====================================================
   PRIORITY EMOJI
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
            report.latitude === undefined ||
            report.longitude === null ||
            report.longitude === undefined
        ) {

            return;

        }


        let nearbyCount = 0;


        reports.forEach(other => {

            if (
                other.latitude === null ||
                other.latitude === undefined ||
                other.longitude === null ||
                other.longitude === undefined
            ) {

                return;

            }


            const latDifference =
                Math.abs(
                    Number(report.latitude) -
                    Number(other.latitude)
                );


            const lngDifference =
                Math.abs(
                    Number(report.longitude) -
                    Number(other.longitude)
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

                latitude:
                    Number(report.latitude),

                longitude:
                    Number(report.longitude),

                count:
                    nearbyCount

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


    const highElement =
        document.getElementById(
            "highPriorityCount"
        );


    const mediumElement =
        document.getElementById(
            "mediumPriorityCount"
        );


    const lowElement =
        document.getElementById(
            "lowPriorityCount"
        );


    const hotspotElement =
        document.getElementById(
            "hotspotCount"
        );


    if (highElement) {

        highElement.textContent = high;

    }


    if (mediumElement) {

        mediumElement.textContent = medium;

    }


    if (lowElement) {

        lowElement.textContent = low;

    }


    if (hotspotElement) {

        hotspotElement.textContent =
            hotspots.length;

    }

}


/* =====================================================
   ADD REPORT MARKER
===================================================== */

function addReportMarker(report) {

    if (!map) {

        return;

    }


    if (
        report.latitude === null ||
        report.latitude === undefined ||
        report.longitude === null ||
        report.longitude === undefined
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
                Number(report.latitude),
                Number(report.longitude)
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
                    alt="Waste photo"
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
                ${getStatusEmoji(report.status)}
                ${escapeHTML(report.status)}
            </p>

            <p>
                <strong>Quantity:</strong>
                ${escapeHTML(report.quantity || "Small")}
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
   LOAD SAVED MARKERS
===================================================== */

function loadSavedMarkers() {

    if (!map) {

        return;

    }


    Object.values(reportMarkers)
        .forEach(marker => {

            if (map.hasLayer(marker)) {

                map.removeLayer(marker);

            }

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

    if (!map) {

        return;

    }


    const typeElement =
        document.getElementById(
            "mapTypeFilter"
        );


    const statusElement =
        document.getElementById(
            "mapStatusFilter"
        );


    const priorityElement =
        document.getElementById(
            "priorityFilter"
        );


    if (
        !typeElement ||
        !statusElement ||
        !priorityElement
    ) {

        return;

    }


    const typeFilter =
        typeElement.value;


    const statusFilter =
        statusElement.value;


    const priorityFilter =
        priorityElement.value;


    reports.forEach(report => {

        const marker =
            reportMarkers[report.id];


        if (!marker) {

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
   HEATMAP INTENSITY
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


/* =====================================================
   UPDATE HEATMAP
===================================================== */

function updateHeatmap() {

    if (!map) {

        return;

    }


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


    const typeElement =
        document.getElementById(
            "mapTypeFilter"
        );


    const statusElement =
        document.getElementById(
            "mapStatusFilter"
        );


    const priorityElement =
        document.getElementById(
            "priorityFilter"
        );


    if (
        !typeElement ||
        !statusElement ||
        !priorityElement
    ) {

        return;

    }


    const typeFilter =
        typeElement.value;


    const statusFilter =
        statusElement.value;


    const priorityFilter =
        priorityElement.value;


    const points = [];


    reports.forEach(report => {

        if (
            report.latitude === null ||
            report.latitude === undefined ||
            report.longitude === null ||
            report.longitude === undefined
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

                Number(report.latitude),

                Number(report.longitude),

                getHeatIntensity(report)

            ]);

        }

    });


    if (points.length === 0) {

        return;

    }
