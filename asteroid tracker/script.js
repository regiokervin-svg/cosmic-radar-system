
/* =========================================================
   EARTH DEFENDER
   NASA NeoWs Asteroid Tracking Application
   ========================================================= */


/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const CONFIG = {
    API_URL: "https://api.nasa.gov/neo/rest/v1/feed",

    // Replace DEMO_KEY with your personal NASA API key.
    API_KEY: "DgtLcw8nG7GjnbcrFnmkfGKhz9mgTGRMBjrk6zWK",

    SCHOOL_BUS_LENGTH: 12,
    EMPIRE_STATE_BUILDING_HEIGHT: 443,

    REQUEST_TIMEOUT: 15000
};


/* =========================================================
   2. DOM ELEMENTS
   ========================================================= */

const DOM = {
    headerDate: document.getElementById("header-date"),
    datePicker: document.getElementById("date-picker"),

    fetchButton: document.getElementById("scan-button"), // Updated from "fetch-button"
    todayButton: document.getElementById("today-button"),
    retryButton: document.getElementById("retry-button"),

    totalAsteroids: document.getElementById("total-asteroids"),
    totalHazardous: document.getElementById("total-hazardous"),
    closestDistance: document.getElementById("closest-distance"),

    redAlert: document.getElementById("red-alert"),
    alertDescription: document.getElementById("alert-description"),

    shieldButton: document.getElementById("shield-button"),
    shieldStatus: document.getElementById("shield-status"),

    // Added missing DOM references to prevent null errors:
    fastestVelocity: document.getElementById("fastest-velocity"), 

    loadingState: document.getElementById("loading-state"),
    errorState: document.getElementById("error-state"),
    errorMessage: document.getElementById("error-message"),
    emptyState: document.getElementById("empty-state"),

    asteroidGrid: document.getElementById("asteroid-grid"),
    resultsCount: document.getElementById("results-count"),
    lastUpdated: document.getElementById("last-updated")
};


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

const state = {
    asteroids: [],
    selectedDate: getLocalDate(),
    isLoading: false,
    controller: null
};


/* =========================================================
   4. UTILITY FUNCTIONS
   ========================================================= */

// Get current date in YYYY-MM-DD format using local time.
function getLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Escape API-provided text before inserting it into HTML.
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


// Format numbers for dashboard display.
function formatNumber(value, decimals = 2) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}


// Convert kilometers into a readable distance.
function formatDistance(kilometers) {
    if (!Number.isFinite(kilometers)) {
        return "N/A";
    }

    if (kilometers < 1000) {
        return `${formatNumber(kilometers)} km`;
    }

    if (kilometers < 1000000) {
        return `${formatNumber(kilometers / 1000)} thousand km`;
    }

    return `${formatNumber(kilometers / 1000000)} million km`;
}


// Format the mission date for the header.
function formatDate(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}


// Convert asteroid diameter into relatable comparisons.
function getSizeComparison(diameter) {
    if (!Number.isFinite(diameter) || diameter <= 0) {
        return "Size comparison unavailable";
    }

    const buses = diameter / CONFIG.SCHOOL_BUS_LENGTH;

    const building =
        diameter / CONFIG.EMPIRE_STATE_BUILDING_HEIGHT;

    if (diameter >= CONFIG.EMPIRE_STATE_BUILDING_HEIGHT) {
        return ` About ${formatNumber(building, 1)} Empire State Buildings`;
    }

    if (diameter >= 24) {
        return ` About ${formatNumber(buses, 1)} school buses`;
    }

    if (diameter >= 12) {
        return ` About ${formatNumber(buses, 1)} school bus lengths`;
    }

    if (diameter >= 2) {
        return ` About ${formatNumber(diameter / 4.5, 1)} cars`;
    }

    return ` About ${formatNumber(diameter / 0.22, 1)} soccer balls`;
}


/* =========================================================
   5. NORMALIZE NASA API DATA
   ========================================================= */

