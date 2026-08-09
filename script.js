let latitude = null;
let longitude = null;

let reports = JSON.parse(localStorage.getItem("wasteReports")) || [];

// Map
let map = L.map("map").setView([9.9252, 78.1198], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
}).addTo(map);


// -----------------------------
// GET LOCATION
// -----------------------------


function getLocation() {

    if (!navigator.geolocation) {

        document.getElementById("location").innerText =
            "Location support இல்லை.";

        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            document.getElementById("location").innerText =
                "Location: " +
                latitude.toFixed(6) +
                ", " +
                longitude.toFixed(6);

            // Move map to current location
            map.setView([latitude, longitude], 16);

            // User location marker
            L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup("📍 Your Location")
                .openPopup();
        },

        function() {

            document.getElementById("location").innerText =
                "Location கிடைக்கவில்லை.";
        }
    );
}


// -----------------------------
// SUBMIT REPORT
// -----------------------------

function submitReport() {

    const wasteType =
        document.getElementById("wasteType").value;

    const description =
        document.getElementById("description").value.trim();


    // Check waste type
    if (wasteType === "") {

        alert("Waste type select பண்ணுங்க.");

        return;
    }


    // Check location
    if (latitude === null || longitude === null) {

        alert("முதலில் Get My Location click பண்ணுங்க.");

        return;
    }


    // Create report object
    const newReport = {

        wasteType: wasteType,

        description: description,

        latitude: latitude,

        longitude: longitude,

        date: new Date().toLocaleString()
    };


    // Save report
    reports.push(newReport);

    localStorage.setItem(
        "wasteReports",
        JSON.stringify(reports)
    );


    // Add marker to map
    L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(
            "<b>Waste Type:</b> " +
            wasteType +
            "<br><b>Description:</b> " +
            description
        );


    // Refresh dashboard
    displayReports();

    updateStats();


    alert("✅ Waste report successfully submitted!");


    // Clear form
    document.getElementById("wasteType").value = "";

    document.getElementById("description").value = "";

    document.getElementById("location").innerText =
        "Location not detected";

    latitude = null;
    longitude = null;
}


// -----------------------------
// DISPLAY REPORTS
// -----------------------------

function displayReports() {

    const reportsContainer =
        document.getElementById("reports");

    reportsContainer.innerHTML = "";


    if (reports.length === 0) {

        reportsContainer.innerHTML =
            "<p>No reports available.</p>";

        return;
    }


    reports.forEach(function(report) {

        const reportBox =
            document.createElement("div");


        reportBox.innerHTML = `
            <hr>
            <p>
                <strong>Waste Type:</strong>
                ${report.wasteType}
            </p>

            <p>
                <strong>Description:</strong>
                ${report.description || "No description"}
            </p>
            <p>
                <strong>Location:</strong>
                ${Number(report.latitude).toFixed(6)},
                ${Number(report.longitude).toFixed(6)}
            </p>

            <p>
                <strong>Date:</strong>
                ${report.date}
            </p>
        `;


        reportsContainer.appendChild(reportBox);
    });
}


// -----------------------------
// UPDATE STATISTICS
// -----------------------------

function updateStats() {

    let totalReports = reports.length;

    let plasticCount = 0;

    let organicCount = 0;

    let electronicCount = 0;


    reports.forEach(function(report) {

        if (report.wasteType === "Plastic") {
            plasticCount++;
        }

        if (report.wasteType === "Organic") {
            organicCount++;
        }

        if (report.wasteType === "Electronic") {
            electronicCount++;
        }
    });


    document.getElementById("totalReports").innerText =
        totalReports;

    document.getElementById("plasticCount").innerText =
        plasticCount;

    document.getElementById("organicCount").innerText =
        organicCount;

    document.getElementById("electronicCount").innerText =
        electronicCount;
}


// -----------------------------
// LOAD SAVED REPORTS
// -----------------------------

function loadSavedReports() {

    reports.forEach(function(report) {

        L.marker([
            Number(report.latitude),
            Number(report.longitude)
        ])
        .addTo(map)
        .bindPopup(
            "<b>Waste:</b> " +
            report.wasteType +
            "<br><b>Description:</b> " +
            (report.description || "No description")
        );
    });
}


// -----------------------------
// PAGE LOAD
// -----------------------------

window.onload = function() {

    displayReports();

    updateStats();

    loadSavedReports();
};
