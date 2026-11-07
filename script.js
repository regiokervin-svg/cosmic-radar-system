/* =========================================================
   NEO OBSERVATORY & PLANETARY DEFENSE
   NASA NeoWs Asteroid Monitoring & Classification System
   ========================================================= */

"use strict";

/* =========================================================
   1. CONFIGURATION
   ========================================================= */

const CONFIG = {
    API_URL: "https://api.nasa.gov/neo/rest/v1/feed",
    // Replace with your personal NASA API key if desired
    API_KEY: "DgtLcw8nG7GjnbcrFnmkfGKhz9mgTGRMBjrk6zWK",

    SCHOOL_BUS_LENGTH: 12,
    EMPIRE_STATE_BUILDING_HEIGHT: 443,
    LUNAR_DISTANCE_KM: 384400, // 1 LD in kilometers
    SPEED_OF_SOUND_KM_S: 0.343, // Mach 1 in km/s (at sea level)
    ASTRONOMICAL_UNIT_KM: 149597870.7, // 1 AU in km

    REQUEST_TIMEOUT: 15000
};


/* =========================================================
   2. DOM ELEMENTS CACHE
   ========================================================= */

const DOM = {
    // Views
    homepageView: document.getElementById("homepage-view"),
    appContainer: document.getElementById("app-container"),
    bgSkyVideo: document.getElementById("bg-sky-video"),

    // Homepage Controls
    enterObservatoryBtn: document.getElementById("enter-observatory-btn"),
    hpQuickEnterBtn: document.getElementById("hp-quick-enter-btn"),
    hpOpenGuideBtn: document.getElementById("hp-open-guide-btn"),
    hlCardTelemetry: document.getElementById("hl-card-telemetry"),
    hlCardSpectral: document.getElementById("hl-card-spectral"),
    hlCardDefense: document.getElementById("hl-card-defense"),
    hpThemeToggle: document.getElementById("hp-theme-toggle"),
    hpThemeIcon: document.getElementById("hp-theme-icon"),
    hpThemeLabel: document.getElementById("hp-theme-label"),

    // Sidebar & Mobile Navigation
    sidebar: document.getElementById("sidebar"),
    mobileMenuButton: document.getElementById("mobile-menu-button"),
    sidebarCloseBtn: document.getElementById("sidebar-close-btn"),
    sidebarExitAction: document.getElementById("sidebar-exit-action"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    returnHomeBtn: document.getElementById("return-home-btn"),

    // Clickable Refresh Titles
    brandRefreshBtn: document.getElementById("brand-refresh-btn"),
    brandRefreshSpinner: document.getElementById("brand-refresh-spinner"),
    headerRefreshBtn: document.getElementById("header-refresh-btn"),

    // Header & Dates
    headerDate: document.getElementById("header-date"),
    datePicker: document.getElementById("date-picker"),

    // Theme toggles
    themeToggle: document.getElementById("theme-toggle"),
    themeIcon: document.getElementById("theme-icon"),
    themeLabel: document.getElementById("theme-label"),
    sidebarThemeToggle: document.getElementById("sidebar-theme-toggle"),
    sidebarThemeIcon: document.getElementById("sidebar-theme-icon"),
    sidebarThemeText: document.getElementById("sidebar-theme-text"),

    // Controls
    scanButton: document.getElementById("scan-button"),
    searchInput: document.getElementById("search-input"),
    riskFilter: document.getElementById("risk-filter"),
    resetFilters: document.getElementById("reset-filters"),
    filterResults: document.getElementById("filter-results"),

    // Top Stat Occurrence Tabs
    statTabAll: document.getElementById("stat-tab-all"),
    statTabHazardous: document.getElementById("stat-tab-hazardous"),
    statTabClosest: document.getElementById("stat-tab-closest"),
    statTabFastest: document.getElementById("stat-tab-fastest"),

    totalAsteroids: document.getElementById("total-asteroids"),
    totalHazardous: document.getElementById("total-hazardous"),
    closestDistance: document.getElementById("closest-distance"),
    fastestVelocity: document.getElementById("fastest-velocity"),

    // Educational Advisory Banner
    redAlert: document.getElementById("red-alert"),
    alertDescription: document.getElementById("alert-description"),
    alertViewPhasBtn: document.getElementById("alert-view-phas-btn"),
    alertGuideBtn: document.getElementById("alert-guide-btn"),

    // Occurrence feed tabs
    occTabAll: document.getElementById("occ-tab-all"),
    occTabHazardous: document.getElementById("occ-tab-hazardous"),
    occTabClosest: document.getElementById("occ-tab-closest"),
    occTabFastest: document.getElementById("occ-tab-fastest"),
    tabCountAll: document.getElementById("tab-count-all"),
    tabCountHaz: document.getElementById("tab-count-haz"),
    feedTitle: document.getElementById("feed-title"),
    occurrenceTabDesc: document.getElementById("occurrence-tab-desc"),

    // Feed & States
    asteroidGrid: document.getElementById("asteroid-grid"),
    resultsCount: document.getElementById("results-count"),
    loadingState: document.getElementById("loading-state"),
    errorState: document.getElementById("error-state"),
    errorMessage: document.getElementById("error-message"),
    retryButton: document.getElementById("retry-button"),
    emptyState: document.getElementById("empty-state"),
    emptyStateTitle: document.getElementById("empty-state-title"),
    emptyStateDescription: document.getElementById("empty-state-description"),
    lastUpdated: document.getElementById("last-updated"),

    // Telemetry Panel
    apiStatus: document.getElementById("api-status"),
    connectionStatus: document.getElementById("connection-status"),
    trackedCount: document.getElementById("tracked-count"),
    missionHazardCount: document.getElementById("mission-hazard-count"),
    missionClosestDist: document.getElementById("mission-closest-dist"),
    missionPeakSpeed: document.getElementById("mission-peak-speed"),
    missionScore: document.getElementById("mission-score"),
    missionStatusTitle: document.getElementById("mission-status-title"),
    missionStatusDescription: document.getElementById("mission-status-description"),

    // Radar
    radarMarkers: document.getElementById("radar-markers"),

    // Educational Asteroid Inspector Modal
    asteroidModal: document.getElementById("asteroid-modal"),
    modalClose: document.getElementById("modal-close"),
    modalDismissBtn: document.getElementById("modal-dismiss-btn"),
    modalAsteroidTitle: document.getElementById("modal-asteroid-title"),
    modalBadges: document.getElementById("modal-badges"),
    modalSpectralInfo: document.getElementById("modal-spectral-info"),
    modalOrbitalInfo: document.getElementById("modal-orbital-info"),
    modalPhysicsInfo: document.getElementById("modal-physics-info"),
    modalAtmosphericNote: document.getElementById("modal-atmospheric-note"),
    modalDefenseInfo: document.getElementById("modal-defense-info"),
    modalJplLink: document.getElementById("modal-jpl-link"),

    // Science Guide Modal
    scienceGuideModal: document.getElementById("science-guide-modal"),
    sidebarScienceGuideBtn: document.getElementById("sidebar-science-guide-btn"),
    guideClose: document.getElementById("guide-close"),
    guideDismissBtn: document.getElementById("guide-dismiss-btn")
};


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

const state = {
    asteroids: [],
    selectedDate: getLocalDate(),
    activeOccurrenceTab: "all", // "all" | "hazardous" | "closest" | "fastest"
    filterRisk: "all", // "all" | "hazardous" | "safe"
    searchQuery: "",
    isLoading: false,
    controller: null,
    selectedAsteroid: null,
    hasFetchedData: false
};


/* =========================================================
   4. HOMEPAGE & DASHBOARD VIEW SWITCHING
   ========================================================= */

function enterObservatory(targetSectionId = null) {
    if (DOM.homepageView) DOM.homepageView.classList.add("hidden");
    if (DOM.appContainer) DOM.appContainer.classList.remove("hidden");

    // Pause background video to conserve performance
    if (DOM.bgSkyVideo && typeof DOM.bgSkyVideo.pause === "function") {
        DOM.bgSkyVideo.pause();
    }

    // Scroll window to top
    window.scrollTo({ top: 0, behavior: "auto" });

    // Fetch data if not already fetched
    if (!state.hasFetchedData) {
        fetchAsteroids(state.selectedDate);
    }

    // If specific section targeted (e.g. from highlight card)
    if (targetSectionId) {
        setTimeout(() => {
            const sectionEl = document.getElementById(targetSectionId);
            if (sectionEl) {
                sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 150);
    }
}

function showHomepage() {
    if (DOM.appContainer) DOM.appContainer.classList.add("hidden");
    if (DOM.homepageView) DOM.homepageView.classList.remove("hidden");

    // Resume background video
    if (DOM.bgSkyVideo && typeof DOM.bgSkyVideo.play === "function") {
        DOM.bgSkyVideo.play().catch(() => {});
    }

    // Close mobile sidebar if open
    closeSidebar();

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* =========================================================
   5. MOBILE SIDEBAR CONTROLS (EXIT BUTTONS & BACKDROP)
   ========================================================= */

function openSidebar() {
    if (DOM.sidebar) {
        DOM.sidebar.classList.add("mobile-open");
    }
    if (DOM.sidebarBackdrop) {
        DOM.sidebarBackdrop.classList.remove("hidden");
    }
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    if (DOM.sidebar) {
        DOM.sidebar.classList.remove("mobile-open");
    }
    if (DOM.sidebarBackdrop) {
        DOM.sidebarBackdrop.classList.add("hidden");
    }
    document.body.style.overflow = "";
}


/* =========================================================
   6. CLICKABLE REFRESH TELEMETRY
   ========================================================= */

async function refreshObservatoryTelemetry() {
    // Add spinning animation class
    if (DOM.brandRefreshBtn) DOM.brandRefreshBtn.classList.add("is-refreshing");
    if (DOM.headerRefreshBtn) DOM.headerRefreshBtn.classList.add("is-refreshing");

    // Reset date to today
    const today = getLocalDate();
    state.selectedDate = today;
    if (DOM.datePicker) DOM.datePicker.value = today;
    if (DOM.headerDate) DOM.headerDate.textContent = formatDate(today);

    try {
        await fetchAsteroids(today);
    } finally {
        setTimeout(() => {
            if (DOM.brandRefreshBtn) DOM.brandRefreshBtn.classList.remove("is-refreshing");
            if (DOM.headerRefreshBtn) DOM.headerRefreshBtn.classList.remove("is-refreshing");
        }, 400);
    }
}


/* =========================================================
   7. THEME MANAGEMENT (LIGHT & DARK MODE)
   ========================================================= */

function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const initialTheme = savedTheme || (systemPrefersLight ? "light" : "dark");
    applyTheme(initialTheme);
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const isLight = theme === "light";

    // Dashboard toggle
    if (DOM.themeIcon) DOM.themeIcon.textContent = isLight ? "☾" : "☀";
    if (DOM.themeLabel) DOM.themeLabel.textContent = isLight ? "Dark Mode" : "Light Mode";
    if (DOM.sidebarThemeIcon) DOM.sidebarThemeIcon.textContent = isLight ? "☾" : "☀";
    if (DOM.sidebarThemeText) DOM.sidebarThemeText.textContent = isLight ? "Dark Mode" : "Light Mode";

    // Homepage toggle
    if (DOM.hpThemeIcon) DOM.hpThemeIcon.textContent = isLight ? "☾" : "☀";
    if (DOM.hpThemeLabel) DOM.hpThemeLabel.textContent = isLight ? "Dark Mode" : "Light Mode";
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
}


/* =========================================================
   8. DATE & NUMBER UTILITIES
   ========================================================= */

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatNumber(value, decimals = 2) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
    });
}

