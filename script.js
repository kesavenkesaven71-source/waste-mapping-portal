points.push([
                    Number(report.latitude),
                    Number(report.longitude),
                    getHeatIntensity(report)
                ]);

        }

    });


    if (points.length > 0) {

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


/* =====================================================
   TOGGLE HEATMAP
===================================================== */

function toggleHeatmap() {

    heatmapEnabled =
        !heatmapEnabled;

    const button =
        document.getElementById(
            "heatmapToggle"
        );

    if (button) {

        button.textContent =
            heatmapEnabled
                ? "🔥 Hide Heatmap"
                : "🔥 Show Heatmap";

    }

    updateHeatmap();

}


/* =====================================================
   LOCATION
===================================================== */

function getLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by this browser."
        );

        return;

    }


    navigator.geolocation.getCurrentPosition(

        function(position) {

            latitude =
                position.coords.latitude;

            longitude =
                position.coords.longitude;


            const locationText =
                document.getElementById(
                    "locationText"
                );

            if (locationText) {

                locationText.textContent =
                    `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

            }


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
                        "📍 Selected Location"
                    )
                    .openPopup();

            }

        },

        function() {

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


/* =====================================================
   PHOTO
===================================================== */

function handlePhoto(event) {

    const file =
        event.target.files[0];


    if (!file) {

        selectedPhoto = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            selectedPhoto =
                e.target.result;


            const preview =
                document.getElementById(
                    "photoPreview"
                );


            if (preview) {

                preview.innerHTML =
                    `
                    <img
                        src="${selectedPhoto}"
                        alt="Waste photo"
                    >
                    `;

            }

        };


    reader.readAsDataURL(file);

}


/* =====================================================
   SUBMIT REPORT
===================================================== */

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
        )?.value || "Other";


    const quantity =
        document.getElementById(
            "wasteQuantity"
        )?.value || "Small";


    const description =
        document.getElementById(
            "wasteDescription"
        )?.value.trim() || "";


    if (!description) {

        alert(
            "Please enter a description."
        );

        return;

    }


    const report = {

        id: Date.now(),

        wasteType:
            wasteType,

        quantity:
            quantity,

        description:
            description,

        photo:
            selectedPhoto,

        latitude:
            latitude,

        longitude:
            longitude,

        status:
            "Pending",

        createdAt:
            new Date().toISOString(),

        reportedBy:
            currentUser
                ? currentUser.username
                : "User"

    };


    reports.push(report);

    saveReports();


    const form =
        document.getElementById(
            "reportForm"
        );

    if (form) {

        form.reset();

    }


    selectedPhoto = "";

    latitude = null;

    longitude = null;


    const preview =
        document.getElementById(
            "photoPreview"
        );

    if (preview) {

        preview.innerHTML = "";

    }


    const locationText =
        document.getElementById(
            "locationText"
        );

    if (locationText) {

        locationText.textContent =
            "Location not selected";

    }


    const message =
        document.getElementById(
            "reportMessage"
        );

    if (message) {

        message.textContent =
            "✅ Waste report submitted successfully!";

        message.className =
            "success-message";

    }


    initializePortal();

}


/* =====================================================
   CHANGE STATUS
===================================================== */

function changeStatus(
    reportId,
    newStatus
) {

    const report =
        reports.find(
            item =>
                String(item.id) ===
                String(reportId)
        );


    if (!report) {

        return;

    }


    report.status =
        newStatus;


    saveReports();


    initializePortal();

}


/* =====================================================
   VIEW REPORT ON MAP
===================================================== */

function focusReport(reportId) {

    const report =
        reports.find(
            item =>
                String(item.id) ===
                String(reportId)
        );


    if (!report || !map) {

        return;

    }


    if (
        report.latitude == null ||
        report.longitude == null
    ) {

        return;

    }


    map.setView(
        [
            Number(report.latitude),
            Number(report.longitude)
        ],
        16
    );


    const marker =
        reportMarkers[report.id];


    if (marker) {

        marker.openPopup();

    }

}


/* =====================================================
   DISPLAY REPORTS
===================================================== */

function displayReports() {

    const container =
        document.getElementById(
            "reportsList"
        );


    if (!container) {

        return;

    }


    if (reports.length === 0) {

        container.innerHTML =
            `
            <p>
                No waste reports available.
            </p>
            `;

        return;

    }


    container.innerHTML =
        reports
        .slice()
        .reverse()
        .map(report => {

            const wasteType =
                report.wasteType ||
                report.type ||
                "Other";


            const priority =
                calculatePriority(report);


            return `

                <div class="report-card">

                    <h3>

                        ${getWasteEmoji(
                            wasteType
                        )}

                        ${escapeHTML(
                            wasteType
                        )}

                    </h3>


                    <p>
                        📦 Quantity:
                        <strong>
                            ${escapeHTML(
                                report.quantity ||
                                "Small"
                            )}
                        </strong>
                    </p>


                    <p>
                        🚨 Priority:
                        <strong>
                            ${getPriorityEmoji(
                                priority
                            )}
                            ${priority}
                        </strong>
                    </p>


                    <p>
                        📋 Status:
                        <strong>
                            ${escapeHTML(
                                report.status ||
                                "Pending"
                            )}
                        </strong>
                    </p>


                    <p>
                        📝
                        ${escapeHTML(
                            report.description ||
                            ""
                        )}
                    </p>


                    ${
                        report.photo
                            ?
                            `
                            <img
                                src="${report.photo}"
                                alt="Waste photo"
                                style="
                                    max-width:180px;
                                    border-radius:10px;
                                    margin:10px 0;
                                "
                            >
                            `
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
                            onclick="changeStatus(
                                ${report.id},
                                'In Progress'
                            )"
                        >
                            🚛 In Progress
                        </button>


                        <button
                            onclick="changeStatus(
                                ${report.id},
                                'Collected'
                            )"
                        >
                            ✅ Collected
                        </button>

                    </div>

                </div>

            `;

        })
        .join("");

}


/* =====================================================
   STATS
===================================================== */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


function updateStats() {

    setText(
        "totalReports",
        reports.length
    );


    setText(
        "plasticCount",
        reports.filter(
            r =>
                (
                    r.wasteType ||
                    r.type
                ) === "Plastic"
        ).length
    );


    setText(
        "organicCount",
        reports.filter(
            r =>
                (
                    r.wasteType ||
                    r.type
                ) === "Organic"
        ).length
    );


    setText(
        "electronicCount",
        reports.filter(
            r =>
                (
                    r.wasteType ||
                    r.type
                ) === "Electronic"
        ).length
    );


    setText(
        "pendingCount",
        reports.filter(
            r =>
                r.status === "Pending"
        ).length
    );


    setText(
        "progressCount",
        reports.filter(
            r =>
                r.status === "In Progress"
        ).length
    );


    setText(
        "collectedCount",
        reports.filter(
            r =>
                r.status === "Collected"
        ).length
    );

}


/* =====================================================
   ANALYTICS
===================================================== */

function updateAnalytics() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    const wasteCanvas =
        document.getElementById(
            "wasteChart"
        );


    const statusCanvas =
        document.getElementById(
            "statusChart"
        );


    if (
        wasteCanvas &&
        wasteCanvas.getContext
    ) {

        const wasteData = [

            reports.filter(
                r =>
                    (
                        r.wasteType ||
                        r.type
                    ) === "Plastic"
            ).length,

            reports.filter(
                r =>
                    (
                        r.wasteType ||
                        r.type
                    ) === "Organic"
            ).length,

            reports.filter(
                r =>
                    (
                        r.wasteType ||
                        r.type
                    ) === "Electronic"
            ).length,

            reports.filter(
                r =>
                    (
                        r.wasteType ||
                        r.type
                    ) === "Other"
            ).length

        ];


        if (wasteChart) {

            wasteChart.destroy();

        }


        wasteChart =
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

                                data:
                                    wasteData
                            }

                        ]

                    },

                    options: {
                        responsive: true
                    }

                }
            );

    }


    if (
        statusCanvas &&
        statusCanvas.getContext
    ) {

        const statusData = [

            reports.filter(
                r =>
                    r.status ===
                    "Pending"
            ).length,

            reports.filter(
                r =>
                    r.status ===
                    "In Progress"
            ).length,

            reports.filter(
                r =>
                    r.status ===
                    "Collected"
            ).length

        ];


        if (statusChart) {

            statusChart.destroy();

        }


        statusChart =
            new Chart(
                statusCanvas,
                {
                    type:
                        "doughnut",

                    data: {

                        labels: [
                            "Pending",
                            "In Progress",
                            "Collected"
                        ],

                        datasets: [

                            {
                                data:
                                    statusData
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


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =====================================================
   PAGE LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                loginUser
            );

        }


        const signupForm =
            document.getElementById(
                "signupForm"
            );


        if (signupForm) {

            signupForm.addEventListener(
                "submit",
                createAccount
            );

        }


        const reportForm =
            document.getElementById(
                "reportForm"
            );


        if (reportForm) {

            reportForm.addEventListener(
                "submit",
                submitReport
            );

        }


        const photoInput =
            document.getElementById(
                "wastePhoto"
            );


        if (photoInput) {

            photoInput.addEventListener(
                "change",
                handlePhoto
            );

        }


        const locationButton =
            document.getElementById(
                "locationBtn"
            );


        if (locationButton) {

            locationButton.addEventListener(
                "click",
                getLocation
            );

        }


        const heatmapButton =
            document.getElementById(
                "heatmapToggle"
            );


        if (heatmapButton) {

            heatmapButton.addEventListener(
                "click",
                toggleHeatmap
            );

        }


        const mapTypeFilter =
            document.getElementById(
                "mapTypeFilter"
            );


        if (mapTypeFilter) {

            mapTypeFilter.addEventListener(
                "change",
                filterMapMarkers
            );

        }


        const mapStatusFilter =
            document.getElementById(
                "mapStatusFilter"
            );


        if (mapStatusFilter) {

            mapStatusFilter.addEventListener(
                "change",
                filterMapMarkers
            );

        }


        const priorityFilter =
            document.getElementById(
                "priorityFilter"
            );


        if (priorityFilter) {

            priorityFilter.addEventListener(
                "change",
                filterMapMarkers
            );

        }


        if (currentUser) {

            openPortal();

        }

    }
);