function normalizeAsteroid(neo) {

    const approach = neo.close_approach_data?.[0];

    const diameter = neo.estimated_diameter?.meters;

    if (!approach || !diameter) {
        return null;
    }

    const minDiameter = Number(diameter.estimated_diameter_min);
    const maxDiameter = Number(diameter.estimated_diameter_max);

    const velocity = Number(
        approach.relative_velocity?.kilometers_per_second
    );

    const missDistance = Number(
        approach.miss_distance?.kilometers
    );

    const averageDiameter = (minDiameter + maxDiameter) / 2;

    if (
        !Number.isFinite(minDiameter) ||
        !Number.isFinite(maxDiameter) ||
        !Number.isFinite(averageDiameter) ||
        !Number.isFinite(velocity) ||
        !Number.isFinite(missDistance)
    ) {
        return null;
    }

    return {
        id: neo.id,
        name: neo.name,
        nasaUrl: neo.nasa_jpl_url,

        isHazardous: neo.is_potentially_hazardous_asteroid,

        minDiameter,
        maxDiameter,
        diameter: averageDiameter,

        velocity,
        missDistance,

        approachDate: approach.close_approach_date,
        orbitingBody: approach.orbiting_body || "Earth"
    };
}


/* =========================================================
   6. FETCH NASA ASTEROID DATA
   ========================================================= */