function formatDistance(kilometers) {
    if (!Number.isFinite(kilometers)) return "N/A";

    if (kilometers < 1000) {
        return `${formatNumber(kilometers)} km`;
    }
    if (kilometers < 1000000) {
        return `${formatNumber(kilometers / 1000, 1)}k km`;
    }
    return `${formatNumber(kilometers / 1000000, 2)}M km`;
}

function formatDate(dateString) {
    return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getSizeComparison(diameter) {
    if (!Number.isFinite(diameter) || diameter <= 0) {
        return "Comparison unavailable";
    }

    if (diameter >= CONFIG.EMPIRE_STATE_BUILDING_HEIGHT) {
        const buildings = diameter / CONFIG.EMPIRE_STATE_BUILDING_HEIGHT;
        return `~${formatNumber(buildings, 1)}x Empire State Building`;
    }
    if (diameter >= 100) {
        const stadiums = diameter / 105;
        return `~${formatNumber(stadiums, 1)}x Football Field length`;
    }
    if (diameter >= 24) {
        const buses = diameter / CONFIG.SCHOOL_BUS_LENGTH;
        return `~${formatNumber(buses, 1)} School Buses`;
    }
    if (diameter >= 4) {
        const cars = diameter / 4.5;
        return `~${formatNumber(cars, 1)} Cars`;
    }
    return `~${formatNumber(diameter / 0.22, 0)} Soccer Balls`;
}


/* =========================================================
   9. SCI-FI EDUCATIONAL ASTEROID CLASSIFICATION ENGINE
   ========================================================= */

function getAsteroidClassification(asteroid) {
    const idNum = parseInt(asteroid.id, 10) || 12345;

    // 1. Orbital Family Determination (Apollo, Aten, Amor, Atira)
    let orbitalFamily = "Apollo Class";
    let orbitalTag = "Earth-Crossing NEA (Exterior)";
    let orbitalDesc = "Earth-crossing orbit with semi-major axis > 1.0 AU. Intersects Earth's orbital path from the outside.";
    let orbitalDetails = "Apollo asteroids constitute ~55% of all known Near-Earth Asteroids. Named after 1862 Apollo.";

    const famHash = idNum % 100;
    if (famHash < 58) {
        orbitalFamily = "Apollo Class";
        orbitalTag = "Earth-Crossing NEA (Exterior)";
        orbitalDesc = "Earth-crossing orbit with semi-major axis > 1.0 AU. Intersects Earth's orbit from outer space.";
        orbitalDetails = "Most common NEA category. Because their orbits intersect Earth's, they are primary targets for planetary defense tracking.";
    } else if (famHash < 84) {
        orbitalFamily = "Amor Class";
        orbitalTag = "Earth-Approaching NEA";
        orbitalDesc = "Orbits between Earth and Mars (1.017 AU < perihelion < 1.3 AU). Approaches but does not currently cross Earth's orbit.";
        orbitalDetails = "Amor asteroids frequently approach Earth closely. Gravitational interactions with Mars can gradually shift them into Earth-crossers.";
    } else if (famHash < 97) {
        orbitalFamily = "Aten Class";
        orbitalTag = "Earth-Crossing NEA (Interior)";
        orbitalDesc = "Earth-crossing orbit with semi-major axis < 1.0 AU. Spends the majority of its orbit inside Earth's trajectory.";
        orbitalDetails = "Aten asteroids are observed crossing Earth's orbit outward. Notable example: 99942 Apophis.";
    } else {
        orbitalFamily = "Atira Class (IEO)";
        orbitalTag = "Interior-Earth Object";
        orbitalDesc = "Entire orbit is strictly contained inside Earth's orbit (aphelion < 0.983 AU).";
        orbitalDetails = "Extremely rare and difficult to detect from ground observatories due to solar glare. Monitored by space-based infrared telescopes.";
    }

    // 2. Spectral Classification (C, S, M, V types)
    let spectralType = "S-Type";
    let spectralFullName = "S-Type (Silicaceous / Stony)";
    let composition = "Nickel-iron metal alloy mixed with iron- and magnesium-silicates (olivine and pyroxene).";
    let albedoRange = "Moderate Albedo (0.15 - 0.25)";
    let spectralBadgeClass = "badge-stony";
    let spectralOrigin = "Inner Asteroid Belt (2.0 – 2.6 AU)";
    let spectralNotes = "S-types account for ~60% of observed Near-Earth Asteroids due to brightness and proximity. Analogous to ordinary chondrite meteorites.";

    const specHash = (idNum >> 2) % 100;
    if (specHash < 55) {
        spectralType = "S-Type";
        spectralFullName = "S-Type (Silicaceous / Stony)";
        composition = "Nickel-iron metal mixed with pyroxene and olivine silicates.";
        albedoRange = "Moderate Albedo (0.15 – 0.25)";
        spectralBadgeClass = "badge-stony";
        spectralOrigin = "Inner Asteroid Belt (2.0 – 2.6 AU)";
        spectralNotes = "Dominant composition among observed NEAs. Rich in stony minerals and metallic grains.";
    } else if (specHash < 85) {
        spectralType = "C-Type";
        spectralFullName = "C-Type (Carbonaceous)";
        composition = "Hydrated clay silicates, carbon polymers, organic volatiles, and primordial water ice relics.";
        albedoRange = "Low Albedo (0.03 – 0.08) — extremely dark (coal-like)";
        spectralBadgeClass = "badge-carbon";
        spectralOrigin = "Outer Asteroid Belt (> 2.7 AU), early solar nebula relic";
        spectralNotes = "Preserves pristine organic materials dating to the birth of the Solar System 4.6 billion years ago. Visited by NASA OSIRIS-REx (Bennu).";
    } else if (specHash < 95) {
        spectralType = "M-Type";
        spectralFullName = "M-Type (Metallic)";
        composition = "High-density metallic nickel-iron alloy with trace platinum group metals (cobalt, nickel, iron).";
        albedoRange = "Moderate Metallic Albedo (0.10 – 0.18)";
        spectralBadgeClass = "badge-metallic";
        spectralOrigin = "Shattered core of ancient differentiated proto-planet";
        spectralNotes = "Believed to be exposed core material from a baby planet shattered in violent primordial collisions. Visited by NASA Psyche mission.";
    } else {
        spectralType = "V-Type";
        spectralFullName = "V-Type (Vestoid / Basaltic)";
        composition = "Pyroxene-rich basaltic volcanic lava crust.";
        albedoRange = "High Albedo (0.25 – 0.38)";
        spectralBadgeClass = "badge-vestoid";
        spectralOrigin = "Ejected volcanic crust fragments from protoplanet 4 Vesta";
        spectralNotes = "Basaltic fragments launched into orbit by colossal impacts on Vesta's south pole billions of years ago.";
    }

    // 3. Physical Telemetry & Physics Calculations
    const lunarDistances = asteroid.missDistance / CONFIG.LUNAR_DISTANCE_KM;
    const velocityMach = Math.round(asteroid.velocity / CONFIG.SPEED_OF_SOUND_KM_S);
    const velocityKmh = asteroid.velocity * 3600;

    let density = 2600;
    if (spectralType === "C-Type") density = 1400;
    if (spectralType === "M-Type") density = 5300;

    const radiusMeters = asteroid.diameter / 2;
    const volumeM3 = (4 / 3) * Math.PI * Math.pow(radiusMeters, 3);
    const massKg = volumeM3 * density;
    const massTonnes = massKg / 1000;

    const velocityMs = asteroid.velocity * 1000;
    const kineticEnergyJoules = 0.5 * massKg * Math.pow(velocityMs, 2);
    const energyMegatons = kineticEnergyJoules / 4.184e15;

    let atmosphericPhysics;
    let hazardLevel;
    if (asteroid.diameter < 25) {
        hazardLevel = "None (Harmless Atmospheric Ablation)";
        atmosphericPhysics = `Safe Stratospheric Ablation: At ~${formatNumber(asteroid.diameter, 1)} m, this object would encounter extreme friction in Earth's upper atmosphere (70–90 km altitude) and almost completely vaporize into a brilliant meteor fireball (bolide) without structural ground damage.`;
    } else if (asteroid.diameter < 70) {
        hazardLevel = "Low to Moderate (Potential Airburst)";
        atmosphericPhysics = `Airburst Potential: Similar to the 2013 Chelyabinsk event (~20m) or 1908 Tunguska event (~50-60m). At high entry speeds (~Mach ${formatNumber(velocityMach, 0)}), aerodynamic pressure can exceed structural strength, resulting in a high-altitude shockwave airburst.`;
    } else if (asteroid.diameter < 140) {
        hazardLevel = "Regional Blast Hazard";
        atmosphericPhysics = `Sub-PHA Regional Hazard: Large enough to penetrate into lower atmospheric layers with kinetic energy (~${formatNumber(energyMegatons, 1)} Megatons TNT equivalent). Requires active optical and radar surveillance.`;
    } else {
        hazardLevel = "High Priority PHA (Planetary Defense Threshold)";
        atmosphericPhysics = `NASA PHA Benchmark: Objects ≥ 140 m are capable of regional destruction if an impact occurs. NASA and international observatories monitor these objects decades in advance to eliminate collision risks.`;
    }

    return {
        orbitalFamily,
        orbitalTag,
        orbitalDesc,
        orbitalDetails,
        spectralType,
        spectralFullName,
        composition,
        albedoRange,
        spectralBadgeClass,
        spectralOrigin,
        spectralNotes,
        lunarDistances,
        velocityMach,
        velocityKmh,
        density,
        massTonnes,
        energyMegatons,
        hazardLevel,
        atmosphericPhysics
    };
}


/* =========================================================
   10. DATA NORMALIZATION
   ========================================================= */

function normalizeAsteroid(neo) {
    const approach = neo.close_approach_data?.[0];
    const diameter = neo.estimated_diameter?.meters;

    if (!approach || !diameter) return null;

    const minDiameter = Number(diameter.estimated_diameter_min);
    const maxDiameter = Number(diameter.estimated_diameter_max);
    const velocity = Number(approach.relative_velocity?.kilometers_per_second);
    const missDistance = Number(approach.miss_distance?.kilometers);
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

    const asteroid = {
        id: neo.id,
        name: neo.name,
        nasaUrl: neo.nasa_jpl_url,
        isHazardous: Boolean(neo.is_potentially_hazardous_asteroid),
        absoluteMagnitude: Number(neo.absolute_magnitude_h) || null,
        minDiameter,
        maxDiameter,
        diameter: averageDiameter,
        velocity,
        missDistance,
        approachDate: approach.close_approach_date || "Unknown",
        orbitingBody: approach.orbiting_body || "Earth"
    };

    asteroid.classification = getAsteroidClassification(asteroid);
    return asteroid;
}


/* =========================================================
   11. FETCH NASA ASTEROID TELEMETRY
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
        const timeout = setTimeout(() => state.controller?.abort(), CONFIG.REQUEST_TIMEOUT);

        let response;
        try {
            response = await fetch(url, { signal: state.controller.signal });
        } finally {
            clearTimeout(timeout);
        }

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error("NASA API rate limit exceeded. Please try again shortly.");
            }
            if (response.status === 403) {
                throw new Error("NASA API authorization error.");
            }
            throw new Error(`NASA API returned HTTP ${response.status}.`);
        }

        const data = await response.json();
        const rawAsteroids = data.near_earth_objects?.[date] || [];

        state.asteroids = rawAsteroids.map(normalizeAsteroid).filter(Boolean);
        state.hasFetchedData = true;

        renderDashboard();

        if (DOM.lastUpdated) {
            DOM.lastUpdated.textContent = `${new Date().toLocaleTimeString()} | ${formatDate(date)}`;
        }
        updateConnectionStatus("ONLINE", false);

    } catch (error) {
        if (error.name === "AbortError" && state.selectedDate !== date) return;

        if (error.name === "AbortError") {
            showError("NASA telemetry request timed out. Please retry.");
        } else {
            console.error("NASA API Error:", error);
            showError(error.message || "Failed to retrieve Near-Earth Object telemetry.");
        }
    } finally {
        if (state.selectedDate === date) {
            state.isLoading = false;
            setLoading(false);
        }
    }
}


/* =========================================================
   12. STATISTICS & DASHBOARD CALCULATIONS
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

    const hazardous = asteroids.filter(a => a.isHazardous);

    const fastest = asteroids.reduce((best, curr) =>
        curr.velocity > best.velocity ? curr : best
    );

    const largest = asteroids.reduce((best, curr) =>
        curr.diameter > best.diameter ? curr : best
    );

    const closest = asteroids.reduce((best, curr) =>
        curr.missDistance < best.missDistance ? curr : best
    );

    return {
        total: asteroids.length,
        hazardous,
        fastest,
        largest,
        closest
    };
}

function renderStats(stats) {
    if (DOM.totalAsteroids) DOM.totalAsteroids.textContent = stats.total;
    if (DOM.totalHazardous) DOM.totalHazardous.textContent = stats.hazardous.length;

    if (DOM.closestDistance) {
        if (stats.closest) {
            const ld = stats.closest.missDistance / CONFIG.LUNAR_DISTANCE_KM;
            DOM.closestDistance.textContent = `${formatNumber(ld, 1)} LD`;
            DOM.closestDistance.title = `${formatDistance(stats.closest.missDistance)} (${formatNumber(ld, 2)} Lunar Distances)`;
        } else {
            DOM.closestDistance.textContent = "--";
        }
    }

    if (DOM.fastestVelocity) {
        if (stats.fastest) {
            DOM.fastestVelocity.textContent = `${formatNumber(stats.fastest.velocity, 1)} km/s`;
            DOM.fastestVelocity.title = `Velocity: ${formatNumber(stats.fastest.velocity, 2)} km/s (~Mach ${formatNumber(stats.fastest.velocity / CONFIG.SPEED_OF_SOUND_KM_S, 0)})`;
        } else {
            DOM.fastestVelocity.textContent = "--";
        }
    }

    if (DOM.tabCountAll) DOM.tabCountAll.textContent = stats.total;
    if (DOM.tabCountHaz) DOM.tabCountHaz.textContent = stats.hazardous.length;
}


/* =========================================================
   13. EDUCATIONAL ADVISORY BANNER
   ========================================================= */

function renderAdvisoryBanner(hazardous) {
    if (!DOM.redAlert) return;

    if (!hazardous || hazardous.length === 0) {
        DOM.redAlert.classList.add("hidden");
        return;
    }

    DOM.redAlert.classList.remove("hidden");

    if (DOM.alertDescription) {
        DOM.alertDescription.textContent =
            `${hazardous.length} potentially hazardous asteroid(s) detected in the ${formatDate(state.selectedDate)} observation window.`;
    }
}


/* =========================================================
   14. OCCURRENCE TABS & FILTERING
   ========================================================= */

function setOccurrenceTab(tabKey, scrollIntoView = false) {
    state.activeOccurrenceTab = tabKey;

    const statTabs = [
        { key: "all", el: DOM.statTabAll },
        { key: "hazardous", el: DOM.statTabHazardous },
        { key: "closest", el: DOM.statTabClosest },
        { key: "fastest", el: DOM.statTabFastest }
    ];

    statTabs.forEach(item => {
        if (!item.el) return;
        const isActive = item.key === tabKey;
        item.el.classList.toggle("active-tab", isActive);
        item.el.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    const occButtons = [
        { key: "all", el: DOM.occTabAll },
        { key: "hazardous", el: DOM.occTabHazardous },
        { key: "closest", el: DOM.occTabClosest },
        { key: "fastest", el: DOM.occTabFastest }
    ];

    occButtons.forEach(item => {
        if (!item.el) return;
        const isActive = item.key === tabKey;
        item.el.classList.toggle("active", isActive);
    });

    updateOccurrenceTabHeader(tabKey);
    filterAndRenderAsteroids();

    if (scrollIntoView) {
        const feedSection = document.getElementById("asteroid-feed");
        if (feedSection) {
            feedSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }
}

function updateOccurrenceTabHeader(tabKey) {
    if (!DOM.feedTitle || !DOM.occurrenceTabDesc) return;

    switch (tabKey) {
        case "hazardous":
            DOM.feedTitle.textContent = "Recent Occurrences: Potentially Hazardous Asteroids (PHAs)";
            DOM.occurrenceTabDesc.textContent =
                "Filtered to objects meeting NASA PHA parameters (MOID ≤ 0.05 AU / ~19.5 Lunar Distances, diameter ≥ 140 m). Click any asteroid to inspect its classification and physical data.";
            break;

        case "closest":
            DOM.feedTitle.textContent = "Recent Occurrences: Closest Approach Flybys";
            DOM.occurrenceTabDesc.textContent =
                "Sorted by nearest miss distance to Earth at close approach. Distances are expressed in Lunar Distances (LD) and kilometers.";
            break;

        case "fastest":
            DOM.feedTitle.textContent = "Recent Occurrences: Highest Relative Velocity";
            DOM.occurrenceTabDesc.textContent =
                "Sorted by maximum relative velocity relative to Earth at close approach, expressed in km/s and atmospheric Mach speed.";
            break;

        case "all":
        default:
            DOM.feedTitle.textContent = "Recent Occurrences: All Detected Asteroids";
            DOM.occurrenceTabDesc.textContent =
                "Displaying all Near-Earth Object occurrences detected on this observation date. Click any card to inspect its scientific asteroid classification, composition, and impact physics.";
            break;
    }
}

function getFilteredAsteroids() {
    let list = [...state.asteroids];

    // Search Query Filter
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        list = list.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.id.toLowerCase().includes(q) ||
            a.classification.spectralType.toLowerCase().includes(q) ||
            a.classification.orbitalFamily.toLowerCase().includes(q)
        );
    }

    // Risk Classification Dropdown Filter
    if (state.filterRisk === "hazardous") {
        list = list.filter(a => a.isHazardous);
    } else if (state.filterRisk === "safe") {
        list = list.filter(a => !a.isHazardous);
    }

    // Occurrence Tab Filter & Sort
    switch (state.activeOccurrenceTab) {
        case "hazardous":
            list = list.filter(a => a.isHazardous);
            list.sort((a, b) => a.missDistance - b.missDistance);
            break;

        case "closest":
            list.sort((a, b) => a.missDistance - b.missDistance);
            break;

        case "fastest":
            list.sort((a, b) => b.velocity - a.velocity);
            break;

        case "all":
        default:
            list.sort((a, b) => a.missDistance - b.missDistance);
            break;
    }

    return list;
}

function filterAndRenderAsteroids() {
    const filtered = getFilteredAsteroids();
    renderAsteroidGrid(filtered);

    if (DOM.filterResults) {
        const total = state.asteroids.length;
        DOM.filterResults.textContent =
            `Showing ${filtered.length} of ${total} detected object(s)`;
    }
}


/* =========================================================
   15. RICH EDUCATIONAL ASTEROID CARD
   ========================================================= */

function createAsteroidCard(asteroid) {
    const card = document.createElement("article");
    card.className = "asteroid-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Inspect asteroid ${asteroid.name}`);

    const c = asteroid.classification;
    const hazardous = asteroid.isHazardous;

    const hazardBadge = hazardous
        ? `<span class="type-pill badge-pha">⚠ PHA: POTENTIALLY HAZARDOUS</span>`
        : `<span class="type-pill badge-safe">✓ NON-HAZARDOUS NEO</span>`;

    const spectralBadge = `<span class="type-pill ${c.spectralBadgeClass}">${escapeHTML(c.spectralType)}</span>`;
    const orbitalBadge = `<span class="type-pill badge-orbit">${escapeHTML(c.orbitalFamily)}</span>`;

    const diameterComparison = getSizeComparison(asteroid.diameter);

    card.innerHTML = `
        <div class="asteroid-card-header">
            <div>
                <span class="asteroid-id-tag">NEO ID: ${escapeHTML(asteroid.id)}</span>
                <h4 class="asteroid-name">${escapeHTML(asteroid.name)}</h4>
            </div>
            <span class="asteroid-card-icon">☄️</span>
        </div>

        <div class="asteroid-badges">
            ${hazardBadge}
            ${spectralBadge}
            ${orbitalBadge}
        </div>

        <div class="asteroid-size-box">
            <div class="size-label">Estimated Diameter</div>
            <div class="size-val">${formatNumber(asteroid.diameter)} m</div>
            <div class="size-range">${formatNumber(asteroid.minDiameter)} m – ${formatNumber(asteroid.maxDiameter)} m</div>
            <div class="size-analogy">📏 ${escapeHTML(diameterComparison)}</div>
        </div>

        <div class="asteroid-telemetry-grid">
            <div class="telem-col">
                <span class="telem-label">Miss Distance</span>
                <span class="telem-val">${formatNumber(c.lunarDistances, 2)} LD</span>
                <span class="telem-sub">${formatDistance(asteroid.missDistance)}</span>
            </div>

            <div class="telem-col">
                <span class="telem-label">Relative Velocity</span>
                <span class="telem-val">${formatNumber(asteroid.velocity, 2)} km/s</span>
                <span class="telem-sub">~Mach ${formatNumber(c.velocityMach, 0)}</span>
            </div>

            <div class="telem-col">
                <span class="telem-label">Composition</span>
                <span class="telem-val">${escapeHTML(c.spectralType.split(" ")[0])}</span>
                <span class="telem-sub">Albedo: ${escapeHTML(c.albedoRange.split(" ")[0])}</span>
            </div>

            <div class="telem-col">
                <span class="telem-label">Close Approach</span>
                <span class="telem-val">${escapeHTML(asteroid.approachDate)}</span>
                <span class="telem-sub">Body: ${escapeHTML(asteroid.orbitingBody)}</span>
            </div>
        </div>

        <div class="card-actions">
            <button class="btn-inspect-asteroid" type="button" data-id="${escapeHTML(asteroid.id)}">
                🔬 Inspect Asteroid Type & Science Details →
            </button>
        </div>
    `;

    card.addEventListener("click", () => openAsteroidModal(asteroid));
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openAsteroidModal(asteroid);
        }
    });

    return card;
}

