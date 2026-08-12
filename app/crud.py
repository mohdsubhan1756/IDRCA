from app.database import get_connection
from app.models import DashboardPayload


def save_dashboard_payload(payload: DashboardPayload):
    connection = get_connection()
    cursor = connection.cursor()

    try:
        analysis_id = payload.analysis.analysis_id

        # --------------------------------------------------
        # SYSTEM
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT OR REPLACE INTO system
            (system_id, name, type, source)
            VALUES (?, ?, ?, ?)
            """,
            (
                payload.system.id,
                payload.system.name,
                payload.system.type,
                payload.system.source,
            ),
        )

        # --------------------------------------------------
        # ANALYSIS
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT OR REPLACE INTO analysis
            (
                analysis_id,
                system_id,
                started_at,
                ended_at,
                total_events,
                unique_event_templates,
                status,
                health_score
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                payload.system.id,
                payload.analysis.started_at.isoformat(),
                payload.analysis.ended_at.isoformat(),
                payload.analysis.total_events,
                payload.analysis.unique_event_templates,
                payload.analysis.status,
                payload.analysis.health_score,
            ),
        )

        # --------------------------------------------------
        # SUMMARY
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT OR REPLACE INTO summary
            (
                analysis_id,
                normal_events,
                anomalous_events,
                anomaly_rate,
                critical_anomalies,
                high_anomalies,
                medium_anomalies,
                low_anomalies
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                payload.summary.normal_events,
                payload.summary.anomalous_events,
                payload.summary.anomaly_rate,
                payload.summary.critical_anomalies,
                payload.summary.high_anomalies,
                payload.summary.medium_anomalies,
                payload.summary.low_anomalies,
            ),
        )

        # --------------------------------------------------
        # EVENT STATISTICS
        # --------------------------------------------------

        for item in payload.event_statistics.severity_distribution:
            cursor.execute(
                """
                INSERT INTO event_statistics
                (analysis_id, level, count, percentage)
                VALUES (?, ?, ?, ?)
                """,
                (
                    analysis_id,
                    item.level,
                    item.count,
                    item.percentage,
                ),
            )

        # --------------------------------------------------
        # TOP EVENTS
        # --------------------------------------------------

        for item in payload.event_statistics.top_events:
            cursor.execute(
                """
                INSERT INTO top_events
                (
                    analysis_id,
                    event_id,
                    template,
                    count,
                    percentage
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    analysis_id,
                    item.event_id,
                    item.template,
                    item.count,
                    item.percentage,
                ),
            )

        # --------------------------------------------------
        # TRENDS
        # --------------------------------------------------

        for point in payload.trends.event_rate:
            cursor.execute(
                """
                INSERT INTO trends
                (analysis_id, trend_type, timestamp, value)
                VALUES (?, ?, ?, ?)
                """,
                (
                    analysis_id,
                    "event_rate",
                    point.timestamp.isoformat(),
                    point.value,
                ),
            )

        for point in payload.trends.anomaly_rate:
            cursor.execute(
                """
                INSERT INTO trends
                (analysis_id, trend_type, timestamp, value)
                VALUES (?, ?, ?, ?)
                """,
                (
                    analysis_id,
                    "anomaly_rate",
                    point.timestamp.isoformat(),
                    point.value,
                ),
            )

        # --------------------------------------------------
        # AFFECTED ENTITIES
        # --------------------------------------------------

        for entity in payload.affected_entities:
            cursor.execute(
                """
                INSERT OR REPLACE INTO affected_entities
                (
                    entity_id,
                    analysis_id,
                    type,
                    event_count,
                    anomaly_count,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    entity.id,
                    analysis_id,
                    entity.type,
                    entity.event_count,
                    entity.anomaly_count,
                    entity.status,
                ),
            )

        # --------------------------------------------------
        # ANOMALIES
        # --------------------------------------------------

        for anomaly in payload.anomalies:

            cursor.execute(
                """
                INSERT OR REPLACE INTO anomalies
                (
                    anomaly_id,
                    analysis_id,
                    severity,
                    type,
                    title,
                    description,
                    first_detected,
                    last_detected,
                    occurrences,
                    confidence
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    anomaly.id,
                    analysis_id,
                    anomaly.severity,
                    anomaly.type,
                    anomaly.title,
                    anomaly.description,
                    anomaly.first_detected.isoformat(),
                    anomaly.last_detected.isoformat(),
                    anomaly.occurrences,
                    anomaly.confidence,
                ),
            )

            # Evidence
            for evidence in anomaly.evidence:
                cursor.execute(
                    """
                    INSERT INTO evidence
                    (
                        anomaly_id,
                        metric,
                        value,
                        baseline,
                        unit
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        anomaly.id,
                        evidence.metric,
                        evidence.value,
                        evidence.baseline,
                        evidence.unit,
                    ),
                )

            # Possible causes
            for cause in anomaly.possible_causes:
                cursor.execute(
                    """
                    INSERT INTO possible_causes
                    (
                        anomaly_id,
                        cause,
                        confidence
                    )
                    VALUES (?, ?, ?)
                    """,
                    (
                        anomaly.id,
                        cause.cause,
                        cause.confidence,
                    ),
                )

            # Recommendations
            for recommendation in anomaly.recommendations:
                cursor.execute(
                    """
                    INSERT INTO recommendations
                    (
                        anomaly_id,
                        analysis_id,
                        priority,
                        action
                    )
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        anomaly.id,
                        None,
                        recommendation.priority,
                        recommendation.action,
                    ),
                )

            # Connect anomaly ↔ entities
            for entity_id in anomaly.affected_entities:
                cursor.execute(
                    """
                    INSERT OR IGNORE INTO anomaly_entities
                    (anomaly_id, entity_id)
                    VALUES (?, ?)
                    """,
                    (
                        anomaly.id,
                        entity_id,
                    ),
                )

        # --------------------------------------------------
        # INSIGHTS
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT OR REPLACE INTO insights
            (analysis_id, summary)
            VALUES (?, ?)
            """,
            (
                analysis_id,
                payload.insights.summary,
            ),
        )

        # Root cause hypotheses
        for hypothesis in payload.insights.root_cause_hypotheses:
            cursor.execute(
                """
                INSERT INTO root_cause_hypotheses
                (
                    analysis_id,
                    description,
                    confidence
                )
                VALUES (?, ?, ?)
                """,
                (
                    analysis_id,
                    hypothesis.description,
                    hypothesis.confidence,
                ),
            )

        # Insight recommendations
        for recommendation in payload.insights.recommendations:
            cursor.execute(
                """
                INSERT INTO recommendations
                (
                    anomaly_id,
                    analysis_id,
                    priority,
                    action
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    None,
                    analysis_id,
                    recommendation.priority,
                    recommendation.action,
                ),
            )

        # --------------------------------------------------
        # METADATA
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT OR REPLACE INTO metadata
            (
                analysis_id,
                parser_name,
                parser_version,
                embedding_enabled,
                embedding_model,
                retrieval_enabled,
                retrieval_method,
                llm_enabled,
                llm_provider,
                llm_model,
                ground_truth_available,
                ground_truth_source
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                analysis_id,
                payload.metadata.parser.name,
                payload.metadata.parser.version,
                int(payload.metadata.embedding.enabled),
                payload.metadata.embedding.model,
                int(payload.metadata.retrieval.enabled),
                payload.metadata.retrieval.method,
                int(payload.metadata.llm.enabled),
                payload.metadata.llm.provider,
                payload.metadata.llm.model,
                int(payload.metadata.ground_truth.available),
                payload.metadata.ground_truth.source,
            ),
        )

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()



