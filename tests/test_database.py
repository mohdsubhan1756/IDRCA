from datetime import datetime, timezone

from app.database import create_tables, save_dashboard_payload, get_dashboard_payload
from app.models import (
    DashboardPayload,
    System,
    Analysis,
    Summary,
    SeverityDistribution,
    TopEvent,
    EventStatistics,
    TrendPoint,
    Trends,
    Evidence,
    PossibleCause,
    Recommendation,
    Anomaly,
    AffectedEntity,
    RootCauseHypothesis,
    Insights,
    ParserMetadata,
    EmbeddingMetadata,
    RetrievalMetadata,
    LLMMetadata,
    GroundTruthMetadata,
    Metadata,
)


def create_test_payload():
    return DashboardPayload(
        schema_version="1.0",

        system=System(
            id="test-system",
            name="Test HDFS Cluster",
            type="distributed_system",
            source="HDFS_test",
        ),

        analysis=Analysis(
            analysis_id="test-analysis-001",
            started_at=datetime(2026, 8, 11, 8, 0, tzinfo=timezone.utc),
            ended_at=datetime(2026, 8, 11, 18, 0, tzinfo=timezone.utc),
            total_events=1000,
            unique_event_templates=10,
            status="WARNING",
            health_score=72,
        ),

        summary=Summary(
            normal_events=900,
            anomalous_events=100,
            anomaly_rate=10.0,
            critical_anomalies=5,
            high_anomalies=15,
            medium_anomalies=30,
            low_anomalies=50,
        ),

        event_statistics=EventStatistics(
            severity_distribution=[
                SeverityDistribution(
                    level="INFO",
                    count=900,
                    percentage=90.0,
                ),
                SeverityDistribution(
                    level="ERROR",
                    count=100,
                    percentage=10.0,
                ),
            ],
            top_events=[
                TopEvent(
                    event_id="E001",
                    template="Test event <*>",
                    count=200,
                    percentage=20.0,
                ),
            ],
        ),

        trends=Trends(
            event_rate=[
                TrendPoint(
                    timestamp=datetime(
                        2026, 8, 11, 8, 0, tzinfo=timezone.utc
                    ),
                    value=100,
                ),
            ],
            anomaly_rate=[
                TrendPoint(
                    timestamp=datetime(
                        2026, 8, 11, 8, 0, tzinfo=timezone.utc
                    ),
                    value=5.0,
                ),
            ],
        ),

        anomalies=[
            Anomaly(
                id="ANOM-TEST-001",
                severity="HIGH",
                type="FREQUENCY_SPIKE",
                title="Test anomaly",
                description="Test anomaly description",
                first_detected=datetime(
                    2026, 8, 11, 10, 0, tzinfo=timezone.utc
                ),
                last_detected=datetime(
                    2026, 8, 11, 10, 30, tzinfo=timezone.utc
                ),
                occurrences=20,
                affected_entities=["entity-001"],
                evidence=[
                    Evidence(
                        metric="event_frequency",
                        value=20,
                        baseline=5,
                        unit="events",
                    )
                ],
                possible_causes=[
                    PossibleCause(
                        cause="Test possible cause",
                        confidence=0.85,
                    )
                ],
                recommendations=[
                    Recommendation(
                        priority="HIGH",
                        action="Investigate test anomaly",
                    )
                ],
                confidence=0.9,
            )
        ],

        affected_entities=[
            AffectedEntity(
                id="entity-001",
                type="block",
                event_count=50,
                anomaly_count=5,
                status="WARNING",
            )
        ],

        insights=Insights(
            summary="Test analysis summary",
            root_cause_hypotheses=[
                RootCauseHypothesis(
                    description="Test root cause",
                    confidence=0.8,
                )
            ],
            recommendations=[
                Recommendation(
                    priority="HIGH",
                    action="Test recommendation",
                )
            ],
        ),

        metadata=Metadata(
            parser=ParserMetadata(
                name="Drain",
                version="test",
            ),
            embedding=EmbeddingMetadata(
                enabled=True,
                model="test-embedding",
            ),
            retrieval=RetrievalMetadata(
                enabled=True,
                method="local_similarity",
            ),
            llm=LLMMetadata(
                enabled=True,
                provider="cloud_api",
                model="test-model",
            ),
            ground_truth=GroundTruthMetadata(
                available=True,
                source="HDFS_test",
            ),
        ),
    )

from app.database import get_connection

# def test_database_save_and_retrieve():
#     create_tables()

#     original = create_test_payload()

#     save_dashboard_payload(original)

#     retrieved = get_dashboard_payload(
#         original.analysis.analysis_id
#     )

#     assert retrieved is not None

#     assert retrieved.schema_version == original.schema_version

#     assert retrieved.system == original.system

#     assert retrieved.analysis == original.analysis

#     assert retrieved.summary == original.summary

#     assert retrieved.event_statistics == original.event_statistics

#     assert retrieved.trends == original.trends

#     assert retrieved.anomalies == original.anomalies

#     assert retrieved.affected_entities == original.affected_entities

#     assert retrieved.insights == original.insights

#     assert retrieved.metadata == original.metadata


def test_database_save_and_retrieve():
    create_tables()

    original = create_test_payload()

    # Remove previous test data so the test is isolated.
    connection = get_connection()
    # connection.execute(
    #     "DELETE FROM analysis WHERE analysis_id = ?",
    #     (original.analysis.analysis_id,)
    # )
    connection.commit()
    connection.close()

    save_dashboard_payload(original)

    retrieved = get_dashboard_payload(
        original.analysis.analysis_id
    )

    assert retrieved is not None

    assert retrieved.schema_version == original.schema_version
    assert retrieved.system == original.system
    assert retrieved.analysis == original.analysis
    assert retrieved.summary == original.summary
    assert retrieved.event_statistics == original.event_statistics
    assert retrieved.trends == original.trends
    assert retrieved.anomalies == original.anomalies
    assert retrieved.affected_entities == original.affected_entities
    assert retrieved.insights == original.insights
    assert retrieved.metadata == original.metadata