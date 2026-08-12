import json

from pydantic import ValidationError

from app.models import DashboardPayload


def validate_payload(data: dict) -> DashboardPayload:
    """
    Validate a DashboardPayload dictionary using Pydantic.
    """

    return DashboardPayload.model_validate(data)


def validate_json_file(path: str) -> DashboardPayload:
    """
    Read and validate a JSON file.
    """

    with open(path, "r", encoding="utf-8") as file:
        data = json.load(file)

    return validate_payload(data)


def validate_json_string(json_string: str) -> DashboardPayload:
    """
    Validate a JSON string.
    """

    return DashboardPayload.model_validate_json(json_string)