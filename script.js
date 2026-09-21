/* =========================================================
   WASTE MAPPING PORTAL - STEP 3.4
   Authentication
   Waste Reports
   Smart Map
   Heatmap
   Smart Priority
   Hotspot Detection
========================================================= */


/* =========================================================
   AUTHENTICATION DATA
========================================================= */

let users =
    JSON.parse(
        localStorage.getItem("wastePortalUsers")
    ) || [];

let currentUser =
    JSON.parse(
        localStorage.getItem("wastePortalCurrentUser")
    ) || null;


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let reports =
    JSON.parse(
        localStorage.getItem("wasteReports")
    ) || [];

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


/* =========================================================
   AUTH UI
========================================================= */

function showSignup() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");

    if (!loginSection || !signupSection) {
        return;
    }

    loginSection.classList.add("hidden");

    signupSection.classList.remove("hidden");

    const loginMessage =
        document.getElementById("loginMessage");

    if (loginMessage) {
        loginMessage.textContent = "";
    }

}


function showLogin() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");

    if (!loginSection || !signupSection) {
        return;
    }

    signupSection.classList.add("hidden");

    loginSection.classList.remove("hidden");

    const signupMessage =
        document.getElementById("signupMessage");

    if (signupMessage) {
        signupMessage.textContent = "";
    }

}


/* =========================================================
   CREATE ACCOUNT
========================================================= */

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

        document
            .getElementById("loginUsername")
            .value = username;

        document
            .getElementById("loginPassword")
            .focus();

    }, 800);

}


/* =========================================================
   LOGIN
========================================================= */

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


    currentUser = {

        id: user.id,

        name: user.name,

        username: user.username

    };


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

    }, 300);

}


/* =========================================================
   OPEN PORTAL
========================================================= */

function openPortal() {

    document
        .getElementById("authPage")
        .classList.add("hidden");

    document
        .getElementById("portalPage")
        .classList.remove("hidden");


    const userName =
        document.getElementById("currentUserName");

    if (userName && currentUser) {

        userName.textContent =
            `👤 ${currentUser.name}`;

    }


    initializePortal();

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser() {

    localStorage.removeItem(
        "wastePortalCurrentUser"
    );

    currentUser = null;

    location.reload();

}


/* =========================================================
   INITIALIZE PORTAL
========================================================= */

function initializePortal() {

    if (portalInitialized) {

        updateStats();
        displayReports();
        updateAnalytics();
        updatePriorityDashboard();

        filterMapMarkers();

        return;
    }


    portalInitialized = true;


    initializeMap();

    updateStats();

    displayReports();

    updateAnalytics();

    updatePriorityDashboard();

    loadSavedMarkers();

}


/* =========================================================
   MAP
========================================================= */

function initializeMap() {

    if (map) {
        return;
    }


    map = L.map("map").setView(
        [9.9252, 78.1198],
        13
    );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    setTimeout(() => {

        map.invalidateSize();

    }, 300);

}


/* =========================================================
   WASTE ICON
========================================================= */

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


    return L.divIcon({

        className:
            "custom-waste-marker",

        html:
            `<div class="waste-marker">${emoji}</div>`,

        iconSize: [35, 35],

        iconAnchor: [17, 17],

        popupAnchor: [0, -17]

    });

}


/* =========================================================
   PRIORITY CALCULATION
========================================================= */