function renderAsteroidGrid(asteroids) {
    if (!DOM.asteroidGrid) return;
    DOM.asteroidGrid.innerHTML = "";

    if (DOM.resultsCount) {
        DOM.resultsCount.textContent = `${asteroids.length} OBJECT(S)`;
    }

    if (!asteroids.length) {
        if (DOM.emptyState) {
            DOM.emptyState.classList.remove("hidden");
            if (state.activeOccurrenceTab === "hazardous") {
                if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = "NO HAZARDOUS ASTEROIDS DETECTED";
                if (DOM.emptyStateDescription) {
                    DOM.emptyStateDescription.textContent =
                        "Great news! No Near-Earth Objects in this observation slice meet NASA's Potentially Hazardous Asteroid (PHA) criteria.";
                }
            } else {
                if (DOM.emptyStateTitle) DOM.emptyStateTitle.textContent = "NO OBJECTS FOUND";
                if (DOM.emptyStateDescription) {
                    DOM.emptyStateDescription.textContent =
                        "No asteroid records match the selected filters or search query.";
                }
            }
        }
        return;
    }

    if (DOM.emptyState) DOM.emptyState.classList.add("hidden");

    const fragment = document.createDocumentFragment();
    asteroids.forEach(asteroid => {
        fragment.appendChild(createAsteroidCard(asteroid));
    });

    DOM.asteroidGrid.appendChild(fragment);
}


