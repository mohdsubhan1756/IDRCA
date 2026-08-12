// let severityChart;
// let eventRateChart;
// let anomalyRateChart;


// async function loadDashboard() {

//     try {

//         const response = await fetch("/api/dashboard");

//         if (!response.ok) {
//             throw new Error("Dashboard data could not be loaded");
//         }

//         const data = await response.json();

//         renderDashboard(data);

//     } catch (error) {

//         console.error(error);

//         document.body.innerHTML += `
//             <div style="padding:20px;color:red;">
//                 Failed to load dashboard data.
//                 Please run the seed endpoint first.
//             </div>
//         `;
//     }
// }


// function renderDashboard(data) {

//     // ----------------------------------------
//     // SYSTEM
//     // ----------------------------------------

//     document.getElementById("system-name").textContent =
//         data.system.name;

//     document.getElementById("system-source").textContent =
//         `${data.system.type} • ${data.system.source}`;


//     // ----------------------------------------
//     // ANALYSIS
//     // ----------------------------------------

//     document.getElementById("health-score").textContent =
//         data.analysis.health_score;

//     document.getElementById("health-status").textContent =
//         data.analysis.status;

//     document.getElementById("status-badge").textContent =
//         data.analysis.status;

//     document.getElementById("analysis-period").textContent =
//         `${formatDate(data.analysis.started_at)}
//          → ${formatDate(data.analysis.ended_at)}`;


//     // ----------------------------------------
//     // SUMMARY
//     // ----------------------------------------

//     document.getElementById("total-events").textContent =
//         formatNumber(data.analysis.total_events);

//     document.getElementById("anomalous-events").textContent =
//         formatNumber(data.summary.anomalous_events);

//     document.getElementById("anomaly-rate").textContent =
//         `${data.summary.anomaly_rate}%`;

//     document.getElementById("critical-anomalies").textContent =
//         data.summary.critical_anomalies;


//     // ----------------------------------------
//     // CHARTS
//     // ----------------------------------------

//     renderSeverityChart(
//         data.event_statistics.severity_distribution
//     );

//     renderEventRateChart(
//         data.trends.event_rate
//     );

//     renderAnomalyRateChart(
//         data.trends.anomaly_rate
//     );


//     // ----------------------------------------
//     // TOP EVENTS
//     // ----------------------------------------

//     renderTopEvents(
//         data.event_statistics.top_events
//     );


//     // ----------------------------------------
//     // ANOMALIES
//     // ----------------------------------------

//     renderAnomalies(
//         data.anomalies
//     );


//     // ----------------------------------------
//     // INSIGHTS
//     // ----------------------------------------

//     renderInsights(
//         data.insights
//     );


//     // ----------------------------------------
//     // ENTITIES
//     // ----------------------------------------

//     renderEntities(
//         data.affected_entities
//     );
// }


// function renderSeverityChart(items) {

//     const labels = items.map(item => item.level);
//     const values = items.map(item => item.count);

//     if (severityChart) {
//         severityChart.destroy();
//     }

//     severityChart = new Chart(
//         document.getElementById("severityChart"),
//         {
//             type: "doughnut",

//             data: {
//                 labels: labels,

//                 datasets: [{
//                     data: values
//                 }]
//             },

//             options: {
//                 responsive: true
//             }
//         }
//     );
// }


// function renderEventRateChart(items) {

//     const labels = items.map(item =>
//         formatDate(item.timestamp)
//     );

//     const values = items.map(item =>
//         item.value
//     );

//     if (eventRateChart) {
//         eventRateChart.destroy();
//     }

//     eventRateChart = new Chart(
//         document.getElementById("eventRateChart"),
//         {
//             type: "line",

//             data: {
//                 labels: labels,

//                 datasets: [{
//                     label: "Events",
//                     data: values,

//                     tension: 0.3
//                 }]
//             },

//             options: {
//                 responsive: true
//             }
//         }
//     );
// }


// function renderAnomalyRateChart(items) {

//     const labels = items.map(item =>
//         formatDate(item.timestamp)
//     );

//     const values = items.map(item =>
//         item.value
//     );

//     if (anomalyRateChart) {
//         anomalyRateChart.destroy();
//     }

//     anomalyRateChart = new Chart(
//         document.getElementById("anomalyRateChart"),
//         {
//             type: "line",

//             data: {
//                 labels: labels,

//                 datasets: [{
//                     label: "Anomaly %",
//                     data: values,

