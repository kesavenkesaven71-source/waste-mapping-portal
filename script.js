/* =====================================================
   WASTE MAPPING PORTAL
   FULL FIXED VERSION
===================================================== */


/* ================= DATA ================= */

let users = [];

try {
    users =
        JSON.parse(
            localStorage.getItem("wastePortalUsers")
        ) || [];
} catch {
    users = [];
}


let currentUser = null;

try {
    currentUser =
        JSON.parse(
            localStorage.getItem("wastePortalCurrentUser")
        ) || null;
} catch {
    currentUser = null;
}


let reports = [];

try {
    reports =
        (
            JSON.parse(
                localStorage.getItem("wasteReports")
            ) || []
        ).map(report => ({
            ...report,
            wasteType:
                report.wasteType ||
                report.type ||
                "Other",
            status:
                report.status ||
                "Pending"
        }));
} catch {
    reports = [];
}


/* ================= GLOBALS ================= */

let map = null;
let heatLayer = null;
let heatmapEnabled = false;

let latitude = null;
let longitude = null;

let selectedPhoto = "";

let currentLocationMarker = null;

let reportMarkers = {};

let wasteChart = null;
let statusChart = null;


/* ================= SAVE ================= */

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


/* ================= AUTH ================= */

function showSignup() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");

    loginSection.classList.add("hidden");
    signupSection.classList.remove("hidden");

    document.getElementById("loginMessage").textContent = "";

}


function showLogin() {

    const loginSection =
        document.getElementById("loginSection");

    const signupSection =
        document.getElementById("signupSection");

    signupSection.classList.add("hidden");
    loginSection.classList.remove("hidden");

    document.getElementById("signupMessage").textContent = "";

}


/* ================= CREATE ACCOUNT ================= */

function createAccount(event) {

    event.preventDefault();

    const name =
        document.getElementById("signupName")
        .value.trim();

    const username =
        document.getElementById("signupUsername")
        .value.trim();

    const password =
        document.getElementById("signupPassword")
        .value;

    const confirmPassword =
        document.getElementById("signupConfirmPassword")
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


    const exists =
        users.some(
            user =>
                String(user.username).toLowerCase() ===
                username.toLowerCase()
        );


    if (exists) {

        message.textContent =
            "❌ Username already exists.";

        message.className =
            "auth-message error";

        return;
    }


    users.push({

        id: Date.now(),

        name: name,

        username: username,

        password: password

    });


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

        document.getElementById(
            "loginUsername"
        ).value = username;

    }, 700);

}


/* ================= LOGIN ================= */

function loginUser(event) {

    event.preventDefault();

    const username =
        document.getElementById("loginUsername")
        .value.trim();

    const password =
        document.getElementById("loginPassword")
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
        JSON.stringify(user)
    );


    showPortal();

}


/* ================= LOGOUT ================= */

function logoutUser() {

    currentUser = null;

    localStorage.removeItem(
        "wastePortalCurrentUser"
    );

    document
        .getElementById("portalPage")
        .classList.add("hidden");

    document
        .getElementById("authPage")
        .classList.remove("hidden");

}


/* ================= PORTAL ================= */

function showPortal() {

    document
        .getElementById("authPage")
        .classList.add("hidden");

    document
        .getElementById("portalPage")
        .classList.remove("hidden");


    document.getElementById(
        "currentUserName"
    ).textContent =
        currentUser
            ? `👤 ${currentUser.name}`
            : "User";


    initMap();

    refreshAll();

}


/* ================= PRIORITY ================= */

function calculatePriority(report) {

    let score = 0;


    const type =
        report.wasteType ||
        report.type ||
        "Other";


    const quantity =
        report.quantity ||
        "Small";


    const status =
        report.status ||
        "Pending";


    const description =
        String(
            report.description || ""
        ).toLowerCase();


    if (type === "Electronic")
        score += 35;

    else if (type === "Plastic")
        score += 25;

    else if (type === "Organic")
        score += 20;

    else
        score += 15;


    if (quantity === "Large")
        score += 35;

    else if (quantity === "Medium")
        score += 20;

    else
        score += 10;


    if (status === "Pending")
        score += 20;

    else if (status === "In Progress")
        score += 10;


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


    let priority = "Low";


    if (score >= 70)
        priority = "High";

    else if (score >= 45)
        priority = "Medium";


    return {
        score,
        priority
    };

}