async function fetchAsteroids(date) {

    if (state.isLoading && state.controller) {
        state.controller.abort();
    }

    state.controller = new AbortController();

    state.isLoading = true;
    state.selectedDate = date;

    setLoading(true);
    hideError();

    try {

        const params = new URLSearchParams({
            start_date: date,
            end_date: date,
            api_key: CONFIG.API_KEY
        });

        const url = `${CONFIG.API_URL}?${params.toString()}`;

        const timeout = setTimeout(
            () => state.controller?.abort(),
            CONFIG.REQUEST_TIMEOUT
        );

        let response;

        try {
            response = await fetch(url, {
                signal: state.controller.signal
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {

            if (response.status === 429) {
                throw new Error(
                    "NASA API rate limit reached. Please try again later."
                );
            }

            if (response.status === 403) {
                throw new Error(
                    "NASA API access denied. Check your API key."
                );
            }

            throw new Error(
                `NASA API returned HTTP ${response.status}.`
            );
        }

        const data = await response.json();

        const rawAsteroids =
            data.near_earth_objects?.[date] || [];

        state.asteroids = rawAsteroids
            .map(normalizeAsteroid)
            .filter(Boolean);

        renderDashboard();

        DOM.lastUpdated.textContent =
            `Last synchronized: ${new Date().toLocaleTimeString()} | ${formatDate(date)}`;

    } catch (error) {

        // Ignore requests cancelled by a newer scan.
        if (error.name === "AbortError" && state.selectedDate !== date) {
            return;
        }

        if (error.name === "AbortError") {
            showError("Request timed out. Please try again.");
        } else {
            console.error("NASA API Error:", error);
            showError(error.message);
        }

    } finally {

        // An older request must not reset a newer request's UI.
        if (state.selectedDate === date) {
            state.isLoading = false;
            setLoading(false);
        }
    }
}


/* =========================================================
   7. DASHBOARD STATISTICS
   ========================================================= */

function calculateStats(asteroids) {

    if (!asteroids.length) {
        return {
            total: 0,
            hazardous: [],
            fastest: null,
            largest: null,
            closest: null
        };
    }

    const hazardous = asteroids.filter(
        asteroid => asteroid.isHazardous
    );

    const fastest = asteroids.reduce((best, current) =>
        current.velocity > best.velocity ? current : best
    );

    const largest = asteroids.reduce((best, current) =>
        current.diameter > best.diameter ? current : best
    );

    const closest = asteroids.reduce((best, current) =>
        current.missDistance < best.missDistance ? current : best
    );

    return {
        total: asteroids.length,
        hazardous,
        fastest,
        largest,
        closest
    };
}


/* =========================================================
   8. RENDER MAIN STATISTICS
   ========================================================= */

function renderStats(stats) {

    DOM.totalAsteroids.textContent = stats.total;

    DOM.totalHazardous.textContent =
        stats.hazardous.length;

    DOM.closestDistance.textContent =
        stats.closest
            ? formatDistance(stats.closest.missDistance)
            : "N/A";
}


/* =========================================================
   9. RED ALERT SYSTEM
   ========================================================= */

function renderRedAlert(hazardous) {

    const count = hazardous.length;

    if (count === 0) {
        DOM.redAlert.classList.add("hidden");

        DOM.shieldStatus.classList.add("hidden");

        return;
    }

    DOM.redAlert.classList.remove("hidden");

    DOM.alertDescription.textContent =
        `${count} potentially hazardous asteroid(s) detected in the ${state.selectedDate} NASA feed.`;

    DOM.shieldStatus.classList.add("hidden");

    DOM.shieldButton.disabled = false;

    DOM.shieldButton.textContent =
        "🛡️ Deploy Deflection Shield";

    DOM.shieldButton.classList.remove("opacity-60");
}


// This is a visual game simulation, not a real asteroid defense system.
function deployShield() {

    DOM.shieldButton.disabled = true;

    DOM.shieldButton.textContent =
        "🛡️ SIMULATION ACTIVE";

    DOM.shieldButton.classList.add("opacity-60");

    DOM.shieldStatus.classList.remove("hidden");

    DOM.shieldStatus.textContent =
        "✓ DEFENSE SIMULATION ACTIVATED — NO PHYSICAL DEFLECTION PERFORMED";

}


/* =========================================================
   10. RENDER HALL OF FAME
   ========================================================= */

function renderLeaderboard(stats) {

    const records = [
        {
            asteroid: stats.fastest,
            name: DOM.speedName || null,
            value: DOM.speedValue || null,
            format: asteroid =>
                `${formatNumber(asteroid.velocity, 3)} km/s`
        },

        {
            asteroid: stats.largest,
            name: DOM.sizeName || null,
            value: DOM.sizeValue || null,
            format: asteroid =>
                `${formatNumber(asteroid.diameter)} m`
        },

        {
            asteroid: stats.closest,
            name: DOM.closeName || null,
            value: DOM.closeValue || null,
            format: asteroid =>
                formatDistance(asteroid.missDistance)
        }
    ];

    records.forEach(record => {

        if (!record.name || !record.value) return; // Skip if elements aren't in HTML

        if (!record.asteroid) {
            record.name.textContent = "No data";
            record.value.textContent = "--";
            return;
        }

        record.name.textContent = record.asteroid.name;

        record.value.textContent =
            record.format(record.asteroid);

    });
}


/* =========================================================
   11. ASTEROID CARD COMPONENT
   ========================================================= */

function createAsteroidCard(asteroid) {

    const card = document.createElement("article");

    card.className = `
        asteroid-card glass rounded-2xl p-5
        border border-slate-800
        shadow-glow
    `;

    const hazardous = asteroid.isHazardous;

    const diameterComparison =
        getSizeComparison(asteroid.diameter);

    const safeJplUrl = (() => {
        try {
            const parsed = new URL(asteroid.nasaUrl);

            if (
                parsed.protocol === "https:" &&
                parsed.hostname === "ssd.jpl.nasa.gov"
            ) {
                return parsed.href;
            }
        } catch {
            // Invalid URL: omit the external link.
        }

        return null;
    })();

    const badge = hazardous
        ? `<span class="text-[10px] font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-3 py-1 rounded-full">⚠ POTENTIALLY HAZARDOUS</span>`
        : `<span class="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-3 py-1 rounded-full">✓ NON-PHA</span>`;

    card.innerHTML = `
        <div class="flex items-start justify-between gap-3">

            <div>
                <p class="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    NEO ID: ${escapeHTML(asteroid.id)}
                </p>

                <h4 class="text-xl font-black text-white mt-2">
                    ${escapeHTML(asteroid.name)}
                </h4>
            </div>

            <span class="text-2xl">☄️</span>
        </div>

        <div class="mt-4">
            ${badge}
        </div>

        <div class="mt-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800">

            <p class="text-[10px] text-slate-500 uppercase tracking-widest">
                Estimated Diameter
            </p>

            <p class="text-2xl font-black text-cyan-400 mt-1">
                ${formatNumber(asteroid.diameter)} m
            </p>

            <p class="text-xs text-slate-400 mt-2">
                ${formatNumber(asteroid.minDiameter)} –
                ${formatNumber(asteroid.maxDiameter)} m
            </p>

            <div class="mt-3 text-sm text-purple-300">
                ${escapeHTML(diameterComparison)}
            </div>

        </div>

        <div class="grid grid-cols-2 gap-4 mt-5">

            <div>
                <p class="text-[10px] uppercase tracking-widest text-slate-500">
                    Relative Velocity
                </p>

                <p class="text-sm font-bold text-amber-400 mt-1">
                    ${formatNumber(asteroid.velocity, 3)} km/s
                </p>
            </div>

            <div>
                <p class="text-[10px] uppercase tracking-widest text-slate-500">
                    Miss Distance
                </p>

                <p class="text-sm font-bold text-emerald-400 mt-1">
                    ${formatDistance(asteroid.missDistance)}
                </p>
            </div>

        </div>

        <div class="border-t border-slate-800 mt-5 pt-4">

            <div class="flex justify-between items-center gap-3">

                <div>
                    <p class="text-[10px] uppercase tracking-widest text-slate-500">
                        Close Approach
                    </p>

                    <p class="text-xs text-slate-300 mt-1">
                        ${escapeHTML(asteroid.approachDate)}
                    </p>
                </div>

                <div class="text-right">
                    <p class="text-[10px] uppercase tracking-widest text-slate-500">
                        Orbiting Body
                    </p>

                    <p class="text-xs text-slate-300 mt-1">
                        ${escapeHTML(asteroid.orbitingBody)}
                    </p>
                </div>

            </div>

            ${
                safeJplUrl
                    ? `<a
                        href="${escapeHTML(safeJplUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block text-center mt-5 py-3 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 font-bold text-xs transition">
                        VIEW NASA JPL DATABASE ↗
                    </a>`
                    : `<p class="text-xs text-slate-500 mt-5 text-center">JPL database link unavailable</p>`
            }

        </div>
    `;

    return card;
}


/* =========================================================
   12. RENDER ASTEROID GRID
   ========================================================= */

function renderAsteroids(asteroids) {

    DOM.asteroidGrid.innerHTML = "";

    DOM.resultsCount.textContent =
        `${asteroids.length} object(s) detected`;

    if (!asteroids.length) {
        DOM.emptyState.classList.remove("hidden");
        return;
    }

    DOM.emptyState.classList.add("hidden");

    // Display the closest approaches first.
    const sortedAsteroids = [...asteroids].sort(
        (a, b) => a.missDistance - b.missDistance
    );

    const fragment = document.createDocumentFragment();

    sortedAsteroids.forEach(asteroid => {
        fragment.appendChild(
            createAsteroidCard(asteroid)
        );
    });

    DOM.asteroidGrid.appendChild(fragment);
}

/* =========================================================
   RENDER RADAR MARKERS
   ========================================================= */

function renderRadarMarkers(asteroids) {
    const radarMarkers = document.getElementById("radar-markers");
    if (!radarMarkers) return;

    radarMarkers.innerHTML = "";

    asteroids.forEach((asteroid, index) => {
        const marker = document.createElement("div");
        
        // Add hazardous vs safe styling classes
        marker.className = `radar-marker ${asteroid.isHazardous ? "hazardous" : ""}`;

        // Calculate a safe relative position on the radar grid
        const maxDist = 50000000; // 50 million km scale reference
        const normalizedDist = Math.min(asteroid.missDistance / maxDist, 0.85);
        
        // Spread them out in a circular pattern using their index for angle distribution
        const angle = (index * 137.5) * (Math.PI / 180);
        const x = 50 + (normalizedDist * 40) * Math.cos(angle);
        const y = 50 + (normalizedDist * 40) * Math.sin(angle);

        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;
        
        marker.title = `${asteroid.name} - Miss Distance: ${formatDistance(asteroid.missDistance)}`;

        radarMarkers.appendChild(marker);
    });
}

/* =========================================================
   13. RENDER COMPLETE DASHBOARD
   ========================================================= */

function renderDashboard() {

    const stats = calculateStats(state.asteroids);
    renderStats(stats);
    renderRedAlert(stats.hazardous);
    renderLeaderboard(stats);
    renderAsteroids(state.asteroids);
    updateMissionStatus(stats);
    renderRadarMarkers(state.asteroids);

}


/* =========================================================
   14. LOADING AND ERROR STATES
   ========================================================= */

function setLoading(isLoading) {

    DOM.loadingState.classList.toggle(
        "hidden",
        !isLoading
    );

    if (isLoading) {

        DOM.errorState.classList.add("hidden");

        DOM.emptyState.classList.add("hidden");

        DOM.asteroidGrid.innerHTML = "";

        DOM.fetchButton.disabled = true;

        DOM.fetchButton.textContent = "SCANNING...";

    } else {

        DOM.fetchButton.disabled = false;

        DOM.fetchButton.textContent = "SCAN SECTOR";

    }
}


function showError(message) {

    DOM.errorMessage.textContent = message;
    DOM.errorState.classList.remove("hidden");
    DOM.asteroidGrid.innerHTML = "";
    DOM.emptyState.classList.add("hidden");
    DOM.resultsCount.textContent = "Data unavailable";
    updateConnectionStatus("OFFLINE", true);
}


function hideError() {

    DOM.errorState.classList.add("hidden");

}


/* =========================================================
   15. DATE PICKER
   ========================================================= */

function initializeDatePicker() {

    const today = getLocalDate();

    DOM.datePicker.max = today;

    DOM.datePicker.value = today;

    DOM.headerDate.textContent = formatDate(today);

    DOM.datePicker.addEventListener("change", () => {

        const selectedDate = DOM.datePicker.value;

        if (!selectedDate) return;

        // Prevent future dates.
        if (selectedDate > getLocalDate()) {
            DOM.datePicker.value = getLocalDate();
            return;
        }

        DOM.headerDate.textContent =
            formatDate(selectedDate);

        fetchAsteroids(selectedDate);

    });

}


/* =========================================================
   16. EVENT LISTENERS
   ========================================================= */

function initializeEvents() {

    if (DOM.fetchButton) {
        DOM.fetchButton.addEventListener("click", () => {
            const date = DOM.datePicker.value;
            if (!date) return;

            if (date > getLocalDate()) {
                showError("Future dates are not available.");
                return;
            }

            DOM.headerDate.textContent = formatDate(date);
            fetchAsteroids(date);
        });
    }

    if (DOM.todayButton) {
        DOM.todayButton.addEventListener("click", () => {
            const today = getLocalDate();
            DOM.datePicker.value = today;
            DOM.headerDate.textContent = formatDate(today);
            fetchAsteroids(today);
        });
    }

    if (DOM.retryButton) {
        DOM.retryButton.addEventListener("click", () => {
            fetchAsteroids(state.selectedDate);
        });
    }

    if (DOM.shieldButton) {
        DOM.shieldButton.addEventListener("click", deployShield);
    }

}

/* =========================================================
   17. APPLICATION INITIALIZATION
   ========================================================= */

function initializeApp() {

    console.log(
        "%c EARTH DEFENDER INITIALIZED ",
        "background:#0891b2;color:#fff;font-weight:bold;padding:8px;"
    );

    updateConnectionStatus("ONLINE"); // <-- Make sure this is here inside initializeApp

    initializeDatePicker();

    initializeEvents();

    // Automatically fetch today's asteroid data.
    fetchAsteroids(state.selectedDate);

}

/* =========================================================
   UPDATE MISSION STATUS PANEL
   ========================================================= */

function updateMissionStatus(stats) {
    const apiStatus = document.getElementById("api-status");
    const trackedCount = document.getElementById("tracked-count");
    const missionHazardCount = document.getElementById("mission-hazard-count");
    const missionStatusTitle = document.getElementById("mission-status-title");
    const missionStatusDescription = document.getElementById("mission-status-description");
    const missionScore = document.getElementById("mission-score");

    if (apiStatus) apiStatus.textContent = "ONLINE";
    if (trackedCount) trackedCount.textContent = stats.total;
    if (missionHazardCount) missionHazardCount.textContent = stats.hazardous.length;

    if (missionStatusTitle) {
        missionStatusTitle.textContent = stats.hazardous.length > 0 ? "RED ALERT ACTIVE" : "SECTOR SECURE";
    }

    if (missionStatusDescription) {
        missionStatusDescription.textContent = stats.hazardous.length > 0 
            ? "Potentially hazardous objects tracked in current feed." 
            : "All monitored near-earth objects are currently stable.";
    }

    if (missionScore) {
        missionScore.textContent = stats.total > 0 ? "100%" : "0%";
    }
}

/* =========================================================
   UPDATE CONNECTION STATUS HELPER
   ========================================================= */

function updateConnectionStatus(status, isError = false) {
    const statusElement = document.getElementById("connection-status");
    if (!statusElement) return;

    statusElement.textContent = status;
    
    if (isError) {
        statusElement.style.color = "#f43f5e"; // Red for error
    } else {
        statusElement.style.color = "var(--accent-primary)"; // Green/Cyan for online
    }
}

// Start application.
initializeApp();