//                     tension: 0.3
//                 }]
//             },

//             options: {
//                 responsive: true
//             }
//         }
//     );
// }


// function renderTopEvents(events) {

//     const table =
//         document.getElementById("top-events-table");

//     table.innerHTML = "";

//     events.forEach(event => {

//         const row = document.createElement("tr");

//         row.innerHTML = `
//             <td>${escapeHtml(event.event_id)}</td>

//             <td>${escapeHtml(event.template)}</td>

//             <td>${formatNumber(event.count)}</td>

//             <td>${event.percentage}%</td>
//         `;

//         table.appendChild(row);
//     });
// }


// function renderAnomalies(anomalies) {

//     const container =
//         document.getElementById("anomaly-container");

//     container.innerHTML = "";

//     anomalies.forEach(anomaly => {

//         const card =
//             document.createElement("div");

//         card.className = "anomaly-card";

//         let causes = "";

//         anomaly.possible_causes.forEach(cause => {

//             causes += `
//                 <div class="cause">
//                     <strong>${escapeHtml(cause.cause)}</strong>
//                     <br>
//                     Confidence:
//                     ${(cause.confidence * 100).toFixed(0)}%
//                 </div>
//             `;
//         });


//         let recommendations = "";

//         anomaly.recommendations.forEach(rec => {

//             recommendations += `
//                 <div class="recommendation">
//                     <strong>${escapeHtml(rec.priority)}</strong>
//                     —
//                     ${escapeHtml(rec.action)}
//                 </div>
//             `;
//         });


//         let evidence = "";

//         anomaly.evidence.forEach(item => {

//             evidence += `
//                 <li>
//                     ${escapeHtml(item.metric)}:
//                     ${item.value}
//                     ${escapeHtml(item.unit)}
//                     (baseline: ${item.baseline})
//                 </li>
//             `;
//         });


//         card.innerHTML = `
//             <h3>
//                 ${escapeHtml(anomaly.title)}
//             </h3>

//             <span class="badge">
//                 ${escapeHtml(anomaly.severity)}
//             </span>

//             <p>
//                 ${escapeHtml(anomaly.description)}
//             </p>

//             <p>
//                 <strong>Occurrences:</strong>
//                 ${anomaly.occurrences}
//             </p>

//             <p>
//                 <strong>Confidence:</strong>
//                 ${(anomaly.confidence * 100).toFixed(0)}%
//             </p>

//             <h4>Evidence</h4>

//             <ul>
//                 ${evidence}
//             </ul>

//             <h4>Possible Causes</h4>

//             ${causes}

//             <h4>Recommendations</h4>

//             ${recommendations}
//         `;

//         container.appendChild(card);
//     });
// }


// function renderInsights(insights) {

//     document.getElementById("insight-summary")
//         .textContent = insights.summary || "";

//     const container =
//         document.getElementById("root-causes");

//     container.innerHTML = "";

//     if (!insights.root_cause_hypotheses) {
//         return;
//     }

//     insights.root_cause_hypotheses.forEach(item => {

//         const div =
//             document.createElement("div");

//         div.className = "cause";

//         div.innerHTML = `
//             ${escapeHtml(item.description)}
//             <br>
//             Confidence:
//             ${(item.confidence * 100).toFixed(0)}%
//         `;

//         container.appendChild(div);
//     });
// }


// function renderEntities(entities) {

//     const table =
//         document.getElementById("entities-table");

//     table.innerHTML = "";

//     entities.forEach(entity => {

//         const row = document.createElement("tr");

//         row.innerHTML = `
//             <td>${escapeHtml(entity.entity_id)}</td>
//             <td>${escapeHtml(entity.type)}</td>
//             <td>${formatNumber(entity.event_count)}</td>
//             <td>${formatNumber(entity.anomaly_count)}</td>
//             <td>${escapeHtml(entity.status)}</td>
//         `;

//         table.appendChild(row);
//     });
// }


// function formatNumber(number) {

//     return Number(number).toLocaleString();
// }


// function formatDate(timestamp) {

//     return new Date(timestamp).toLocaleString();
// }


// function escapeHtml(value) {

//     const div = document.createElement("div");

//     div.textContent = value;

//     return div.innerHTML;
// }


// loadDashboard();