function calculatePriority(report) {

    let score = 0;


    /* Waste type */

    if (report.wasteType === "Electronic") {
        score += 35;
    }

    else if (report.wasteType === "Plastic") {
        score += 25;
    }

    else if (report.wasteType === "Organic") {
        score += 20;
    }

    else {
        score += 15;
    }


    /* Quantity */

    if (report.quantity === "Large") {
        score += 35;
    }

    else if (report.quantity === "Medium") {
        score += 20;
    }

    else {
        score += 10;
    }


    /* Status */

    if (report.status === "Pending") {
        score += 20;
    }

    else if (report.status === "In Progress") {
        score += 10;
    }


    /* Dangerous keywords */

    const description =
        (report.description || "")
            .toLowerCase();


    const keywords = [
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
        keywords.some(
            word =>
                description.includes(word)
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


/* =========================================================
   PRIORITY EMOJI
========================================================= */

function getPriorityEmoji(priority) {

    if (priority === "High") {
        return "🔴";
    }

    if (priority === "Medium") {
        return "🟠";
    }

    return "🟢";

}


/* =========================================================
   HOTSPOT DETECTION
========================================================= */

function detectHotspots() {

    const hotspotReports = [];


    for (let i = 0; i < reports.length; i++) {

        const current = reports[i];

        if (
            current.latitude === null ||
            current.longitude === null
        ) {
            continue;
        }


        let nearbyCount = 0;


        for (let j = 0; j < reports.length; j++) {

            const other = reports[j];


            if (
                other.latitude === null ||
                other.longitude === null
            ) {
                continue;
            }


            const latDifference =
                Math.abs(
                    Number(current.latitude) -
                    Number(other.latitude)
                );

            const lngDifference =
                Math.abs(
                    Number(current.longitude) -
                    Number(other.longitude)
                );


            if (
                latDifference <= 0.01 &&
                lngDifference <= 0.01
            ) {

                nearbyCount++;

            }

        }


        if (nearbyCount >= 3) {

            hotspotReports.push(current);

        }

    }


    return hotspotReports;

}


/* =========================================================
   PRIORITY DASHBOARD
========================================================= */

function updatePriorityDashboard() {

    let high = 0;
    let medium = 0;
    let low = 0;


    reports.forEach(report => {

        const priority =
            calculatePriority(report);


        if (priority === "High") {
            high++;
        }

        else if (priority === "Medium") {
            medium++;
        }

        else {
            low++;
        }

    });


    const hotspots =
        detectHotspots();


    document
        .getElementById("highPriorityCount")
        .textContent = high;

    document
        .getElementById("mediumPriorityCount")
        .textContent = medium;

    document
        .getElementById("lowPriorityCount")
        .textContent = low;

    document
        .getElementById("hotspotCount")
        .textContent =
            hotspots.length;

}


/* =========================================================
   ADD MAP MARKER
========================================================= */

function addReportMarker(report) {

    if (
        !map ||
        report.latitude === null ||
        report.longitude === null
    ) {
        return;
    }


    const priority =
        calculatePriority(report);


    const popupPhoto =
        report.photo
            ? `
                <img
                    src="${report.photo}"
                    class="popup-photo"
                >
              `
            : "";


    const popupContent = `

        <div class="map-popup">

            <strong>
                ${getWasteEmoji(report.wasteType)}
                ${escapeHTML(report.wasteType)}
            </strong>

            <br><br>

            <b>Priority:</b>
            ${getPriorityEmoji(priority)}
            ${priority}

            <br>

            <b>Status:</b>
            ${escapeHTML(report.status)}

            <br>

            <b>Quantity:</b>
            ${escapeHTML(report.quantity)}

            <br><br>

            ${escapeHTML(report.description)}

            ${popupPhoto}

        </div>

    `;


    const marker =
        L.marker(
            [
                Number(report.latitude),
                Number(report.longitude)
            ],
            {
                icon:
                    getWasteIcon(
                        report.wasteType
                    )
            }
        );


    marker
        .bindPopup(popupContent)
        .addTo(map);


    reportMarkers[report.id] = marker;

}


/* =========================================================
   LOAD SAVED MARKERS
========================================================= */

function loadSavedMarkers() {

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


/* =========================================================
   MAP FILTERS
========================================================= */

function filterMapMarkers() {

    if (!map) {
        return;
    }


    const typeFilter =
        document
            .getElementById("mapTypeFilter")
            .value;


    const statusFilter =
        document
            .getElementById("mapStatusFilter")
            .value;


    const priorityFilter =
        document
            .getElementById("priorityFilter")
            .value;


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
            report.wasteType === typeFilter;


        const statusMatch =
            statusFilter === "All" ||
            report.status === statusFilter;


        const priorityMatch =
            priorityFilter === "All" ||
            priority === priorityFilter;


        const shouldShow =
            typeMatch &&
            statusMatch &&
            priorityMatch;


        if (shouldShow) {

            if (!map.hasLayer(marker)) {
                marker.addTo(map);
            }

        }

        else {

            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }

        }

    });


    updateHeatmap();

}


/* =========================================================
   HEATMAP
========================================================= */

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


    const typeFilter =
        document
            .getElementById("mapTypeFilter")
            .value;


    const statusFilter =
        document
            .getElementById("mapStatusFilter")
            .value;


    const priorityFilter =
        document
            .getElementById("priorityFilter")
            .value;


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
            report.wasteType === typeFilter;


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


    heatLayer =
        L.heatLayer(
            points,
            {
                radius: 35,
                blur: 25,
                maxZoom: 17,
                max: 1
            }
        ).addTo(map);

}


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

    }

    else {

        button.textContent =
            "🔥 Show Heatmap";

    }


    updateHeatmap();

}


/* =========================================================
   LOCATION
========================================================= */

function getLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by your browser."
        );

        return;

    }


    const locationText =
        document.getElementById(
            "locationText"
        );


    locationText.textContent =
        "📍 Getting location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            locationText.textContent =
                `📍 ${latitude.toFixed(6)},
                 ${longitude.toFixed(6)}`;


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

        error => {

            locationText.textConten
