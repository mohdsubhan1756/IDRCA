from pathlib import Path
import json

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import create_tables, get_connection
from app.models import DashboardPayload
from app.crud import save_dashboard_payload, get_dashboard_payload
from app.validation import validate_payload


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"


app = FastAPI(
    title="Machine Log Analysis Dashboard",
    version="1.0",
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
def startup():
    create_tables()


@app.get("/")
def dashboard():
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/validate")
def validate_dashboard_payload(payload: dict):
    """
    Validate DashboardPayload without storing it.
    """

    try:
        validated = validate_payload(payload)

        return {
            "valid": True,
            "message": "DashboardPayload is valid",
            "analysis_id": validated.analysis.analysis_id,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


@app.post("/api/analysis")
def create_analysis(payload: dict):
    """
    Validate and store DashboardPayload.
    """

    try:
        validated = validate_payload(payload)

        save_dashboard_payload(validated)

        return {
            "success": True,
            "message": "Payload validated and stored successfully",
            "analysis_id": validated.analysis.analysis_id,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


@app.api_route("/api/seed", methods=["GET", "POST"])
def seed_database():
    """
    Load the sample DashboardPayload from JSON and store it.
    """

    file_path = DATA_DIR / "dashboard_payload.json"

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="dashboard_payload.json not found",
        )

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            data = json.load(file)

        validated = validate_payload(data)
        save_dashboard_payload(validated)

        return {
            "success": True,
            "message": "Sample data validated and stored",
            "analysis_id": validated.analysis.analysis_id,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


# @app.get("/api/dashboard")
# def get_dashboard():

#     connection = get_connection()
#     cursor = connection.cursor()

#     try:
#         analysis = cursor.execute(
#             """
#             SELECT *
#             FROM analysis
#             ORDER BY started_at DESC
#             LIMIT 1
#             """
#         ).fetchone()

#         if not analysis:
#             raise HTTPException(
#                 status_code=404,
#                 detail="No analysis data found. Run /api/seed first.",
#             )

#         analysis_id = analysis["analysis_id"]

#         system = cursor.execute(
#             """
#             SELECT *
#             FROM system
#             WHERE system_id = ?
#             """,
#             (analysis["system_id"],),
#         ).fetchone()

#         summary = cursor.execute(
#             """
#             SELECT *
#             FROM summary
#             WHERE analysis_id = ?
#             """,
#             (analysis_id,),
#         ).fetchone()

#         severity_distribution = cursor.execute(
#             """
#             SELECT level, count, percentage
#             FROM event_statistics
#             WHERE analysis_id = ?
#             """,
#             (analysis_id,),
#         ).fetchall()

#         top_events = cursor.execute(
#             """
#             SELECT event_id, template, count, percentage
#             FROM top_events
#             WHERE analysis_id = ?
#             ORDER BY count DESC
#             """,
#             (analysis_id,),
#         ).fetchall()

#         event_trends = cursor.execute(
#             """
#             SELECT timestamp, value
#             FROM trends
#             WHERE analysis_id = ?
#             AND trend_type = 'event_rate'
#             ORDER BY timestamp
#             """,
#             (analysis_id,),
#         ).fetchall()

#         anomaly_trends = cursor.execute(
#             """
#             SELECT timestamp, value
#             FROM trends
#             WHERE analysis_id = ?
#             AND trend_type = 'anomaly_rate'
#             ORDER BY timestamp
#             """,
#             (analysis_id,),
#         ).fetchall()

#         anomalies = cursor.execute(
#             """
#             SELECT *
#             FROM anomalies
#             WHERE analysis_id = ?
#             ORDER BY occurrences DESC
#             """,
#             (analysis_id,),
#         ).fetchall()

#         entities = cursor.execute(
#             """
#             SELECT *
#             FROM affected_entities
#             WHERE analysis_id = ?
#             """,
#             (analysis_id,),
#         ).fetchall()

#         insights = cursor.execute(
#             """
#             SELECT *
#             FROM insights
#             WHERE analysis_id = ?
#             """,
#             (analysis_id,),
#         ).fetchone()

#         return {
#             "schema_version": "1.0",

#             "system": dict(system),

#             "analysis": dict(analysis),

#             "summary": dict(summary),

#             "event_statistics": {
#                 "severity_distribution": [
#                     dict(row)
#                     for row in severity_distribution
#                 ],
#                 "top_events": [
#                     dict(row)
#                     for row in top_events
#                 ],
#             },

#             "trends": {
#                 "event_rate": [
#                     dict(row)
#                     for row in event_trends
#                 ],
#                 "anomaly_rate": [
#                     dict(row)
#                     for row in anomaly_trends
#                 ],
#             },

#             "anomalies": [
#                 dict(row)
#                 for row in anomalies
#             ],

#             "affected_entities": [
#                 dict(row)
#                 for row in entities
#             ],

#             "insights": dict(insights) if insights else {},

#         }

#     finally:
#         connection.close()



@app.get("/api/dashboard")
def get_dashboard():
    connection = get_connection()

    try:
        analysis = connection.execute(
            """
            SELECT analysis_id
            FROM analysis
            ORDER BY started_at DESC
            LIMIT 1
            """
        ).fetchone()

    finally:
        connection.close()

    if analysis is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis data found. Run /api/seed first.",
        )

    payload = get_dashboard_payload(analysis["analysis_id"])

    if payload is None:
        raise HTTPException(
            status_code=404,
            detail="DashboardPayload not found.",
        )

    return payload.model_dump(mode="json")