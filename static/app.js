let severityChart = null;
let eventRateChart = null;
let anomalyRateChart = null;
let currentAnalysisId = null;


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {
    const existingError = document.getElementById("dashboard-error");

    if (existingError) {
        existingError.remove();
    }

    // If a specific analysis is being viewed, don't auto-refresh it with the latest.
    // The user can click "Load Latest Analysis" to go back.
    const source = currentAnalysisId ? `/api/analysis/${currentAnalysisId}` : "/api/dashboard";

    await loadHistory();

    try {
        const response = await fetch(source, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`Failed to load dashboard from ${source}: HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.detail) {
            throw new Error(data.detail);
        }

        console.log(`Dashboard response from ${source}:`, data);

        currentAnalysisId = data.analysis.analysis_id;

        renderDashboard(data);

    } catch (error) {
        console.error(`Dashboard loading error from ${source}:`, error);
        showDashboardError(error.message);
    }
}


async function loadHistory() {
    const historyList = document.getElementById("analysis-history-list");

    if (!historyList) {
        return;
    }

    try {
        const response = await fetch("/api/history");
        if (!response.ok) {
            historyList.innerHTML = "<li>Failed to load history.</li>";
            return;
        }

        const history = await response.json();

        historyList.innerHTML = ""; // Clear existing list

        if (history.length === 0) {
            historyList.innerHTML = "<li>No history available.</li>";
            return;
        }

        history.forEach(item => {
            const listItem = document.createElement("li");
            listItem.dataset.analysisId = item.analysis_id;
            listItem.innerHTML = `
                <span class="history-date">${formatDate(item.started_at, { timeStyle: "short", dateStyle: "short" })}</span>
                <span class="history-id">${item.analysis_id}</span>
                <span class="badge">${item.status}</span>
            `;

            if (item.analysis_id === currentAnalysisId) {
                listItem.classList.add("active");
            }

            listItem.addEventListener("click", () => {
                loadSpecificAnalysis(item.analysis_id);
            });

            historyList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Failed to load analysis history:", error);
        historyList.innerHTML = "<li>Error loading history.</li>";
    }
}


async function loadSpecificAnalysis(analysisId) {
    console.log(`Loading specific analysis: ${analysisId}`);
    currentAnalysisId = analysisId;
    await loadDashboard(); // This will now use the currentAnalysisId
}


function loadLatestAnalysis() {
    console.log("Loading latest analysis");
    currentAnalysisId = null; // Unset the specific ID to fetch the latest
    const payloadEditor = document.getElementById("payload-editor");
    payloadEditor.value = ""; // Clear editor when loading latest
    loadDashboard();
}


function showPayloadMessage(message, isError = false) {
    const payloadMessage = document.getElementById("payload-message");

    if (!payloadMessage) {
        return;
    }

    payloadMessage.textContent = message;
    payloadMessage.className = `payload-message ${isError ? "error" : "success"}`;
}


function initializePayloadEditor() {
    const payloadEditor = document.getElementById("payload-editor");
    const submitButton = document.getElementById("submit-payload-button");
    const loadButton = document.getElementById("load-payload-button");
    const loadLatestButton = document.getElementById("load-latest-button");
    const payloadMessage = document.getElementById("payload-message");

    if (!payloadEditor || !submitButton || !loadButton || !payloadMessage) {
        return;
    }

    loadButton.addEventListener("click", async () => {
        payloadMessage.textContent = "";

        try {
            const response = await fetch("/data/dashboard_payload.json", {
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                cache: "no-store"
            });

            if (!response.ok) {
                throw new Error(`Failed to load default JSON: HTTP ${response.status}`);
            }

            const data = await response.json();
            payloadEditor.value = JSON.stringify(data, null, 2);
            renderDashboard(data);
            showPayloadMessage("Loaded default dashboard payload.");
        } catch (error) {
            showPayloadMessage(error.message, true);
        }
    });

    submitButton.addEventListener("click", async () => {
        payloadMessage.textContent = "";

        let payload;

        try {
            payload = JSON.parse(payloadEditor.value);
        } catch (error) {
            showPayloadMessage("Invalid JSON. Please correct it and try again.", true);
            return;
        }

        try {
            const response = await fetch("/api/analysis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || result.message || `HTTP ${response.status}`);
            }

            showPayloadMessage("Payload submitted successfully. Refreshing dashboard...");

            if (result.payload) {
                // Load the new analysis that was just submitted
                loadSpecificAnalysis(result.analysis_id);
            }
        } catch (error) {
            showPayloadMessage(error.message, true);
        }
    });
}


// ============================================================
// MAIN DASHBOARD RENDERER
// ============================================================

function renderDashboard(data) {

    document.querySelectorAll("#analysis-history-list li").forEach(li => li.classList.remove("active"));
    document.querySelector(`#analysis-history-list li[data-analysis-id="${data.analysis.analysis_id}"]`)?.classList.add("active");
    if (!data) {
        throw new Error("Dashboard API returned empty data.");
    }

    // ----------------------------------------
    // SYSTEM
    // ----------------------------------------

    const system = data.system || {};

    setText(
        "system-name",
        system.name || "Machine Dashboard"
    );

    const systemType = system.type || "Unknown";
    const systemSource = system.source || "Unknown";

    setText(
        "system-source",
        `${systemType} • ${systemSource}`
    );

    setText(
        "system-id",
        `System ID: ${system.id || "--"}`
    );

    setText(
        "schema-version",
        `Schema: ${data.schema_version || "--"}`
    );


    // ----------------------------------------
    // ANALYSIS
    // ----------------------------------------

    const analysis = data.analysis || {};

    const healthScore =
        analysis.health_score !== undefined &&
            analysis.health_score !== null
            ? analysis.health_score
            : "--";

    const status =
        analysis.status !== undefined &&
            analysis.status !== null
            ? analysis.status
            : "--";

    setText(
        "health-score",
        healthScore
    );

    setText(
        "health-status",
        status
    );

    setText(
        "status-badge",
        status
    );

    const startedAt = analysis.started_at;
    const endedAt = analysis.ended_at;

    let analysisPeriod = "--";

    if (startedAt && endedAt) {
        analysisPeriod = `${formatDate(startedAt)} → ${formatDate(endedAt)}`;
    }

    const payloadEditor = document.getElementById("payload-editor");
    if (payloadEditor) {
        payloadEditor.value = JSON.stringify(data, null, 2);
    }


    setText(
        "analysis-period",
        analysisPeriod
    );


    // ----------------------------------------
    // SUMMARY
    // ----------------------------------------

    const summary = data.summary || {};

    setText(
        "analysis-id",
        analysis.analysis_id || "--"
    );

    setText(
        "unique-templates",
        formatNumber(summaryValue(
            analysis.unique_event_templates,
            0
        ))
    );

    setText(
        "total-events",
        formatNumber(summaryValue(
            analysis.total_events,
            0
        ))
    );

    setText(
        "normal-events",
        formatNumber(summaryValue(
            summary.normal_events,
            0
        ))
    );

    setText(
        "anomalous-events",
        formatNumber(summaryValue(
            summary.anomalous_events,
            0
        ))
    );

    setText(
        "anomaly-rate",
        formatPercentage(summary.anomaly_rate)
    );

    setText(
        "critical-anomalies",
        formatNumber(summaryValue(
            summary.critical_anomalies,
            0
        ))
    );

    setText(
        "high-anomalies",
        formatNumber(summaryValue(
            summary.high_anomalies,
            0
        ))
    );

    setText(
        "medium-anomalies",
        formatNumber(summaryValue(
            summary.medium_anomalies,
            0
        ))
    );

    setText(
        "low-anomalies",
        formatNumber(summaryValue(
            summary.low_anomalies,
            0
        ))
    );


    // ----------------------------------------
    // CHARTS
    // ----------------------------------------

    const eventStatistics =
        data.event_statistics || {};

    const trends =
        data.trends || {};

    renderSeverityChart(
        Array.isArray(eventStatistics.severity_distribution)
            ? eventStatistics.severity_distribution
            : []
    );

    renderEventRateChart(
        Array.isArray(trends.event_rate)
            ? trends.event_rate
            : []
    );

    renderAnomalyRateChart(
        Array.isArray(trends.anomaly_rate)
            ? trends.anomaly_rate
            : []
    );


    // ----------------------------------------
    // TOP EVENTS
    // ----------------------------------------

    renderTopEvents(
        Array.isArray(eventStatistics.top_events)
            ? eventStatistics.top_events
            : []
    );


    // ----------------------------------------
    // ANOMALIES
    // ----------------------------------------

    renderAnomalies(
        Array.isArray(data.anomalies)
            ? data.anomalies
            : []
    );


    // ----------------------------------------
    // INSIGHTS
    // ----------------------------------------

    renderInsights(
        data.insights || {}
    );


    // ----------------------------------------
    // METADATA
    // ----------------------------------------

    renderMetadata(
        data.metadata || {}
    );


    // ----------------------------------------
    // AFFECTED ENTITIES
    // ----------------------------------------

    renderEntities(
        Array.isArray(data.affected_entities)
            ? data.affected_entities
            : []
    );
}


// ============================================================
// SEVERITY CHART
// ============================================================

function renderSeverityChart(items) {

    const canvas =
        document.getElementById("severityChart");

    if (!canvas) {
        console.warn("severityChart canvas not found.");
        return;
    }

    const labels = items.map(item =>
        item.level || "UNKNOWN"
    );

    const values = items.map(item =>
        Number(item.count) || 0
    );

    if (severityChart) {
        severityChart.destroy();
    }

    if (typeof Chart === "undefined") {
        console.error(
            "Chart.js is not loaded."
        );
        return;
    }

    severityChart = new Chart(
        canvas,
        {
            type: "doughnut",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Events",
                        data: values
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );
}


// ============================================================
// EVENT RATE CHART
// ============================================================

function renderEventRateChart(items) {

    const canvas =
        document.getElementById("eventRateChart");

    if (!canvas) {
        console.warn("eventRateChart canvas not found.");
        return;
    }

    const labels = items.map(item =>
        formatDate(item.timestamp)
    );

    const values = items.map(item =>
        Number(item.value) || 0
    );

    if (eventRateChart) {
        eventRateChart.destroy();
    }

    if (typeof Chart === "undefined") {
        console.error(
            "Chart.js is not loaded."
        );
        return;
    }

    eventRateChart = new Chart(
        canvas,
        {
            type: "line",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Events",
                        data: values,
                        tension: 0.3
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}


// ============================================================
// ANOMALY RATE CHART
// ============================================================

function renderAnomalyRateChart(items) {

    const canvas =
        document.getElementById("anomalyRateChart");

    if (!canvas) {
        console.warn("anomalyRateChart canvas not found.");
        return;
    }

    const labels = items.map(item =>
        formatDate(item.timestamp)
    );

    const values = items.map(item =>
        Number(item.value) || 0
    );

    if (anomalyRateChart) {
        anomalyRateChart.destroy();
    }

    if (typeof Chart === "undefined") {
        console.error(
            "Chart.js is not loaded."
        );
        return;
    }

    anomalyRateChart = new Chart(
        canvas,
        {
            type: "line",

            data: {
                labels: labels,

                datasets: [
                    {
                        label: "Anomaly %",
                        data: values,
                        tension: 0.3
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    );
}


// ============================================================
// TOP EVENTS TABLE
// ============================================================

function renderTopEvents(events) {

    const table =
        document.getElementById("top-events-table");

    if (!table) {
        console.warn("top-events-table not found.");
        return;
    }

    table.innerHTML = "";

    if (events.length === 0) {
        table.innerHTML = `
    <tr>
    <td colspan="4">
        No top event data available.
    </td>
            </tr>
    `;

        return;
    }

    events.forEach(event => {

        const row =
            document.createElement("tr");

        row.innerHTML = `
    <td>
    ${escapeHtml(event.event_id || "--")}
            </td>

            <td>
                ${escapeHtml(event.template || "--")}
            </td>

            <td>
                ${formatNumber(event.count)}
            </td>

            <td>
                ${formatPercentage(event.percentage)}
            </td>
`;

        table.appendChild(row);
    });
}


// ============================================================
// ANOMALIES
// ============================================================

function renderAnomalies(anomalies) {

    const container =
        document.getElementById("anomaly-container");

    if (!container) {
        console.warn("anomaly-container not found.");
        return;
    }

    container.innerHTML = "";

    if (anomalies.length === 0) {
        container.innerHTML = `
    <div class="anomaly-card">
        <p>No anomalies available.</p>
            </div>
    `;

        return;
    }

    anomalies.forEach(anomaly => {

        const card = document.createElement("div");
        card.className = "anomaly-card";

        const title = document.createElement("h3");
        title.textContent = anomaly.title || "Unnamed anomaly";
        card.appendChild(title);

        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = anomaly.severity || "--";
        card.appendChild(badge);

        const description = document.createElement("p");
        description.textContent = anomaly.description || "";
        card.appendChild(description);

        const metaFields = [
            ["Type", anomaly.type || "--"],
            ["Occurrences", formatNumber(anomaly.occurrences)],
            ["Confidence", formatConfidence(anomaly.confidence)],
            ["First Detected", formatDate(anomaly.first_detected)],
            ["Last Detected", formatDate(anomaly.last_detected)],
        ];

        metaFields.forEach(([label, value]) => {
            const paragraph = document.createElement("p");
            paragraph.innerHTML = `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`;
            card.appendChild(paragraph);
        });

        const evidenceHeading = document.createElement("h4");
        evidenceHeading.textContent = "Evidence";
        card.appendChild(evidenceHeading);

        const evidenceList = document.createElement("ul");
        const anomalyEvidence = Array.isArray(anomaly.evidence)
            ? anomaly.evidence
            : [];

        if (anomalyEvidence.length === 0) {
            const listItem = document.createElement("li");
            listItem.textContent = "No evidence available.";
            evidenceList.appendChild(listItem);
        } else {
            anomalyEvidence.forEach(item => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `${escapeHtml(item.metric || "--")}: ${escapeHtml(item.value ?? "--")} ${escapeHtml(item.unit || "")} (baseline: ${escapeHtml(item.baseline ?? "--")})`;
                evidenceList.appendChild(listItem);
            });
        }

        card.appendChild(evidenceList);

        const causesHeading = document.createElement("h4");
        causesHeading.textContent = "Possible Causes";
        card.appendChild(causesHeading);

        const possibleCauses = Array.isArray(anomaly.possible_causes)
            ? anomaly.possible_causes
            : [];

        if (possibleCauses.length === 0) {
            const noCauses = document.createElement("p");
            noCauses.textContent = "No possible causes available.";
            card.appendChild(noCauses);
        } else {
            possibleCauses.forEach(cause => {
                const causeDiv = document.createElement("div");
                causeDiv.className = "cause";
                causeDiv.innerHTML = `<strong>${escapeHtml(cause.cause || "--")}</strong><br>Confidence: ${escapeHtml(formatConfidence(cause.confidence))}`;
                card.appendChild(causeDiv);
            });
        }

        const recommendationsHeading = document.createElement("h4");
        recommendationsHeading.textContent = "Recommendations";
        card.appendChild(recommendationsHeading);

        const anomalyRecommendations = Array.isArray(anomaly.recommendations)
            ? anomaly.recommendations
            : [];

        if (anomalyRecommendations.length === 0) {
            const noRecommendations = document.createElement("p");
            noRecommendations.textContent = "No recommendations available.";
            card.appendChild(noRecommendations);
        } else {
            anomalyRecommendations.forEach(rec => {
                const recDiv = document.createElement("div");
                recDiv.className = "recommendation";
                recDiv.innerHTML = `<strong>${escapeHtml(rec.priority || "--")}</strong> — ${escapeHtml(rec.action || "--")}`;
                card.appendChild(recDiv);
            });
        }

        container.appendChild(card);
    });
}


// ============================================================
// AI INSIGHTS
// ============================================================

function renderInsights(insights) {

    const summaryElement =
        document.getElementById("insight-summary");

    const rootCausesContainer =
        document.getElementById("root-causes");

    // ----------------------------------------
    // SUMMARY
    // ----------------------------------------

    if (summaryElement) {

        summaryElement.textContent =
            insights.summary || "No AI insight available.";
    }


    // ----------------------------------------
    // ROOT CAUSES
    // ----------------------------------------

    if (!rootCausesContainer) {
        return;
    }

    rootCausesContainer.innerHTML = "";

    const hypotheses =
        Array.isArray(
            insights.root_cause_hypotheses
        )
            ? insights.root_cause_hypotheses
            : [];

    if (hypotheses.length === 0) {

        rootCausesContainer.innerHTML = `
    <p>
    No root cause hypotheses available.
            </p>
    `;

        return;
    }

    hypotheses.forEach(item => {

        const div =
            document.createElement("div");

        div.className = "cause";

        div.innerHTML = `
    <strong>
    ${escapeHtml(
            item.description || "--"
        )
            }
            </strong>

    <br>

        Confidence:
        ${formatConfidence(
                item.confidence
            )}
        `;

        rootCausesContainer.appendChild(div);
    });


    if (Array.isArray(insights.recommendations) &&
        insights.recommendations.length > 0) {

        const heading =
            document.createElement("h3");

        heading.textContent =
            "Recommendations";

        rootCausesContainer.appendChild(heading);


        insights.recommendations.forEach(
            recommendation => {

                const div =
                    document.createElement("div");

                div.className =
                    "recommendation";

                div.innerHTML = `
        <strong>
            ${escapeHtml(
                    recommendation.priority || "--"
                )}
        </strong>

        —
        ${escapeHtml(
                    recommendation.action || "--"
                )}
        `;

                rootCausesContainer.appendChild(div);
            }
        );
    }
}


// ============================================================
// METADATA
// ============================================================

function renderMetadata(metadata) {

    setText(
        "parser-name",
        metadata.parser?.name || "--"
    );

    setText(
        "parser-version",
        metadata.parser?.version || "--"
    );

    setText(
        "embedding-info",
        metadata.embedding
            ? `${metadata.embedding.enabled ? "Enabled" : "Disabled"} • ${metadata.embedding.model}`
            : "--"
    );

    setText(
        "retrieval-info",
        metadata.retrieval
            ? `${metadata.retrieval.enabled ? "Enabled" : "Disabled"} • ${metadata.retrieval.method}`
            : "--"
    );

    setText(
        "llm-info",
        metadata.llm
            ? `${metadata.llm.enabled ? "Enabled" : "Disabled"} • ${metadata.llm.provider} • ${metadata.llm.model}`
            : "--"
    );

    setText(
        "ground-truth-info",
        metadata.ground_truth
            ? `${metadata.ground_truth.available ? "Available" : "Unavailable"} • ${metadata.ground_truth.source}`
            : "--"
    );
}


// ============================================================
// AFFECTED ENTITIES
// ============================================================

function renderEntities(entities) {

    const table =
        document.getElementById("entities-table");

    if (!table) {
        console.warn("entities-table not found.");
        return;
    }

    table.innerHTML = "";

    if (entities.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5">
                    No affected entities available.
                </td>
            </tr>
        `;

        return;
    }

    entities.forEach(entity => {

        const row =
            document.createElement("tr");

        /*
         * DashboardPayload uses:
         *
         * entity.id
         *
         * NOT:
         *
         * entity.entity_id
         */

        const entityId =
            entity.id ??
            "--";

        row.innerHTML = `
        <td>
            ${escapeHtml(entityId)}
        </td>

        <td>
            ${escapeHtml(
            entity.type || "--"
        )}
        </td>

        <td>
            ${formatNumber(
            entity.event_count
        )}
        </td>

        <td>
            ${formatNumber(
            entity.anomaly_count
        )}
        </td>

        <td>
            ${escapeHtml(
            entity.status || "--"
        )}
        </td>
        `;

        table.appendChild(row);
    });
}


// ============================================================
// HELPER FUNCTIONS
// ============================================================

function setText(elementId, value) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        console.warn(
            `Element #${elementId} not found.`
        );

        return;
    }

    element.textContent =
        value !== undefined &&
            value !== null
            ? value
            : "--";
}


function summaryValue(value, fallback) {

    if (
        value === undefined ||
        value === null ||
        Number.isNaN(Number(value))
    ) {
        return fallback;
    }

    return value;
}


function formatNumber(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "--";
    }

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return "--";
    }

    return number.toLocaleString();
}


function formatPercentage(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "--";
    }

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return "--";
    }

    return `${number}%`;
}


function formatConfidence(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "--";
    }

    const number =
        Number(value);

    if (Number.isNaN(number)) {
        return "--";
    }

    return `${(number * 100).toFixed(0)}%`;
}


function formatDate(timestamp, options = {}) {

    if (!timestamp) {
        return "--";
    }

    const date =
        new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return timestamp;
    }

    return date.toLocaleString(undefined, options);
}


function escapeHtml(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


// ============================================================
// ERROR DISPLAY
// ============================================================

function showDashboardError(message) {

    const existing =
        document.getElementById(
            "dashboard-error"
        );

    if (existing) {
        existing.remove();
    }

    const errorDiv =
        document.createElement("div");

    errorDiv.id =
        "dashboard-error";

    errorDiv.style.padding =
        "20px";

    errorDiv.style.margin =
        "20px";

    errorDiv.style.border =
        "1px solid red";

    errorDiv.style.borderRadius =
        "8px";

    errorDiv.style.color =
        "red";

    errorDiv.style.background =
        "#fff5f5";

    errorDiv.innerHTML = `
        <strong>
            Failed to load dashboard data.
        </strong>

        <p>
            ${escapeHtml(
        message || "Unknown error"
    )}
        </p>

        <p>
            Check the browser console and
            <code>/api/dashboard</code>.
        </p>
        `;

    document.body.prepend(errorDiv);
}


// ============================================================
// START APPLICATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initializePayloadEditor();
        loadDashboard(); // Initial load
        setInterval(loadDashboard, 5000); // Refresh every 5 seconds
    }
);
