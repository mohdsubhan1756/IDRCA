from pathlib import Path
import json
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.storage import load_history, add_payload, get_latest_payload, get_all_payloads, get_payload_by_id
from app.validation import validate_payload


BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"


app = FastAPI(
    title="Machine Log Analysis Dashboard",
    version="1.0",
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")


@app.on_event("startup")
def startup():
    """
    Load history on startup. If history is empty, seed it with default data.
    """
    load_history()
    
    # If the history is empty after loading, it means it's a fresh start.
    # Let's seed the application with the default payload.
    if not get_all_payloads():
        print("INFO:     No history found. Seeding with default data.")
        seed_database()


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

        add_payload(validated)

        return {
            "success": True,
            "message": "Payload validated, stored, and returned successfully",
            "analysis_id": validated.analysis.analysis_id,
            "payload": validated.model_dump(mode="json"),
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
        add_payload(validated)

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


@app.get("/api/dashboard")
def get_dashboard():
    """
    Return the latest dashboard payload.
    """
    payload = get_latest_payload()

    if payload is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis data found. Run /api/seed first.",
        )

    return payload.model_dump(mode="json")


@app.get("/api/history")
def get_history():
    """
    Return a list of all historical analyses.
    """
    payloads = get_all_payloads()

    # Return a summary for each analysis, sorted with newest first
    history_summary = [
        {
            "analysis_id": p.analysis.analysis_id,
            "started_at": p.analysis.started_at,
            "status": p.analysis.status,
            "health_score": p.analysis.health_score,
        }
        for p in payloads
    ]

    return sorted(history_summary, key=lambda x: x["started_at"], reverse=True)


@app.get("/api/analysis/{analysis_id}")
def get_analysis_by_id(analysis_id: str):
    """
    Return a specific dashboard payload by its analysis_id.
    """
    payload = get_payload_by_id(analysis_id)

    if payload is None:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis with ID '{analysis_id}' not found.",
        )

    return payload.model_dump(mode="json")