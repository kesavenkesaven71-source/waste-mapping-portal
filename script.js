/* =====================================================
   WASTE MAPPING PORTAL
   STEP 3.4 - COMPLETE VERSION
   Authentication + Reports + Map + Heatmap
   Smart Priority + Hotspot Detection + Analytics
===================================================== */


/* =====================================================
   AUTHENTICATION
===================================================== */

let users =
    JSON.parse(localStorage.getItem("wastePortalUsers")) || [];

let currentUser =
    JSON.parse(
        localStorage.getItem("wastePortalCurrentUser")
    ) || null;


/* =====================================================
   REPORTS
===================================================== */

/*
   Supports both old reports using:
   report.type

   and new reports using:
   report.wasteType
*/

let reports =
    (
        JSON.parse(
            localStorage.getItem("wasteReports")
        ) || []
    ).map(report => ({
        ...report,
        wasteType:
            report.wasteType ||
            report.type ||
            "Other"
    }));


/* =====================================================
   GLOBAL VARIABLES
===================================================== */

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
   SAVE DATA
===================================================== */

function saveUsers() {

    localStorage.setItem(
        "wastePortalUsers",
        JSON.stringify(users)
    );

}


function saveReports() {

    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );

}


/* =====================================================
   AUTH - SHOW SIGNUP
===================================================== */

function showSignup() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");

    if (loginSection) {
        loginSection.classList.add("hidden");
    }

    if (signupSection) {
        signupSection.classList.remove("hidden");
    }

    const loginMessage =
        document.getElementById("loginMessage");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

}


/* =====================================================
   AUTH - SHOW LOGIN
===================================================== */

function showLogin() {

    const signupSection =
        document.getElementById("signupSection");

    const loginSection =
        document.getElementById("loginSection");

    if (signupSection) {
        signupSection.classList.add("hidden");
    }

    if (loginSection) {
        loginSection.classList.remove("hidden");
    }

    const signupMessage =
        document.getElementById("signupMessage");

    if (signupMessage) {
        signupMessage.textContent = "";
    }

}


/* =====================================================
   CREATE ACCOUNT
===================================================== */

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
        document.getElementById("signupMessage");


    if (
        !name ||
        !username ||
        !password ||
        !confirmPassword
    ) {

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


    const existingUser =
        users.find(
            user =>
                String(user.username).toLowerCase() ===
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

    saveUsers();


    message.textContent =
        "✅ Account created successfully!";

    message.className =
        "auth-message success";


    document
        .getElementById("signupForm")
        .reset();


    setTimeout(() => {

        showLogin();

        const loginUsername =
            document.getElementById(
                "loginUsername"
            );

        if (loginUsername) {
            loginUsername.value = username;
        }

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
                String(item.username).toLowerCase() ===
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


    const userName =
        document.getElementById(
            "currentUserName"
        );


    if (userName) {

        userName.textContent =
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

    updatePriorityDashboard();

    displayReports();

    updateAnalytics();

    loadSavedMarkers();

    filterMapMarkers();

}


/* =====================================================
   MAP INITIALIZATION
===================================================== */

function initializeMap() {

    if (map) {
        return;
    }


    const mapElement =
        document.getElementById("map");


    if (!mapElement) {
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
   PRIORITY CALCULATION
===================================================== */

function calculatePriority(report) {

    let score = 0;


    const wasteType =
        report.wasteType ||
        report.type ||
        "Other";


    /* Waste type */

    if (wasteType === "Electronic") {

        score += 35;

    } else if (wasteType === "Plastic") {

        score += 25;

    } else if (wasteType === "Organic") {

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

    } else if (
        report.status === "In Progress"
    ) {

        score += 10;

    }


    /* Urgent keywords */

    const description =
        String(
            report.description || ""
        ).toLowerCase();


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


    const urgent =
        urgentWords.some(
            word =>
                description.includes(word)
        );


    if (urgent) {

        score += 20;

    }


    /* Final priority */

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
            report.latitude == null ||
            report.longitude == null
        ) {
            return;
        }


        let nearbyCount = 0;


        reports.forEach(other => {

            if (
                other.latitude == null ||
                other.longitude == null
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


    setText(
        "highPriorityCount",
        high
    );

    setText(
        "mediumPriorityCount",
        medium
    );

    setText(
        "lowPriorityCount",
        low
    );

    setText(
        "hotspotCount",
        hotspots.length
    );

}


/* =====================================================
   ADD REPORT MARKER
===================================================== */

function addReportMarker(report) {

    if (!map) {
        return;
    }


    if (
        report.latitude == null ||
        report.longitude == null
    ) {
        return;
    }


    const wasteType =
        report.wasteType ||
        report.type ||
        "Other";


    const priority =
        calculatePriority(report);


    const marker =
        L.marker(
            [
                Number(report.latitude),
                Number(report.longitude)
            ],
            {
                icon:
                    getWasteIcon(wasteType)
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
                ${getWasteEmoji(wasteType)}
                ${escapeHTML(wasteType)}
            </h3>

            ${imageHTML}

            <p>
                <strong>Priority:</strong>
                ${getPriorityEmoji(priority)}
                ${priority}
            </p>

            <p>
                <strong>Status:</strong>
                ${escapeHTML(
                    report.status || "Pending"
                )}
            </p>

            <p>
                <strong>Quantity:</strong>
                ${escapeHTML(
                    report.quantity || "Small"
                )}
            </p>

            <p>
                <strong>Description:</strong>
                ${escapeHTML(
                    report.description || ""
                )}
            </p>

            <p>
                <strong>Reported by:</strong>
                ${escapeHTML(
                    report.reportedBy || "User"
                )}
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


    const typeFilter =
        document.getElementById(
            "mapTypeFilter"
        )?.value || "All";


    const statusFilter =
        document.getElementById(
            "mapStatusFilter"
        )?.value || "All";


    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        )?.value || "All";


    reports.forEach(report => {

        const marker =
            reportMarkers[report.id];


        if (!marker) {
            return;
        }


        const wasteType =
            report.wasteType ||
            report.type ||
            "Other";


        const priority =
            calculatePriority(report);


        const typeMatch =
            typeFilter === "All" ||
            wasteType === typeFilter;


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

        if (map.hasLayer(heatLayer)) {
            map.removeLayer(heatLayer);
        }

        heatLayer = null;

    }


    if (!heatmapEnabled) {
        return;
    }


    if (
        typeof L.heatLayer !== "function"
    ) {

        console.warn(
            "Leaflet heat plugin not loaded."
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


    const priorityFilter =
        document.getElementById(
            "priorityFilter"
        )?.value || "All";


    const points = [];


    reports.forEach(report => {

        if (
            report.latitude == null ||
            report.longitude == null
        ) {
            return;
        }


        const wasteType =
            report.wasteType ||
            report.type ||
            "Other";


        const priority =
            calculatePriority(report);


        const typeMatch =
            typeFilter === "All" ||
            wasteType === typeFilter;


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