let severityChart = null;
let eventRateChart = null;
let anomalyRateChart = null;


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {
    try {
        const response = await fetch("/api/dashboard", {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            let message = `Dashboard API returned HTTP ${response.status} `;

            try {
                const errorData = await response.json();

                if (errorData.detail) {
                    message = errorData.detail;
                }
            } catch (_) {
                // Ignore JSON parsing errors
            }

            throw new Error(message);
        }

        const data = await response.json();

        console.log("Dashboard API response:", data);

        renderDashboard(data);

    } catch (error) {
        console.error("Dashboard loading error:", error);

        showDashboardError(error.message);
    }
}


// ============================================================
// MAIN DASHBOARD RENDERER
// ============================================================

function renderDashboard(data) {

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
        `${systemType} • ${systemSource} `
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
        analysisPeriod =
            `${formatDate(startedAt)} → ${formatDate(endedAt)} `;
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
        "total-events",
        formatNumber(summaryValue(
            analysis.total_events,
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

        const card =
            document.createElement("div");

        card.className = "anomaly-card";


        // ----------------------------------------
        // POSSIBLE CAUSES
        // ----------------------------------------

        let causes = "";

        const possibleCauses =
            Array.isArray(anomaly.possible_causes)
                ? anomaly.possible_causes
                : [];

        possibleCauses.forEach(cause => {

            causes += `
    <div class="cause">

                    <strong>
                        ${escapeHtml(
                cause.cause || "--"
            )}
                    </strong>

                    <br>

                    Confidence:
                    ${formatConfidence(
                cause.confidence
            )}

                </div>
`;
        });

        if (!causes) {
            causes = `
    <p> No possible causes available.</p>
        `;
        }


        // ----------------------------------------
        // RECOMMENDATIONS
        // ----------------------------------------

        let recommendations = "";

        const anomalyRecommendations =
            Array.isArray(anomaly.recommendations)
                ? anomaly.recommendations
                : [];

        anomalyRecommendations.forEach(rec => {

            recommendations += `
        <div class="recommendation">

            <strong>
                ${escapeHtml(
                rec.priority || "--"
            )}
            </strong>

                    —
                    ${escapeHtml(
                rec.action || "--"
            )
                }

                </div>
    `;
        });

        if (!recommendations) {
            recommendations = `
    <p> No recommendations available.</p>
        `;
        }


        // ----------------------------------------
        // EVIDENCE
        // ----------------------------------------

        let evidence = "";

        const anomalyEvidence =
            Array.isArray(anomaly.evidence)
                ? anomaly.evidence
                : [];

        anomalyEvidence.forEach(item => {

            evidence += `
        <li>

        ${escapeHtml(
                item.metric || "--"
            )
                }:

                    ${escapeHtml(
                    item.value ?? "--"
                )
                }

                    ${escapeHtml(
                    item.unit || ""
                )
                }

(baseline:
    ${escapeHtml(
                    item.baseline ?? "--"
                )})

                </li>
    `;
        });

        if (!evidence) {
            evidence = `
    <li> No evidence available.</li>
        `;
        }


        // ----------------------------------------
        // ANOMALY CARD
        // ----------------------------------------

        card.innerHTML = `
        <h3>
        ${escapeHtml(
            anomaly.title || "Unnamed anomaly"
        )
            }
            </h3>

            <span class="badge">
                ${escapeHtml(
                anomaly.severity || "--"
            )}
            </span>

            <p>
                ${escapeHtml(
                anomaly.description || ""
            )}
            </p>

            <p>
                <strong>Type:</strong>
                ${escapeHtml(
                anomaly.type || "--"
            )}
            </p>

            <p>
                <strong>Occurrences:</strong>
                ${formatNumber(
                anomaly.occurrences
            )}
            </p>

            <p>
                <strong>Confidence:</strong>
                ${formatConfidence(
                anomaly.confidence
            )}
            </p>

            <p>
                <strong>First Detected:</strong>
                ${formatDate(
                anomaly.first_detected
            )}
            </p>

            <p>
                <strong>Last Detected:</strong>
                ${formatDate(
                anomaly.last_detected
            )}
            </p>

            <h4>Evidence</h4>

            <ul>
                ${evidence}
            </ul>

            <h4>Possible Causes</h4>

            ${causes}

<h4>Recommendations</h4>

            ${recommendations}
`;

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


function formatDate(timestamp) {

    if (!timestamp) {
        return "--";
    }

    const date =
        new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return timestamp;
    }

    return date.toLocaleString();
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
    loadDashboard
);
