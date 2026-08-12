import json

import pytest
from pydantic import ValidationError

from app.models import DashboardPayload


def load_sample():

    with open(
        "data/dashboard_payload.json",
        "r",
        encoding="utf-8"
    ) as file:

        return json.load(file)


def test_valid_payload():

    data = load_sample()

    payload = DashboardPayload.model_validate(data)

    assert payload.schema_version == "1.0"

    assert payload.analysis.total_events == 125430

    assert payload.analysis.health_score == 72


def test_invalid_health_score():

    data = load_sample()

    data["analysis"]["health_score"] = 150

    with pytest.raises(ValidationError):

        DashboardPayload.model_validate(data)


def test_invalid_confidence():

    data = load_sample()

    data["anomalies"][0]["confidence"] = 2

    with pytest.raises(ValidationError):

        DashboardPayload.model_validate(data)


def test_missing_required_field():

    data = load_sample()

    del data["system"]["id"]

    with pytest.raises(ValidationError):

        DashboardPayload.model_validate(data)