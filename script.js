// ===============================
// WASTE MAPPING PORTAL - SCRIPT
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------
    // ELEMENTS
    // -------------------------------

    const authPage = document.getElementById("authPage");
    const portalPage = document.getElementById("portalPage");

    const loginSection = document.getElementById("loginSection");
    const signupSection = document.getElementById("signupSection");

    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    const createAccountBtn = document.getElementById("createAccountBtn");
    const backToLoginBtn = document.getElementById("backToLoginBtn");

    const loginMessage = document.getElementById("loginMessage");
    const signupMessage = document.getElementById("signupMessage");

    const logoutBtn = document.getElementById("logoutBtn");
    const currentUserName = document.getElementById("currentUserName");


    // -------------------------------
    // DEFAULT USER
    // -------------------------------

    const defaultUser = {
        name: "Admin",
        username: "admin",
        password: "admin123"
    };

    // Create default account if no users exist
    if (!localStorage.getItem("wasteUsers")) {
        localStorage.setItem(
            "wasteUsers",
            JSON.stringify([defaultUser])
        );
    }


    // -------------------------------
    // SHOW LOGIN
    // -------------------------------

    function showLogin() {
        loginSection.classList.remove("hidden");
        signupSection.classList.add("hidden");

        loginMessage.textContent = "";
        signupMessage.textContent = "";
    }


    // -------------------------------
    // SHOW SIGNUP
    // -------------------------------

    function showSignup() {
        loginSection.classList.add("hidden");
        signupSection.classList.remove("hidden");

        loginMessage.textContent = "";
        signupMessage.textContent = "";
    }


    // -------------------------------
    // CREATE ACCOUNT PAGE
    // -------------------------------

    createAccountBtn.addEventListener("click", () => {
        showSignup();
    });


    // -------------------------------
    // BACK TO LOGIN
    // -------------------------------

    backToLoginBtn.addEventListener("click", () => {
        showLogin();
    });


    // -------------------------------
    // LOGIN
    // -------------------------------

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const username =
            document.getElementById("loginUsername").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const users =
            JSON.parse(localStorage.getItem("wasteUsers")) || [];

        const user = users.find(
            u =>
                u.username === username &&
                u.password === password
        );


        if (user) {

            // Save logged-in user
            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(user)
            );

            loginMessage.textContent =
                "Login successful! Opening dashboard...";

            loginMessage.style.color = "green";


            // Show portal
            setTimeout(() => {

                authPage.classList.add("hidden");
                portalPage.classList.remove("hidden");

                currentUserName.textContent = user.name;

                // Load portal functions
                initializePortal();

            }, 500);

        } else {

            loginMessage.textContent =
                "❌ Invalid username or password.";

            loginMessage.style.color = "red";
        }

    });


    // -------------------------------
    // SIGNUP
    // -------------------------------

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name =
            document.getElementById("signupName").value.trim();

        const username =
            document.getElementById("signupUsername").value.trim();

        const password =
            document.getElementById("signupPassword").value;

        const confirmPassword =
            document.getElementById("signupConfirmPassword").value;


        if (password !== confirmPassword) {

            signupMessage.textContent =
                "❌ Passwords do not match.";

            signupMessage.style.color = "red";

            return;
        }


        const users =
            JSON.parse(localStorage.getItem("wasteUsers")) || [];


        const existingUser = users.find(
            u => u.username === username
        );


        if (existingUser) {

            signupMessage.textContent =
                "❌ Username already exists.";

            signupMessage.style.color = "red";

            return;
        }


        const newUser = {
            name: name,
            username: username,
            password: password
        };


        users.push(newUser);

        localStorage.setItem(
            "wasteUsers",
            JSON.stringify(users)
        );


        signupMessage.textContent =
            "✅ Account created successfully!";

        signupMessage.style.color = "green";


        signupForm.reset();


        setTimeout(() => {
            showLogin();

            document.getElementById(
                "loginUsername"
            ).value = username;

        }, 800);

    });


    // -------------------------------
    // LOGOUT
    // -------------------------------

    logoutBtn.addEventListener("click", () => {

        localStorage.removeItem("loggedInUser");

        portalPage.classList.add("hidden");
        authPage.classList.remove("hidden");

        loginForm.reset();

        showLogin();

    });


    // -------------------------------
    // CHECK LOGIN ON PAGE LOAD
    // -------------------------------

    const loggedInUser =
        JSON.parse(localStorage.getItem("loggedInUser"));


    if (loggedInUser) {

        authPage.classList.add("hidden");
        portalPage.classList.remove("hidden");

        currentUserName.textContent =
            loggedInUser.name;

        initializePortal();

    } else {

        authPage.classList.remove("hidden");
        portalPage.classList.add("hidden");

    }


    // =================================================
    // PORTAL FUNCTIONS
    // =================================================

    function initializePortal() {

        initializeReports();
        initializeLocation();
        initializePhotoPreview();
        initializeMap();
        initializeFilters();
        initializeHeatmap();
        initializeCharts();

    }


    // -------------------------------
    // WASTE REPORT STORAGE
    // -------------------------------

    function getReports() {

        return JSON.parse(
            localStorage.getItem("wasteReports")
        ) || [];

    }


    function saveReports(reports) {

        localStorage.setItem(
            "wasteReports",
            JSON.stringify(reports)
        );

    }


    // -------------------------------
    // REPORT FORM
    // -------------------------------

    function initializeReports() {

        const reportForm =
            document.getElementById("reportForm");

        if (!reportForm) return;


        reportForm.onsubmit = function (event) {

            event.preventDefault();


            const wasteType =
                document.getElementById("wasteType").value;

            const wasteQuantity =
                document.getElementById("wasteQuantity").value;

            const description =
                document.getElementById("wasteDescription").value;

            const locationText =
                document.getElementById("locationText").textContent;


            if (!wasteType || !description) {

                alert("Please fill all required fields.");

                return;
            }


            const reports = getReports();


            const report = {

                id: Date.now(),

                wasteType: wasteType,

                quantity: wasteQuantity,

                description: description,

                location: locationText,

                status: "Pending",

                priority:
                    wasteQuantity === "Large"
                        ? "High"
                        : wasteQuantity === "Medium"
                            ? "Medium"
                            : "Low",

                date: new Date().toLocaleString()

            };


            reports.push(report);

            saveReports(reports);


            document.getElementById(
                "reportMessage"
            ).textContent =
                "✅ Waste report submitted successfully!";


            reportForm.reset();


            updateDashboard();

            displayReports();

            updateMap();

        };

    }


    // -------------------------------
    // GPS LOCATION
    // -------------------------------

    function initializeLocation() {

        const locationBtn =
            document.getElementById("locationBtn");

        if (!locationBtn) return;


        locationBtn.onclick = function () {

            const locationText =
                document.getElementById("locationText");


            if (!navigator.geolocation) {

                locationText.textContent =
                    "Geolocation is not supported.";

                return;
            }


            locationText.textContent =
                "📍 Getting location...";


            navigator.geolocation.getCurrentPosition(

                position => {

                    const latitude =
                        position.coords.latitude;

                    const longitude =
                        position.coords.longitude;


                    locationText.textContent =
                        `Lat: ${latitude.toFixed(6)}, ` +
                        `Lng: ${longitude.toFixed(6)}`;

                },

                error => {

                    locationText.textContent =
                        "❌ Unable to get location.";

                    console.log(error);

                }

            );

        };

    }


    // -------------------------------
    // PHOTO PREVIEW
    // -------------------------------

    function initializePhotoPreview() {

        const photoInput =
            document.getElementById("wastePhoto");

        const photoPreview =
            document.getElementById("photoPreview");


        if (!photoInput) return;


        photoInput.onchange = function () {

            photoPreview.innerHTML = "";


            const file =
                photoInput.files[0];


            if (!file) return;


            const img =
                document.createElement("img");


            img.src =
                URL.createObjectURL(file);


            img.style.maxWidth = "200px";
            img.style.marginTop = "10px";
            img.style.borderRadius = "8px";


            photoPreview.appendChild(img);

        };

    }


    // -------------------------------
    // DISPLAY REPORTS
    // -------------------------------

    function displayReports() {

        const reportsList =
            document.getElementById("reportsList");

        if (!reportsList) return;


        const reports = getReports();


        if (reports.length === 0) {

            reportsList.innerHTML =
                "<p>No waste reports available.</p>";

            updateDashboard();

            return;
        }


        reportsList.innerHTML = "";


        reports.forEach(report => {

            const card =
                document.createElement("div");


            card.className = "report-card";


            card.innerHTML = `

                <h3>${report.wasteType}</h3>

                <p>
                    <strong>Quantity:</strong>
                    ${report.quantity}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${report.description}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${report.location}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${report.status}
                </p>

                <p>
                    <strong>Priority:</strong>
                    ${report.priority}
                </p>

                <small>${report.date}</small>

            `;


            reportsList.appendChild(card);

        });


        updateDashboard();

    }


    // -------------------------------
    // DASHBOARD COUNTS
    // -------------------------------

    function updateDashboard() {

        const reports = getReports();


        const setText = (id, value) => {

            const element =
                document.getElementById(id);

            if (element) {
                element.textContent = value;
            }

        };


        setText(
            "totalReports",
            reports.length
        );


        setText(
            "plasticCount",
            reports.filter(
                r => r.wasteType === "Plastic"
            ).length
        );


        setText(
            "organicCount",
            reports.filter(
                r => r.wasteType === "Organic"
            ).length
        );


        setText(
            "electronicCount",
            reports.filter(
                r => r.wasteType === "Electronic"
            ).length
        );


        setText(
            "highPriorityCount",
            reports.filter(
                r => r.priority === "High"
            ).length
        );


        setText(
            "mediumPriorityCount",
            reports.filter(
                r => r.priority === "Medium"
            ).length
        );


        setText(
            "lowPriorityCount",
            reports.filter(
                r => r.priority === "Low"
            ).length
        );


        setText(
            "pendingCount",
            reports.filter(
                r => r.status === "Pending"
            ).length
        );


        setText(
            "progressCount",
            reports.filter(
                r => r.status === "In Progress"
            ).length
        );


        setText(
            "collectedCount",
            reports.filter(
                r => r.status === "Collected"
            ).length
        );

    }


    // -------------------------------
    // MAP
    // -------------------------------

    let map = null;
    let markers = [];


    function initializeMap() {

        const mapElement =
            document.getElementById("map");


        if (!mapElement) return;


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


    function updateMap() {

        if (!map) return;


        markers.forEach(marker => {

            map.removeLayer(marker);

        });


        markers = [];


        const reports = getReports();


        reports.forEach(report => {

            if (!report.location) return;


            const match =
                report.location.match(
                    /Lat:\s*([-0-9.]+),\s*Lng:\s*([-0-9.]+)/
                );


            if (!match) return;


            const lat =
                parseFloat(match[1]);

            const lng =
                parseFloat(match[2]);


            const marker =
                L.marker([lat, lng])
                    .addTo(map);


            marker.bindPopup(`

                <strong>${report.wasteType}</strong><br>

                Quantity: ${report.quantity}<br>

                Priority: ${report.priority}<br>

                Status: ${report.status}

            `);


            markers.push(marker);

        });

    }


    // -------------------------------
    // MAP FILTERS
    // -------------------------------

    function initializeFilters() {

        const typeFilter =
            document.getElementById("mapTypeFilter");

        const statusFilter =
            document.getElementById("mapStatusFilter");

        const priorityFilter =
            document.getElementById("priorityFilter");


        if (typeFilter) {

            typeFilter.onchange =
                applyFilters;

        }


        if (statusFilter) {

            statusFilter.onchange =
                applyFilters;

        }


        if (priorityFilter) {

            priorityFilter.onchange =
                applyFilters;

        }

    }


    function applyFilters() {

        const type =
            document.getElementById(
                "mapTypeFilter"
            ).value;


        const status =
            document.getElementById(
                "mapStatusFilter"
            ).value;


        const priority =
            document.getElementById(
                "priorityFilter"
            ).value;


        const reports =
            getReports().filter(report =>

                (type === "All" ||
                    report.wasteType === type) &&

                (status === "All" ||
                    report.status === status) &&

                (priority === "All" ||
                    report.priority === priority)

            );


        console.log(
            "Filtered Reports:",
            reports
        );

    }


    // -------------------------------
    // HEATMAP
    // -------------------------------

    function initializeHeatmap() {

        const heatmapToggle =
            document.getElementById(
                "heatmapToggle"
            );


        if (!heatmapToggle) return;


        heatmapToggle.onclick = function () {

            alert(
                "Heatmap feature is ready for GPS-based reports."
            );

        };

    }


    // -------------------------------
    // CHARTS
    // -------------------------------

    function initializeCharts() {

        updateCharts();

    }


    function updateCharts() {

        if (typeof Chart === "undefined") {
            return;
        }


        const reports = getReports();


        const plastic =
            reports.filter(
                r => r.wasteType === "Plastic"
            ).length;


        const organic =
            reports.filter(
                r => r.wasteType === "Organic"
            ).length;


        const electronic =
            reports.filter(
                r => r.wasteType === "Electronic"
            ).length;


        const other =
            reports.filter(
                r => r.wasteType === "Other"
            ).length;


        const wasteCanvas =
            document.getElementById(
                "wasteChart"
            );


        if (wasteCanvas) {

            new Chart(
                wasteCanvas,
                {

                    type: "bar",

                    data: {

                        labels: [
                            "Plastic",
                            "Organic",
                            "Electronic",
                            "Other"
                        ],

                        datasets: [
                            {
                                label:
                                    "Waste Reports",

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
                        responsive: true
                    }

                }
            );

        }

    }


    // -------------------------------
    // INITIAL LOAD
    // -------------------------------

    if (!localStorage.getItem("loggedInUser")) {
        showLogin();
    }

});