/* ================= HOTSPOTS ================= */

function getHotspots() {

    const hotspots = [];


    reports.forEach(report => {

        if (
            typeof report.latitude !== "number" ||
            typeof report.longitude !== "number"
        ) {
            return;
        }


        let nearby = 0;


        reports.forEach(other => {

            if (
                typeof other.latitude !== "number" ||
                typeof other.longitude !== "number"
            ) {
                return;
            }


            const latDiff =
                Math.abs(
                    report.latitude -
                    other.latitude
                );

            const lngDiff =
                Math.abs(
                    report.longitude -
                    other.longitude
                );


            if (
                latDiff <= 0.01 &&
                lngDiff <= 0.01
            ) {

                nearby++;

            }

        });


        if (nearby >= 3) {

            hotspots.push(report);

        }

    });


    return hotspots;

}


/* ================= MAP ================= */

function initMap() {

    if (map)
        return;


    const mapElement =
        document.getElementById("map");


    if (!mapElement)
        return;


    map =
        L.map("map")
        .setView(
            [20, 78],
            5
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    setTimeout(() => {

        map.invalidateSize();

    }, 300);

}


/* ================= MARKER ICON ================= */

function getMarkerColor(type) {

    if (type === "Plastic")
        return "#2563eb";

    if (type === "Organic")
        return "#16a34a";

    if (type === "Electronic")
        return "#9333ea";

    return "#374151";

}


function createMarkerIcon(type) {

    return L.divIcon({

        className: "custom-marker",

        html:
            `<div style="
                width:22px;
                height:22px;
                border-radius:50%;
                background:${getMarkerColor(type)};
                border:3px solid white;
                box-shadow:0 2px 8px rgba(0,0,0,.4);
            "></div>`,

        iconSize: [22, 22],

        iconAnchor: [11, 11]

    });

}


/* ================= MAP FILTER ================= */

function filterMapMarkers() {

    if (!map)
        return;


    Object.values(reportMarkers)
        .forEach(marker => {

            map.removeLayer(marker);

        });


    reportMarkers = {};


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

        if (
            typeof report.latitude !== "number" ||
            typeof report.longitude !== "number"
        ) {
            return;
        }


        const priority =
            calculatePriority(report);


        const type =
            report.wasteType ||
            "Other";


        const status =
            report.status ||
            "Pending";


        if (
            typeFilter !== "All" &&
            type !== typeFilter
        ) {
            return;
        }


        if (
            statusFilter !== "All" &&
            status !== statusFilter
        ) {
            return;
        }


        if (
            priorityFilter !== "All" &&
            priority.priority !== priorityFilter
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
                        createMarkerIcon(type)
                }
            ).addTo(map);


        marker.bindPopup(`
            <strong>${escapeHtml(type)}</strong><br>
            Priority: ${priority.priority}<br>
            Status: ${escapeHtml(status)}<br>
            ${escapeHtml(report.description || "")}
        `);


        reportMarkers[report.id] = marker;

    });


    updateHeatmap();

}


/* ================= HEATMAP ================= */

function updateHeatmap() {

    if (!map)
        return;


    if (heatLayer) {

        map.removeLayer(heatLayer);

        heatLayer = null;

    }


    if (!heatmapEnabled)
        return;


    const points =
        reports
        .filter(
            report =>
                typeof report.latitude === "number" &&
                typeof report.longitude === "number"
        )
        .map(report => {

            const priority =
                calculatePriority(report);


            let intensity = 0.35;


            if (priority.priority === "High")
                intensity = 1;

            else if (priority.priority === "Medium")
                intensity = 0.65;


            return [
                report.latitude,
                report.longitude,
                intensity
            ];

        });


    if (points.length) {

        heatLayer =
            L.heatLayer(
                points,
                {
                    radius: 30,
                    blur: 20,
                    maxZoom: 17
                }
            ).addTo(map);

    }

}


function toggleHeatmap() {

    heatmapEnabled =
        !heatmapEnabled;


    const button =
        document.getElementById(
            "heatmapToggle"
        );


    button.textContent =
        heatmapEnabled
            ? "🔥 Hide Heatmap"
            : "🔥 Show Heatmap";


    updateHeatmap();

}


