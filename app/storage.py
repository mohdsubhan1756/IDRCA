from pathlib import Path
import json
from typing import List, Optional, Dict

from app.models import DashboardPayload


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
HISTORY_FILE = DATA_DIR / "history.json"

# In-memory cache for the analysis history
analysis_history: List[DashboardPayload] = []


def load_history():
    """
    Load analysis history from the JSON file into memory.
    """
    global analysis_history

    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history_data = json.load(f)
            analysis_history = [
                DashboardPayload.model_validate(item)
                for item in history_data
            ]


def save_history():
    """
    Save the in-memory analysis history to the JSON file.
    """
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        history_data = [
            payload.model_dump(mode="json")
            for payload in analysis_history
        ]
        json.dump(history_data, f, indent=4)


def add_payload(payload: DashboardPayload):
    """
    Add a new payload to the history and save it.
    """
    analysis_history.append(payload)
    save_history()


def get_all_payloads() -> List[DashboardPayload]:
    """
    Return all payloads from the history.
    """
    return analysis_history


def get_latest_payload() -> Optional[DashboardPayload]:
    """
    Return the most recent payload.
    """
    return analysis_history[-1] if analysis_history else None


def get_payload_by_id(analysis_id: str) -> Optional[DashboardPayload]:
    """
    Find and return a payload by its analysis_id.
    """
    for payload in reversed(analysis_history):
        if payload.analysis.analysis_id == analysis_id:
            return payload
    return None