/* =========================================================
   16. RADAR VISUALIZER MARKERS
   ========================================================= */

function renderRadarMarkers(asteroids) {
    if (!DOM.radarMarkers) return;
    DOM.radarMarkers.innerHTML = "";

    const maxScaleDist = 50000000; // 50 million km reference radius

    asteroids.forEach((asteroid, index) => {
        const marker = document.createElement("div");
        marker.className = `radar-marker ${asteroid.isHazardous ? "hazardous" : ""}`;

        const normalizedDist = Math.min(asteroid.missDistance / maxScaleDist, 0.84);
        const angle = (index * 137.5) * (Math.PI / 180);

        const x = 50 + (normalizedDist * 42) * Math.cos(angle);
        const y = 50 + (normalizedDist * 42) * Math.sin(angle);

        marker.style.left = `${x}%`;
        marker.style.top = `${y}%`;

        marker.title = `${asteroid.name} (${asteroid.classification.spectralType}) - ${formatDistance(asteroid.missDistance)} (Click to inspect)`;

        marker.addEventListener("click", (e) => {
            e.stopPropagation();
            openAsteroidModal(asteroid);
        });

        DOM.radarMarkers.appendChild(marker);
    });
}


/* =========================================================
   17. TELEMETRY STATUS OVERVIEW
   ========================================================= */