def get_dashboard_payload(analysis_id: str):
    connection = get_connection()

    try:
        # -------------------------
        # ANALYSIS
        # -------------------------
        analysis = connection.execute(
            """
            SELECT *
            FROM analysis
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchone()

        if analysis is None:
            return None

        # -------------------------
        # SYSTEM
        # -------------------------
        system = connection.execute(
            """
            SELECT *
            FROM system
            WHERE system_id = ?
            """,
            (analysis["system_id"],),
        ).fetchone()

        # -------------------------
        # SUMMARY
        # -------------------------
        summary = connection.execute(
            """
            SELECT *
            FROM summary
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchone()

        # -------------------------
        # EVENT STATISTICS
        # -------------------------
        severity_distribution = connection.execute(
            """
            SELECT level, count, percentage
            FROM event_statistics
            WHERE analysis_id = ?
            ORDER BY id
            """,
            (analysis_id,),
        ).fetchall()

        top_events = connection.execute(
            """
            SELECT event_id, template, count, percentage
            FROM top_events
            WHERE analysis_id = ?
            ORDER BY id
            """,
            (analysis_id,),
        ).fetchall()

        # -------------------------
        # TRENDS
        # -------------------------
        event_rate_rows = connection.execute(
            """
            SELECT timestamp, value
            FROM trends
            WHERE analysis_id = ?
              AND trend_type = 'event_rate'
            ORDER BY timestamp
            """,
            (analysis_id,),
        ).fetchall()

        anomaly_rate_rows = connection.execute(
            """
            SELECT timestamp, value
            FROM trends
            WHERE analysis_id = ?
              AND trend_type = 'anomaly_rate'
            ORDER BY timestamp
            """,
            (analysis_id,),
        ).fetchall()

        # -------------------------
        # AFFECTED ENTITIES
        # -------------------------
        entity_rows = connection.execute(
            """
            SELECT entity_id, type, event_count, anomaly_count, status
            FROM affected_entities
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchall()

        # -------------------------
        # ANOMALIES
        # -------------------------
        anomaly_rows = connection.execute(
            """
            SELECT *
            FROM anomalies
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchall()

        anomalies = []

        for anomaly in anomaly_rows:

            evidence_rows = connection.execute(
                """
                SELECT metric, value, baseline, unit
                FROM evidence
                WHERE anomaly_id = ?
                ORDER BY id
                """,
                (anomaly["anomaly_id"],),
            ).fetchall()

            cause_rows = connection.execute(
                """
                SELECT cause, confidence
                FROM possible_causes
                WHERE anomaly_id = ?
                ORDER BY id
                """,
                (anomaly["anomaly_id"],),
            ).fetchall()

            recommendation_rows = connection.execute(
                """
                SELECT priority, action
                FROM recommendations
                WHERE anomaly_id = ?
                ORDER BY id
                """,
                (anomaly["anomaly_id"],),
            ).fetchall()

            entity_rows_for_anomaly = connection.execute(
                """
                SELECT entity_id
                FROM anomaly_entities
                WHERE anomaly_id = ?
                """,
                (anomaly["anomaly_id"],),
            ).fetchall()

            anomalies.append(
                {
                    "id": anomaly["anomaly_id"],
                    "severity": anomaly["severity"],
                    "type": anomaly["type"],
                    "title": anomaly["title"],
                    "description": anomaly["description"],
                    "first_detected": anomaly["first_detected"],
                    "last_detected": anomaly["last_detected"],
                    "occurrences": anomaly["occurrences"],
                    "affected_entities": [
                        row["entity_id"]
                        for row in entity_rows_for_anomaly
                    ],
                    "evidence": [
                        {
                            "metric": row["metric"],
                            "value": row["value"],
                            "baseline": row["baseline"],
                            "unit": row["unit"],
                        }
                        for row in evidence_rows
                    ],
                    "possible_causes": [
                        {
                            "cause": row["cause"],
                            "confidence": row["confidence"],
                        }
                        for row in cause_rows
                    ],
                    "recommendations": [
                        {
                            "priority": row["priority"],
                            "action": row["action"],
                        }
                        for row in recommendation_rows
                    ],
                    "confidence": anomaly["confidence"],
                }
            )

        # -------------------------
        # INSIGHTS
        # -------------------------
        insights = connection.execute(
            """
            SELECT summary
            FROM insights
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchone()

        hypotheses = connection.execute(
            """
            SELECT description, confidence
            FROM root_cause_hypotheses
            WHERE analysis_id = ?
            ORDER BY id
            """,
            (analysis_id,),
        ).fetchall()

        insight_recommendations = connection.execute(
            """
            SELECT priority, action
            FROM recommendations
            WHERE analysis_id = ?
              AND anomaly_id IS NULL
            ORDER BY id
            """,
            (analysis_id,),
        ).fetchall()

        # -------------------------
        # METADATA
        # -------------------------
        metadata = connection.execute(
            """
            SELECT *
            FROM metadata
            WHERE analysis_id = ?
            """,
            (analysis_id,),
        ).fetchone()

        # -------------------------
        # BUILD DASHBOARD PAYLOAD
        # -------------------------
        payload = {
            "schema_version": "1.0",

            "system": {
                "id": system["system_id"],
                "name": system["name"],
                "type": system["type"],
                "source": system["source"],
            },

            "analysis": {
                "analysis_id": analysis["analysis_id"],
                "started_at": analysis["started_at"],
                "ended_at": analysis["ended_at"],
                "total_events": analysis["total_events"],
                "unique_event_templates": analysis["unique_event_templates"],
                "status": analysis["status"],
                "health_score": analysis["health_score"],
            },

            "summary": {
                "normal_events": summary["normal_events"],
                "anomalous_events": summary["anomalous_events"],
                "anomaly_rate": summary["anomaly_rate"],
                "critical_anomalies": summary["critical_anomalies"],
                "high_anomalies": summary["high_anomalies"],
                "medium_anomalies": summary["medium_anomalies"],
                "low_anomalies": summary["low_anomalies"],
            },

            "event_statistics": {
                "severity_distribution": [
                    {
                        "level": row["level"],
                        "count": row["count"],
                        "percentage": row["percentage"],
                    }
                    for row in severity_distribution
                ],
                "top_events": [
                    {
                        "event_id": row["event_id"],
                        "template": row["template"],
                        "count": row["count"],
                        "percentage": row["percentage"],
                    }
                    for row in top_events
                ],
            },

            "trends": {
                "event_rate": [
                    {
                        "timestamp": row["timestamp"],
                        "value": row["value"],
                    }
                    for row in event_rate_rows
                ],
                "anomaly_rate": [
                    {
                        "timestamp": row["timestamp"],
                        "value": row["value"],
                    }
                    for row in anomaly_rate_rows
                ],
            },

            "anomalies": anomalies,

            "affected_entities": [
                {
                    "id": row["entity_id"],
                    "type": row["type"],
                    "event_count": row["event_count"],
                    "anomaly_count": row["anomaly_count"],
                    "status": row["status"],
                }
                for row in entity_rows
            ],

            "insights": {
                "summary": insights["summary"],
                "root_cause_hypotheses": [
                    {
                        "description": row["description"],
                        "confidence": row["confidence"],
                    }
                    for row in hypotheses
                ],
                "recommendations": [
                    {
                        "priority": row["priority"],
                        "action": row["action"],
                    }
                    for row in insight_recommendations
                ],
            },

            "metadata": {
                "parser": {
                    "name": metadata["parser_name"],
                    "version": metadata["parser_version"],
                },
                "embedding": {
                    "enabled": bool(metadata["embedding_enabled"]),
                    "model": metadata["embedding_model"],
                },
                "retrieval": {
                    "enabled": bool(metadata["retrieval_enabled"]),
                    "method": metadata["retrieval_method"],
                },
                "llm": {
                    "enabled": bool(metadata["llm_enabled"]),
                    "provider": metadata["llm_provider"],
                    "model": metadata["llm_model"],
                },
                "ground_truth": {
                    "available": bool(metadata["ground_truth_available"]),
                    "source": metadata["ground_truth_source"],
                },
            },
        }

        # Validate reconstructed data using your existing model.
        from app.models import DashboardPayload

        return DashboardPayload.model_validate(payload)

    finally:
        connection.close()