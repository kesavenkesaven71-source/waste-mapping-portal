
const SUPABASE_URL =
    "https://bpapvncrqygkpekesuhp.supabase.co";

const SUPABASE_KEY = "sb_publishable_Wj5xsptHKI3f7jp-oV_DGA_3v2LkAD_";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // ELEMENTS
    // =========================

    const $ = id => document.getElementById(id);

    const authPage = $("authPage");
    const portalPage = $("portalPage");

    const loginSection = $("loginSection");
    const signupSection = $("signupSection");

    const loginForm = $("loginForm");
    const signupForm = $("signupForm");

    const loginMessage = $("loginMessage");
    const signupMessage = $("signupMessage");

    const createAccountBtn = $("createAccountBtn");
    const backToLoginBtn = $("backToLoginBtn");

    const forgotPasswordBtn = $("forgotPasswordBtn");
    const resetPasswordSection = $("resetPasswordSection");
    const resetPasswordForm = $("resetPasswordForm");
    const resetMessage = $("resetMessage");

    const logoutBtn = $("logoutBtn");
    const currentUserName = $("currentUserName");

    let map = null;
    let markers = [];
    let heatLayer = null;
    let wasteChart = null;
    let statusChart = null;

    let portalInitialized = false;
    let recoveryMode = false;

    // =========================
    // AUTH PAGE
    // =========================

    function showLogin() {

        recoveryMode = false;

        authPage.classList.remove("hidden");
        portalPage.classList.add("hidden");

        loginSection.classList.remove("hidden");
        signupSection.classList.add("hidden");

        resetPasswordSection?.classList.add("hidden");

        loginMessage.textContent = "";
        signupMessage.textContent = "";

    }

    function showSignup() {

        loginSection.classList.add("hidden");
        signupSection.classList.remove("hidden");

        loginMessage.textContent = "";
        signupMessage.textContent = "";

    }

    createAccountBtn.addEventListener("click", showSignup);

    backToLoginBtn.addEventListener("click", showLogin);

    // =========================
    // OPEN DASHBOARD
    // =========================

    function openDashboard(user) {

        if (!user || recoveryMode) return;

        authPage.classList.add("hidden");
        portalPage.classList.remove("hidden");

        currentUserName.textContent =
            user.user_metadata?.name ||
            user.email ||
            "User";

        initializePortal();

        if (map) {
            setTimeout(() => map.invalidateSize(), 150);
        }

    }

    // =========================
    // LOGIN
    // =========================

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();

        const email = $("loginUsername").value.trim();
        const password = $("loginPassword").value;

        loginMessage.textContent = "Logging in...";
        loginMessage.style.color = "orange";

        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            loginMessage.textContent =
                "✅ Login successful!";

            loginMessage.style.color = "green";

            openDashboard(data.user);

        } catch (error) {

            loginMessage.textContent =
                "❌ " + error.message;

            loginMessage.style.color = "red";

        }

    });

    // =========================
    // SIGNUP
    // =========================

    signupForm.addEventListener("submit", async event => {

        event.preventDefault();

        const name = $("signupName").value.trim();

        const email = $("signupUsername").value.trim();

        const password = $("signupPassword").value;

        const confirmPassword =
            $("signupConfirmPassword").value;

        if (password !== confirmPassword) {

            signupMessage.textContent =
                "❌ Passwords do not match!";

            signupMessage.style.color = "red";
            return;

        }

        if (password.length < 6) {

            signupMessage.textContent =
                "❌ Password must contain at least 6 characters!";

            signupMessage.style.color = "red";
            return;

        }

        signupMessage.textContent = "Creating account...";
        signupMessage.style.color = "orange";

        try {

            const { data, error } =
                await supabaseClient.auth.signUp({

                    email,
                    password,

                    options: {
                        data: {
                            name
                        }
                    }

                });

            if (error) throw error;

            signupMessage.style.color = "green";

            if (data.session && data.user) {

                signupMessage.textContent =
                    "✅ Account created successfully!";

                signupForm.reset();

                openDashboard(data.user);

            } else {

                signupMessage.textContent =
                    "✅ Signup request completed. If email confirmation is enabled, check your inbox. If already registered, use Forgot Password.";

                signupForm.reset();

            }

        } catch (error) {

            signupMessage.textContent =
                "❌ " + error.message;

            signupMessage.style.color = "red";

        }

    });

    // =========================
    // FORGOT PASSWORD
    // =========================

    forgotPasswordBtn.addEventListener("click", async () => {

        const email = $("loginUsername").value.trim();

        if (!email) {

            loginMessage.textContent =
                "❌ First enter your email address.";

            loginMessage.style.color = "red";
            return;

        }

        forgotPasswordBtn.disabled = true;

        loginMessage.textContent =
            "Sending password reset email...";

        loginMessage.style.color = "orange";

        try {

            const redirectURL =
                window.location.origin +
                window.location.pathname;

            const { error } =
                await supabaseClient.auth.resetPasswordForEmail(
                    email,
                    {
                        redirectTo: redirectURL
                    }
                );

            if (error) throw error;

            loginMessage.textContent =
                "✅ If this email has an account, a password reset link will be sent. Check Inbox and Spam.";

            loginMessage.style.color = "green";

        } catch (error) {

            loginMessage.textContent =
                "❌ " + error.message;

            loginMessage.style.color = "red";

        } finally {

            forgotPasswordBtn.disabled = false;

        }

    });

    // =========================
    // PASSWORD RECOVERY SCREEN
    // =========================

    function showResetPassword() {

        recoveryMode = true;

        authPage.classList.remove("hidden");
        portalPage.classList.add("hidden");

        signupSection.classList.add("hidden");
        loginSection.classList.remove("hidden");

        loginForm.classList.add("hidden");

        forgotPasswordBtn.classList.add("hidden");

        resetPasswordSection.classList.remove("hidden");

        loginMessage.textContent =
            "Enter your new password below.";

        loginMessage.style.color = "green";

    }

    function restoreLoginScreen() {

        loginForm.classList.remove("hidden");

        forgotPasswordBtn.classList.remove("hidden");

        resetPasswordSection.classList.add("hidden");

        recoveryMode = false;

        showLogin();

    }

    // =========================
    // UPDATE PASSWORD
    // =========================

    resetPasswordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const password = $("newPassword").value;

            const confirmPassword =
                $("confirmNewPassword").value;

            if (password !== confirmPassword) {

                resetMessage.textContent =
                    "❌ Passwords do not match!";

                resetMessage.style.color = "red";
                return;

            }

            if (password.length < 6) {

                resetMessage.textContent =
                    "❌ Minimum 6 characters required.";

                resetMessage.style.color = "red";
                return;

            }

            resetMessage.textContent =
                "Updating password...";

            resetMessage.style.color = "orange";

            try {

                const { data, error } =
                    await supabaseClient.auth.updateUser({
                        password
                    });

                if (error) throw error;

                resetMessage.textContent =
                    "✅ Password updated successfully!";

                resetMessage.style.color = "green";

                resetPasswordForm.reset();

                await supabaseClient.auth.signOut();

                restoreLoginScreen();

                loginMessage.textContent =
                    "✅ Password changed. Login using your new password.";

                loginMessage.style.color = "green";

            } catch (error) {

                resetMessage.textContent =
                    "❌ " + error.message;

                resetMessage.style.color = "red";

            }

        }
    );

    // =========================
    // AUTH STATE
    // =========================

    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            if (event === "PASSWORD_RECOVERY") {

                showResetPassword();
                return;

            }

            if (event === "SIGNED_OUT" && !recoveryMode) {

                portalPage.classList.add("hidden");
                authPage.classList.remove("hidden");

            }

        }
    );

    // =========================
    // LOGOUT
    // =========================

    logoutBtn.addEventListener("click", async () => {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {

            alert(error.message);
            return;

        }

        loginForm.reset();

        restoreLoginScreen();

    });

    // =========================
    // CHECK LOGIN
    // =========================

    async function checkLogin() {

        try {

            const { data, error } =
                await supabaseClient.auth.getUser();

            if (recoveryMode) return;

            if (error || !data.user) {

                showLogin();
                return;

            }

            openDashboard(data.user);

        } catch (error) {

            console.error(error);

            if (!recoveryMode) showLogin();

        }

    }

    // =========================
    // PORTAL INITIALIZATION
    // =========================

    function initializePortal() {

        if (portalInitialized) return;

        portalInitialized = true;

        initializeReports();
        initializeLocation();
        initializePhotoPreview();

        initializeMap();
        initializeFilters();
        initializeHeatmap();

        refreshPortal();

    }

    // =========================
    // REPORT STORAGE
    // =========================

    function getReports() {

        try {

            return JSON.parse(
                localStorage.getItem("wasteReports") || "[]"
            );

        } catch {

            return [];

        }

    }

    function saveReports(reports) {

        localStorage.setItem(
            "wasteReports",
            JSON.stringify(reports)
        );

    }

    // =========================
    // PHOTO UPLOAD
    // =========================

    async function uploadWastePhoto() {

        const file = $("wastePhoto")?.files[0];

        if (!file) return null;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            throw new Error(
                "Only JPG, PNG and WEBP images are allowed."
            );

        }

        if (file.size > 5 * 1024 * 1024) {

            throw new Error(
                "Photo must be below 5 MB."
            );

        }

        const { data: userData, error: userError } =
            await supabaseClient.auth.getUser();

        if (userError || !userData.user) {

            throw new Error(
                "Please login before uploading."
            );

        }

        const extension = file.type
            .split("/")[1]
            .replace("jpeg", "jpg");

        const fileName =
            userData.user.id + "/" +
            crypto.randomUUID() + "." + extension;

        const { data, error } =
            await supabaseClient.storage
                .from("waste-photos")
                .upload(fileName, file, {

                    contentType: file.type,
                    upsert: false

                });

        if (error) throw error;

        const { data: urlData } =
            supabaseClient.storage
                .from("waste-photos")
                .getPublicUrl(data.path);

        return urlData.publicUrl;

    }

    // =========================
    // REPORT FORM
    // =========================

    function initializeReports() {

        const reportForm = $("reportForm");

        if (!reportForm) return;

        reportForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const wasteType = $("wasteType").value;

                const quantity = $("wasteQuantity").value;

                const description =
                    $("wasteDescription").value.trim();

                const location =
                    $("locationText").textContent;

                const message = $("reportMessage");

                if (!wasteType || !description) {

                    message.textContent =
                        "❌ Please fill all required fields.";

                    return;

                }

                const submitBtn =
                    reportForm.querySelector(
                        '[type="submit"]'
                    );

                submitBtn.disabled = true;

                message.textContent =
                    "Submitting report...";

                try {

                    const photoURL =
                        await uploadWastePhoto();

                    const report = {

                        id: Date.now(),

                        wasteType,

                        quantity,

                        description,

                        location,

                        photoURL,

                        status: "Pending",

                        priority:
                            quantity === "Large"
                                ? "High"
                                : quantity === "Medium"
                                    ? "Medium"
                                    : "Low",

                        date:
                            new Date().toLocaleString()

                    };

                    const reports = getReports();

                    reports.push(report);

                    saveReports(reports);

                    message.textContent =
                        "✅ Waste report submitted successfully!";

                    message.style.color = "green";

                    reportForm.reset();

                    $("photoPreview").innerHTML = "";

                    $("locationText").textContent =
                        "Location not selected";

                    refreshPortal();

                } catch (error) {

                    console.error(error);

                    message.textContent =
                        "❌ " + error.message;

                    message.style.color = "red";

                } finally {

                    submitBtn.disabled = false;

                }

            }
        );

    }

    // =========================
    // GPS LOCATION
    // =========================

    function initializeLocation() {

        const locationBtn = $("locationBtn");

        if (!locationBtn) return;

        locationBtn.addEventListener("click", () => {

            if (!navigator.geolocation) {

                $("locationText").textContent =
                    "Geolocation not supported.";

                return;

            }

            $("locationText").textContent =
                "Getting location...";

            navigator.geolocation.getCurrentPosition(

                position => {

                    const lat =
                        position.coords.latitude.toFixed(6);

                    const lng =
                        position.coords.longitude.toFixed(6);

                    $("locationText").textContent =
                        `Lat: ${lat}, Lng: ${lng}`;

                },

                error => {

                    $("locationText").textContent =
                        "Unable to get location.";

                    console.error(error);

                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000
                }

            );

        });

    }

    // =========================
    // PHOTO PREVIEW
    // =========================

    function initializePhotoPreview() {

        const photoInput = $("wastePhoto");
        const preview = $("photoPreview");

        if (!photoInput || !preview) return;

        photoInput.addEventListener("change", () => {

            preview.innerHTML = "";

            const file = photoInput.files[0];

            if (!file) return;

            const image =
                document.createElement("img");

            const objectURL =
                URL.createObjectURL(file);

            image.src = objectURL;

            image.style.maxWidth = "200px";
            image.style.marginTop = "10px";
            image.style.borderRadius = "8px";

            image.onload = () =>
                URL.revokeObjectURL(objectURL);

            preview.appendChild(image);

        });

    }

    // =========================
    // DISPLAY REPORTS
    // =========================

    function displayReports() {

        const reportsList = $("reportsList");

        if (!reportsList) return;

        const reports = getReports();

        reportsList.innerHTML = "";

        if (reports.length === 0) {

            reportsList.textContent =
                "No waste reports available.";

            return;

        }

        reports.slice().reverse().forEach(report => {

            const card =
                document.createElement("div");

            card.className = "report-card";

            const heading =
                document.createElement("h3");

            heading.textContent = report.wasteType;

            card.appendChild(heading);

            function addDetail(label, value) {

                const p =
                    document.createElement("p");

                const strong =
                    document.createElement("strong");

                strong.textContent = label + ": ";

                p.appendChild(strong);

                p.appendChild(
                    document.createTextNode(value || "-")
                );

                card.appendChild(p);

            }

            addDetail("Quantity", report.quantity);
            addDetail("Description", report.description);
            addDetail("Location", report.location);
            addDetail("Status", report.status);
            addDetail("Priority", report.priority);
            addDetail("Date", report.date);

            if (report.photoURL) {

                const img =
                    document.createElement("img");

                img.src = report.photoURL;

                img.alt = "Waste Report Photo";

                img.style.width = "180px";
                img.style.maxWidth = "100%";
                img.style.borderRadius = "8px";
                img.style.marginTop = "10px";

                card.appendChild(img);

            }

            reportsList.appendChild(card);

        });

    }

    // =========================
    // DASHBOARD COUNTS
    // =========================

    function updateDashboard() {

        const reports = getReports();

        function setText(id, value) {

            const element = $(id);

            if (element) {
                element.textContent = value;
            }

        }

        const count = (field, value) =>
            reports.filter(
                report => report[field] === value
            ).length;

        setText("totalReports", reports.length);

        setText(
            "plasticCount",
            count("wasteType", "Plastic")
        );

        setText(
            "organicCount",
            count("wasteType", "Organic")
        );

        setText(
            "electronicCount",
            count("wasteType", "Electronic")
        );

        setText(
            "highPriorityCount",
            count("priority", "High")
        );

        setText(
            "mediumPriorityCount",
            count("priority", "Medium")
        );

        setText(
            "lowPriorityCount",
            count("priority", "Low")
        );

        setText(
            "pendingCount",
            count("status", "Pending")
        );

        setText(
            "progressCount",
            count("status", "In Progress")
        );

        setText(
            "collectedCount",
            count("status", "Collected")
        );

        const frequency = {};

        reports.forEach(report => {

            const coords =
                getCoordinates(report.location);

            if (!coords) return;

            const key = coords
                .map(value => value.toFixed(3))
                .join(",");

            frequency[key] =
                (frequency[key] || 0) + 1;

        });

        const hotspots =
            Object.values(frequency)
                .filter(total => total >= 3)
                .length;

        setText("hotspotCount", hotspots);

    }

    // =========================
    // MAP
    // =========================

    function initializeMap() {

        if (!$("map") || typeof L === "undefined") {
            return;
        }

        if (map) return;

        map = L.map("map").setView(
            [13.0827, 80.2707],
            10
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

        updateMap();

    }

    function getCoordinates(location) {

        if (!location) return null;

        const match = location.match(
            /Lat:\s*(-?[\d.]+),\s*Lng:\s*(-?[\d.]+)/
        );

        if (!match) return null;

        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return null;
        }

        if (
            Math.abs(lat) > 90 ||
            Math.abs(lng) > 180
        ) {
            return null;
        }

        return [lat, lng];

    }

    // =========================
    // FILTER REPORTS
    // =========================

    function getFilteredReports() {

        const type =
            $("mapTypeFilter")?.value || "All";

        const status =
            $("mapStatusFilter")?.value || "All";

        const priority =
            $("priorityFilter")?.value || "All";

        return getReports().filter(report =>

            (type === "All" ||
                report.wasteType === type) &&

            (status === "All" ||
                report.status === status) &&

            (priority === "All" ||
                report.priority === priority)

        );

    }

    // =========================
    // UPDATE MAP
    // =========================

    function updateMap() {

        if (!map) return;

        markers.forEach(marker => {
            map.removeLayer(marker);
        });

        markers = [];

        if (heatLayer) {

            map.removeLayer(heatLayer);
            heatLayer = null;

        }

        const reports = getFilteredReports();

        reports.forEach(report => {

            const coords =
                getCoordinates(report.location);

            if (!coords) return;

            const marker =
                L.marker(coords).addTo(map);

            const popup =
                document.createElement("div");

            const heading =
                document.createElement("strong");

            heading.textContent = report.wasteType;

            popup.appendChild(heading);

            [
                ["Quantity", report.quantity],
                ["Priority", report.priority],
                ["Status", report.status]
            ].forEach(([label, value]) => {

                const p =
                    document.createElement("p");

                p.textContent =
                    label + ": " + value;

                popup.appendChild(p);

            });

            marker.bindPopup(popup);

            markers.push(marker);

        });

        const heatButton = $("heatmapToggle");

        if (
            heatButton?.dataset.active === "true" &&
            typeof L.heatLayer === "function"
        ) {

            const heatPoints = reports
                .map(report =>
                    getCoordinates(report.location)
                )
                .filter(Boolean)
                .map(coords => [...coords, 0.7]);

            heatLayer = L.heatLayer(
                heatPoints,
                {
                    radius: 25,
                    blur: 15
                }
            ).addTo(map);

        }

    }

    // =========================
    // MAP FILTERS
    // =========================

    function initializeFilters() {

        [
            "mapTypeFilter",
            "mapStatusFilter",
            "priorityFilter"
        ].forEach(id => {

            const element = $(id);

            if (element) {

                element.addEventListener(
                    "change",
                    updateMap
                );

            }

        });

    }

    // =========================
    // HEATMAP
    // =========================

    function initializeHeatmap() {

        const button = $("heatmapToggle");

        if (!button) return;

        button.dataset.active = "false";

        button.addEventListener("click", () => {

            if (typeof L.heatLayer !== "function") {

                alert(
                    "Heatmap library is not loaded."
                );

                return;

            }

            const active =
                button.dataset.active === "true";

            button.dataset.active = String(!active);

            button.textContent = active
                ? "🔥 Show Heatmap"
                : "🔥 Hide Heatmap";

            updateMap();

        });

    }

    // =========================
    // CHARTS
    // =========================

    function updateCharts() {

        if (typeof Chart === "undefined") return;

        const reports = getReports();

        const count = (field, value) =>
            reports.filter(
                report => report[field] === value
            ).length;

        const wasteCanvas = $("wasteChart");

        if (wasteChart) {

            wasteChart.destroy();
            wasteChart = null;

        }

        if (wasteCanvas) {

            wasteChart = new Chart(wasteCanvas, {

                type: "bar",

                data: {

                    labels: [
                        "Plastic",
                        "Organic",
                        "Electronic",
                        "Other"
                    ],

                    datasets: [{

                        label: "Waste Reports",

                        data: [

                            count("wasteType", "Plastic"),

                            count("wasteType", "Organic"),

                            count("wasteType", "Electronic"),

                            count("wasteType", "Other")

                        ]

                    }]

                },

                options: {

                    responsive: true,

                    scales: {

                        y: {

                            beginAtZero: true,

                            ticks: {
                                precision: 0
                            }

                        }

                    }

                }

            });

        }

        const statusCanvas = $("statusChart");

        if (statusChart) {

            statusChart.destroy();
            statusChart = null;

        }

        if (statusCanvas) {

            statusChart = new Chart(statusCanvas, {

                type: "doughnut",

                data: {

                    labels: [
                        "Pending",
                        "In Progress",
                        "Collected"
                    ],

                    datasets: [{

                        label: "Collection Status",

                        data: [

                            count("status", "Pending"),

                            count("status", "In Progress"),

                            count("status", "Collected")

                        ]

                    }]

                },

                options: {
                    responsive: true
                }

            });

        }

    }

    // =========================
    // REFRESH PORTAL
    // =========================

    function refreshPortal() {

        displayReports();

        updateDashboard();

        updateMap();

        updateCharts();

    }

    // =========================
    // START APPLICATION
    // =========================

    const recoveryHash =
        window.location.hash.includes("type=recovery");

    if (recoveryHash) {

        recoveryMode = true;
        showResetPassword();

    } else {

        checkLogin();

    }

});