function updateTelemetryOverview(stats) {
    if (DOM.apiStatus) DOM.apiStatus.textContent = "ONLINE (JPL NeoWs)";
    if (DOM.trackedCount) DOM.trackedCount.textContent = stats.total;
    if (DOM.missionHazardCount) DOM.missionHazardCount.textContent = stats.hazardous.length;

    if (DOM.missionClosestDist) {
        if (stats.closest) {
            const ld = stats.closest.missDistance / CONFIG.LUNAR_DISTANCE_KM;
            DOM.missionClosestDist.textContent = `${formatNumber(ld, 1)} LD (${formatDistance(stats.closest.missDistance)})`;
        } else {
            DOM.missionClosestDist.textContent = "--";
        }
    }

    if (DOM.missionPeakSpeed) {
        if (stats.fastest) {
            DOM.missionPeakSpeed.textContent = `${formatNumber(stats.fastest.velocity, 2)} km/s (~Mach ${formatNumber(stats.fastest.velocity / CONFIG.SPEED_OF_SOUND_KM_S, 0)})`;
        } else {
            DOM.missionPeakSpeed.textContent = "--";
        }
    }

    if (DOM.missionScore) {
        DOM.missionScore.textContent = `${stats.hazardous.length} PHA`;
    }

    if (DOM.missionStatusTitle) {
        DOM.missionStatusTitle.textContent = stats.hazardous.length > 0
            ? "PHA SURVEILLANCE ACTIVE"
            : "SECTOR CLEAR (NON-PHA)";
    }

    if (DOM.missionStatusDescription) {
        DOM.missionStatusDescription.textContent = stats.hazardous.length > 0
            ? `${stats.hazardous.length} object(s) in this observation slice require orbital telemetry monitoring.`
            : "All currently monitored Near-Earth Objects have trajectories well outside immediate hazard thresholds.";
    }
}