/* ================= LOCATION ================= */

function getLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            document.getElementById(
                "locationText"
            ).textContent =
                `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;


            if (map) {

                map.setView(
                    [latitude, longitude],
                    15
                );


                if (currentLocationMarker)
                    map.removeLayer(
                        currentLocationMarker
                    );


                currentLocationMarker =
                    L.marker(
                        [latitude, longitude]
                    )
                    .addTo(map)
                    .bindPopup(
                        "📍 Selected Location"
                    )
                    .openPopup();

            }

        },

        error => {

            alert(
                "Unable to get location. Please allow location permission."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );

}


/* ================= PHOTO ================= */

function handlePhoto(event) {

    const file =
        event.target.files[0];


    if (!file) {

        selectedPhoto = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload = function(e) {

        selectedPhoto =
            e.target.result;


        document.getElementById(
            "photoPreview"
        ).innerHTML =
            `<img src="${selectedPhoto}" alt="Waste photo">`;

    };


    reader.readAsDataURL(file);

}


/* ================= REPORT ================= */

function submitReport(event) {

    event.preventDefault();


    if (
        latitude === null ||
        longitude === null
    ) {

        alert(
            "Please select your location first."
        );

        return;

    }


    const wasteType =
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


    const report = {

        id: Date.now(),

        wasteType,

        quantity,

        description,

        photo: selectedPhoto,

        latitude,

        longitude,

        status: "Pending",

        createdAt:
            new Date().toISOString(),

        reportedBy:
            currentUser
                ? currentUser.username
                : "User"

    };


    reports.push(report);

    saveReports();


    document.getElementById(
        "reportForm"
    ).reset();


    document.getElementById(
        "photoPreview"
    ).innerHTML = "";


    document.getElementById(
        "locationText"
    ).textContent =
        "Location not selected";


    document.getElementById(
        "reportMessage"
    ).textContent =
        "✅ Waste report submitted successfully!";


    selectedPhoto = "";

    latitude = null;

    longitude = null;


    refreshAll();

}


/* ================= DISPLAY REPORTS ================= */

function displayReports() {

    const container =
        document.getElementById(
            "reportsList"
        );


    if (!reports.length) {

        container.innerHTML =
            `<p>No waste reports available.</p>`;

        return;

    }


    container.innerHTML =
        reports
        .slice()
        .reverse()
        .map(report => {

            const priority =
                calculatePriority(report);


            return `

                <div class="report-card">

                    <h3>
                        ${getTypeEmoji(
                            report.wasteType
                        )}
                        ${escapeHtml(
                            report.wasteType
                        )}
                    </h3>

                    <div class="report-meta">

                        <div>
                            📦 Quantity:
                            ${escapeHtml(
                                report.quantity || "Small"
                            )}
                        </div>

                        <div>
                            🚨 Priority:
                            <strong>
                                ${priority.priority}
                            </strong>
                        </div>

                        <div>
                            📋 Status:
                            <strong>
                                ${escapeHtml(
                                    report.status
                                )}
                            </strong>
                        </div>

                        <div>
                            📝 ${escapeHtml(
                                report.description
                            )}
                        </div>

                    </div>

                    ${
                        report.photo
                        ?
                        `<img
                            src="${report.photo}"
                            style="
                                max-width:180px;
                                border-radius:10px;
                                margin:10px 0;
                            "
                        >`
                        :
                        ""
                    }

                    <div class="report-actions">

                        <button
                            onclick="focusReport(${report.id})"
                        >
                            📍 View on Map
                        </button>

                        <button
                            onclick="changeStatus(${report.id}, 'In Progress')"
                        >
                            🚛 In Progress
                        </button>

                        <button
                            onclick="changeStatus(${report.id}, 'Collected')"
                        >
                            ✅ Collected
                        </button>

                    </div>

                </div>
            `;

        })
        .join("");

}


function getTypeEmoji(type) {

    if (type === "Plastic")
        return "🔵";

    if (type === "Organic")
        return "🟢";

    if (type === "Electronic")
        return "🟣";

    return "⚫";

}


/* ================= STATUS
