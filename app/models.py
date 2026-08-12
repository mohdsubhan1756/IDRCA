from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, ConfigDict


class System(BaseModel):
    id: str
    name: str
    type: str
    source: str


class Analysis(BaseModel):
    analysis_id: str
    started_at: datetime
    ended_at: datetime
    total_events: int = Field(ge=0)
    unique_event_templates: int = Field(ge=0)
    status: str
    health_score: float = Field(ge=0, le=100)


class Summary(BaseModel):
    normal_events: int = Field(ge=0)
    anomalous_events: int = Field(ge=0)
    anomaly_rate: float = Field(ge=0, le=100)

    critical_anomalies: int = Field(ge=0)
    high_anomalies: int = Field(ge=0)
    medium_anomalies: int = Field(ge=0)
    low_anomalies: int = Field(ge=0)


class SeverityDistribution(BaseModel):
    level: str
    count: int = Field(ge=0)
    percentage: float = Field(ge=0, le=100)


class TopEvent(BaseModel):
    event_id: str
    template: str
    count: int = Field(ge=0)
    percentage: float = Field(ge=0, le=100)


class EventStatistics(BaseModel):
    severity_distribution: List[SeverityDistribution]
    top_events: List[TopEvent]


class TrendPoint(BaseModel):
    timestamp: datetime
    value: float = Field(ge=0)


class Trends(BaseModel):
    event_rate: List[TrendPoint]
    anomaly_rate: List[TrendPoint]


class Evidence(BaseModel):
    metric: str
    value: float
    baseline: float | None = None
    unit: str


class PossibleCause(BaseModel):
    cause: str
    confidence: float = Field(ge=0, le=1)


class Recommendation(BaseModel):
    priority: str
    action: str


class Anomaly(BaseModel):
    id: str
    severity: str
    type: str
    title: str
    description: str

    first_detected: datetime
    last_detected: datetime

    occurrences: int = Field(ge=0)

    affected_entities: List[str]

    evidence: List[Evidence]

    possible_causes: List[PossibleCause]

    recommendations: List[Recommendation]

    confidence: float = Field(ge=0, le=1)


class AffectedEntity(BaseModel):
    id: str
    type: str
    event_count: int = Field(ge=0)
    anomaly_count: int = Field(ge=0)
    status: str


class RootCauseHypothesis(BaseModel):
    description: str
    confidence: float = Field(ge=0, le=1)


class Insights(BaseModel):
    summary: str

    root_cause_hypotheses: List[RootCauseHypothesis]

    recommendations: List[Recommendation]


class ParserMetadata(BaseModel):
    name: str
    version: str


class EmbeddingMetadata(BaseModel):
    enabled: bool
    model: str


class RetrievalMetadata(BaseModel):
    enabled: bool
    method: str


class LLMMetadata(BaseModel):
    enabled: bool
    provider: str
    model: str


class GroundTruthMetadata(BaseModel):
    available: bool
    source: str


class Metadata(BaseModel):
    parser: ParserMetadata
    embedding: EmbeddingMetadata
    retrieval: RetrievalMetadata
    llm: LLMMetadata
    ground_truth: GroundTruthMetadata


class DashboardPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: str

    system: System
    analysis: Analysis
    summary: Summary
    event_statistics: EventStatistics
    trends: Trends
    anomalies: List[Anomaly]
    affected_entities: List[AffectedEntity]
    insights: Insights
    metadata: Metadata