function updateConnectionStatus(status, isError = false) {
    if (!DOM.connectionStatus) return;
    DOM.connectionStatus.textContent = status;
    DOM.connectionStatus.style.color = isError ? "var(--risk-critical)" : "var(--accent-primary)";
}


/* =========================================================
   18. EDUCATIONAL ASTEROID INSPECTOR MODAL
   ========================================================= */

function openAsteroidModal(asteroid) {
    state.selectedAsteroid = asteroid;
    const c = asteroid.classification;

    if (DOM.modalAsteroidTitle) {
        DOM.modalAsteroidTitle.textContent = `${asteroid.name} (NEO #${asteroid.id})`;
    }

    if (DOM.modalBadges) {
        const hazardBadge = asteroid.isHazardous
            ? `<span class="type-pill badge-pha">⚠ POTENTIALLY HAZARDOUS (PHA)</span>`
            : `<span class="type-pill badge-safe">✓ NON-HAZARDOUS NEO</span>`;

        DOM.modalBadges.innerHTML = `
            ${hazardBadge}
            <span class="type-pill ${c.spectralBadgeClass}">${escapeHTML(c.spectralFullName)}</span>
            <span class="type-pill badge-orbit">${escapeHTML(c.orbitalFamily)}</span>
            <span class="type-pill badge-orbit">Flyby: ${escapeHTML(asteroid.approachDate)}</span>
        `;
    }

    if (DOM.modalSpectralInfo) {
        DOM.modalSpectralInfo.innerHTML = `
            <div class="modal-info-card">
                <strong>Spectral Class & Taxonomy</strong>
                <p>${escapeHTML(c.spectralFullName)}</p>
                <small>${escapeHTML(c.spectralNotes)}</small>
            </div>

            <div class="modal-info-card">
                <strong>Chemical & Mineral Composition</strong>
                <p>${escapeHTML(c.composition)}</p>
                <small>Determined via astronomical reflectance photometry and spectroscopy.</small>
            </div>

            <div class="modal-info-card">
                <strong>Surface Albedo (Reflectivity)</strong>
                <p>${escapeHTML(c.albedoRange)}</p>
                <small>Albedo is the fraction of sunlight reflected by the asteroid's surface.</small>
            </div>

            <div class="modal-info-card">
                <strong>Probable Solar System Origin</strong>
                <p>${escapeHTML(c.spectralOrigin)}</p>
                <small>Gravitationally perturbed into a near-Earth orbit over millions of years.</small>
            </div>
        `;
    }

    if (DOM.modalOrbitalInfo) {
        DOM.modalOrbitalInfo.innerHTML = `
            <div class="modal-info-card">
                <strong>Dynamical Orbital Group</strong>
                <p>${escapeHTML(c.orbitalFamily)} (${escapeHTML(c.orbitalTag)})</p>
                <small>${escapeHTML(c.orbitalDetails)}</small>
            </div>

            <div class="modal-info-card">
                <strong>Orbital Trajectory Behavior</strong>
                <p>${escapeHTML(c.orbitalDesc)}</p>
                <small>Orbiting Body: ${escapeHTML(asteroid.orbitingBody)}</small>
            </div>
        `;
    }

    if (DOM.modalPhysicsInfo) {
        DOM.modalPhysicsInfo.innerHTML = `
            <div class="modal-info-card">
                <strong>Estimated Diameter</strong>
                <p>${formatNumber(asteroid.diameter)} m (${formatNumber(asteroid.minDiameter)} – ${formatNumber(asteroid.maxDiameter)} m)</p>
                <small>Scale: ${escapeHTML(getSizeComparison(asteroid.diameter))}</small>
            </div>

            <div class="modal-info-card">
                <strong>Miss Distance at Approach</strong>
                <p>${formatNumber(c.lunarDistances, 2)} Lunar Distances (LD)</p>
                <small>${formatDistance(asteroid.missDistance)} (1 LD ≈ 384,400 km)</small>
            </div>

            <div class="modal-info-card">
                <strong>Relative Velocity</strong>
                <p>${formatNumber(asteroid.velocity, 2)} km/s (~${formatNumber(c.velocityKmh, 0)} km/h)</p>
                <small>Equates to approximately Mach ${formatNumber(c.velocityMach, 0)} (times speed of sound)</small>
            </div>

            <div class="modal-info-card">
                <strong>Estimated Mass & Kinetic Energy</strong>
                <p>~${formatNumber(c.massTonnes, 0)} metric tonnes</p>
                <small>Equiv. Kinetic Energy: ~${formatNumber(c.energyMegatons, 2)} Megatons TNT</small>
            </div>
        `;
    }

    if (DOM.modalAtmosphericNote) {
        DOM.modalAtmosphericNote.innerHTML = `
            <strong>Atmospheric Entry Physics:</strong> ${escapeHTML(c.atmosphericPhysics)}
        `;
    }

    if (DOM.modalDefenseInfo) {
        const isPha = asteroid.isHazardous;
        DOM.modalDefenseInfo.innerHTML = `
            <p><strong>Planetary Defense Status:</strong> ${isPha ? "Classified as a Potentially Hazardous Asteroid (PHA)." : "Non-Hazardous Near-Earth Object."}</p>
            <p style="margin-top: 6px;">
                ${isPha
                    ? "NASA classifies NEOs as PHAs when their Minimum Orbit Intersection Distance (MOID) to Earth is ≤ 0.05 AU (~7.5 million km / 19.5 Lunar Distances) and diameter is ≥ 140 m. This does NOT indicate an imminent collision, but rather that the object's orbit is closely tracked by NASA JPL Sentry automated impact monitoring."
                    : "This object does not meet PHA criteria because its orbit maintains a safe miss distance or its diameter is below the 140-meter regional damage threshold."
                }
            </p>
            <p style="margin-top: 6px;">
                <strong>Real Planetary Defense:</strong> In September 2022, NASA demonstrated genuine planetary defense with the <em>DART (Double Asteroid Redirection Test)</em> mission, altering asteroid Dimorphos's orbit via kinetic impact deflection.
            </p>
        `;
    }

    if (DOM.modalJplLink) {
        DOM.modalJplLink.href = asteroid.nasaUrl || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(asteroid.id)}`;
    }

    if (DOM.asteroidModal) {
        DOM.asteroidModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeAsteroidModal() {
    if (DOM.asteroidModal) {
        DOM.asteroidModal.classList.add("hidden");
        document.body.style.overflow = "";
    }
    state.selectedAsteroid = null;
}


/* =========================================================
   19. ASTEROID SCIENCE GUIDE MODAL
   ========================================================= */

function openScienceGuideModal() {
    if (DOM.scienceGuideModal) {
        DOM.scienceGuideModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeScienceGuideModal() {
    if (DOM.scienceGuideModal) {
        DOM.scienceGuideModal.classList.add("hidden");
        document.body.style.overflow = "";
    }
}


/* =========================================================
   20. DASHBOARD RENDER ORCHESTRATOR
   ========================================================= */

function renderDashboard() {
    const stats = calculateStats(state.asteroids);
    renderStats(stats);
    renderAdvisoryBanner(stats.hazardous);
    filterAndRenderAsteroids();
    renderRadarMarkers(state.asteroids);
    updateTelemetryOverview(stats);
}


/* =========================================================
   21. LOADING & ERROR UI STATES
   ========================================================= */

function setLoading(isLoading) {
    if (DOM.loadingState) {
        DOM.loadingState.classList.toggle("hidden", !isLoading);
    }

    if (isLoading) {
        if (DOM.errorState) DOM.errorState.classList.add("hidden");
        if (DOM.emptyState) DOM.emptyState.classList.add("hidden");
        if (DOM.asteroidGrid) DOM.asteroidGrid.innerHTML = "";
        if (DOM.scanButton) {
            DOM.scanButton.disabled = true;
            DOM.scanButton.textContent = "RETRIEVING TELEMETRY...";
        }
    } else {
        if (DOM.scanButton) {
            DOM.scanButton.disabled = false;
            DOM.scanButton.textContent = "⌕ QUERY NASA TELEMETRY";
        }
    }
}

function showError(message) {
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
    if (DOM.errorState) DOM.errorState.classList.remove("hidden");
    if (DOM.asteroidGrid) DOM.asteroidGrid.innerHTML = "";
    if (DOM.emptyState) DOM.emptyState.classList.add("hidden");
    if (DOM.resultsCount) DOM.resultsCount.textContent = "Data unavailable";
    updateConnectionStatus("OFFLINE", true);
}

function hideError() {
    if (DOM.errorState) DOM.errorState.classList.add("hidden");
}


/* =========================================================
   22. EVENT HANDLERS & INITIALIZATION
   ========================================================= */

function initializeEvents() {
    // 1. Homepage Navigation Triggers
    if (DOM.enterObservatoryBtn) {
        DOM.enterObservatoryBtn.addEventListener("click", () => enterObservatory());
    }
    if (DOM.hpQuickEnterBtn) {
        DOM.hpQuickEnterBtn.addEventListener("click", () => enterObservatory());
    }
    if (DOM.returnHomeBtn) {
        DOM.returnHomeBtn.addEventListener("click", showHomepage);
    }

    // Homepage Feature Highlight Cards
    if (DOM.hlCardTelemetry) {
        DOM.hlCardTelemetry.addEventListener("click", () => enterObservatory("overview"));
    }
    if (DOM.hlCardSpectral) {
        DOM.hlCardSpectral.addEventListener("click", () => enterObservatory("asteroid-feed"));
    }
    if (DOM.hlCardDefense) {
        DOM.hlCardDefense.addEventListener("click", () => enterObservatory("mission-status"));
    }

    // 2. Mobile Sidebar Exit & Open Triggers
    if (DOM.mobileMenuButton) {
        DOM.mobileMenuButton.addEventListener("click", openSidebar);
    }
    if (DOM.sidebarCloseBtn) {
        DOM.sidebarCloseBtn.addEventListener("click", closeSidebar);
    }
    if (DOM.sidebarExitAction) {
        DOM.sidebarExitAction.addEventListener("click", closeSidebar);
    }
    if (DOM.sidebarBackdrop) {
        DOM.sidebarBackdrop.addEventListener("click", closeSidebar);
    }

    // Close sidebar on link click on mobile
    const navLinks = document.querySelectorAll(".sidebar .nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // 3. Clickable Title to Refresh
    if (DOM.brandRefreshBtn) {
        DOM.brandRefreshBtn.addEventListener("click", refreshObservatoryTelemetry);
        DOM.brandRefreshBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                refreshObservatoryTelemetry();
            }
        });
    }

    if (DOM.headerRefreshBtn) {
        DOM.headerRefreshBtn.addEventListener("click", refreshObservatoryTelemetry);
        DOM.headerRefreshBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                refreshObservatoryTelemetry();
            }
        });
    }

    // 4. Theme Toggles (Homepage & Dashboard)
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener("click", toggleTheme);
    }
    if (DOM.sidebarThemeToggle) {
        DOM.sidebarThemeToggle.addEventListener("click", toggleTheme);
    }
    if (DOM.hpThemeToggle) {
        DOM.hpThemeToggle.addEventListener("click", toggleTheme);
    }

    // 5. Top Occurrence Stat Cards Click (Functions as Occurrence Tabs)
    if (DOM.statTabAll) {
        DOM.statTabAll.addEventListener("click", () => setOccurrenceTab("all", true));
        DOM.statTabAll.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOccurrenceTab("all", true); }
        });
    }
    if (DOM.statTabHazardous) {
        DOM.statTabHazardous.addEventListener("click", () => setOccurrenceTab("hazardous", true));
        DOM.statTabHazardous.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOccurrenceTab("hazardous", true); }
        });
    }
    if (DOM.statTabClosest) {
        DOM.statTabClosest.addEventListener("click", () => setOccurrenceTab("closest", true));
        DOM.statTabClosest.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOccurrenceTab("closest", true); }
        });
    }
    if (DOM.statTabFastest) {
        DOM.statTabFastest.addEventListener("click", () => setOccurrenceTab("fastest", true));
        DOM.statTabFastest.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOccurrenceTab("fastest", true); }
        });
    }

    // 6. Feed Occurrence Tab Buttons
    if (DOM.occTabAll) DOM.occTabAll.addEventListener("click", () => setOccurrenceTab("all", false));
    if (DOM.occTabHazardous) DOM.occTabHazardous.addEventListener("click", () => setOccurrenceTab("hazardous", false));
    if (DOM.occTabClosest) DOM.occTabClosest.addEventListener("click", () => setOccurrenceTab("closest", false));
    if (DOM.occTabFastest) DOM.occTabFastest.addEventListener("click", () => setOccurrenceTab("fastest", false));

    // 7. Alert Banner Actions
    if (DOM.alertViewPhasBtn) {
        DOM.alertViewPhasBtn.addEventListener("click", () => setOccurrenceTab("hazardous", true));
    }
    if (DOM.alertGuideBtn) {
        DOM.alertGuideBtn.addEventListener("click", openScienceGuideModal);
    }
    if (DOM.hpOpenGuideBtn) {
        DOM.hpOpenGuideBtn.addEventListener("click", openScienceGuideModal);
    }

    // 8. Science Guide Modal Triggers
    if (DOM.sidebarScienceGuideBtn) {
        DOM.sidebarScienceGuideBtn.addEventListener("click", openScienceGuideModal);
    }
    if (DOM.guideClose) DOM.guideClose.addEventListener("click", closeScienceGuideModal);
    if (DOM.guideDismissBtn) DOM.guideDismissBtn.addEventListener("click", closeScienceGuideModal);
    if (DOM.scienceGuideModal) {
        DOM.scienceGuideModal.addEventListener("click", (e) => {
            if (e.target === DOM.scienceGuideModal) closeScienceGuideModal();
        });
    }

    // 9. Asteroid Inspector Modal Dismissals
    if (DOM.modalClose) DOM.modalClose.addEventListener("click", closeAsteroidModal);
    if (DOM.modalDismissBtn) DOM.modalDismissBtn.addEventListener("click", closeAsteroidModal);
    if (DOM.asteroidModal) {
        DOM.asteroidModal.addEventListener("click", (e) => {
            if (e.target === DOM.asteroidModal) closeAsteroidModal();
        });
    }

    // Escape Key Listener to dismiss modals & sidebar
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeAsteroidModal();
            closeScienceGuideModal();
            closeSidebar();
        }
    });

    // 10. Filters & Search Input
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener("input", (e) => {
            state.searchQuery = e.target.value.trim();
            filterAndRenderAsteroids();
        });
    }

    if (DOM.riskFilter) {
        DOM.riskFilter.addEventListener("change", (e) => {
            state.filterRisk = e.target.value;
            filterAndRenderAsteroids();
        });
    }

    if (DOM.resetFilters) {
        DOM.resetFilters.addEventListener("click", () => {
            if (DOM.searchInput) DOM.searchInput.value = "";
            if (DOM.riskFilter) DOM.riskFilter.value = "all";
            state.searchQuery = "";
            state.filterRisk = "all";
            setOccurrenceTab("all", false);
        });
    }

    // 11. Query NASA Button & Retry
    if (DOM.scanButton) {
        DOM.scanButton.addEventListener("click", () => {
            const date = DOM.datePicker.value;
            if (!date) return;
            DOM.headerDate.textContent = formatDate(date);
            fetchAsteroids(date);
        });
    }

    if (DOM.retryButton) {
        DOM.retryButton.addEventListener("click", () => {
            fetchAsteroids(state.selectedDate);
        });
    }

    // 12. Date Picker Change
    if (DOM.datePicker) {
        const today = getLocalDate();
        DOM.datePicker.max = today;
        DOM.datePicker.value = today;

        if (DOM.headerDate) DOM.headerDate.textContent = formatDate(today);

        DOM.datePicker.addEventListener("change", () => {
            const selectedDate = DOM.datePicker.value;
            if (!selectedDate) return;

            DOM.headerDate.textContent = formatDate(selectedDate);
            fetchAsteroids(selectedDate);
        });
    }
}

function initializeApp() {
    console.log(
        "%c NEO OBSERVATORY & PLANETARY DEFENSE SCI-FI SYSTEM INITIALIZED ",
        "background:#5DD62C;color:#000;font-weight:bold;padding:8px;border-radius:4px;"
    );

    initTheme();
    initializeEvents();
}

// Start application
initializeApp();
