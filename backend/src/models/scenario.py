"""
Évaluation de scénarios what-if — port du module JS.

Applique des modifications (multiplicateur de capacité, météo, scène en plus,
horaires étendus, sécurité renforcée) aux données d'une journée, puis calcule
un score composite multicritère : sécurité (40 %), ressources (30 %), coût (30 %).

Réutilise les modules d'anomalie et d'allocation. Format de sortie identique
à la version JS.
"""

import pandas as pd

from .anomaly import detect_anomalies
from .resources import optimize_resources

WEIGHTS = {"safety": 0.4, "resources": 0.3, "cost": 0.3}
COST_FACTORS = {"extraStage": 1.20, "extendedHours": 1.15, "extraSecurity": 1.10}

DEFAULT_SCENARIO = {
    "capacityMultiplier": 1.0,
    "weatherImpact": 1.0,
    "extraStage": False,
    "extendedHours": False,
    "extraSecurity": False,
}


def _apply_scenario(base: pd.DataFrame, sc: dict) -> pd.DataFrame:
    d = base.sort_values("hour").reset_index(drop=True).copy()
    d["original"] = d["visitors"]
    v = d["visitors"].astype(float)
    v = v * sc.get("capacityMultiplier", 1)
    v = v * sc.get("weatherImpact", 1)
    if sc.get("extraStage"):
        v = v * 1.15
    if sc.get("extendedHours"):
        v = v.where(d["hour"] < 22, v * 1.3)
    d["visitors"] = v.round().astype(int)
    return d


def _cost_factor(sc: dict) -> float:
    f = 1.0
    if sc.get("extraStage"):
        f *= COST_FACTORS["extraStage"]
    if sc.get("extendedHours"):
        f *= COST_FACTORS["extendedHours"]
    if sc.get("extraSecurity"):
        f *= COST_FACTORS["extraSecurity"]
    return f


def evaluate_scenario(base: pd.DataFrame, scenario: dict) -> dict:
    sc = {**DEFAULT_SCENARIO, **(scenario or {})}
    modified = _apply_scenario(base, sc)

    peak = int(modified["visitors"].max())
    total = int(modified["visitors"].sum())

    anomalies = detect_anomalies(modified)
    criticals = sum(1 for a in anomalies if a["severity"] == "critical")
    anomaly_count = len(anomalies)

    safety_score = max(0, 100 - criticals * 15 - anomaly_count * 3)

    mid_hour = int(modified["hour"].iloc[len(modified) // 2])
    resource_score = optimize_resources(modified, mid_hour)["score"]

    cost_factor = _cost_factor(sc)
    cost_percent = round(cost_factor * 100)

    overall = round(
        safety_score * WEIGHTS["safety"]
        + resource_score * WEIGHTS["resources"]
        + (100 / cost_factor) * WEIGHTS["cost"]
    )

    # ``modified`` renvoyé en liste de dicts (visitors + original) pour le graphe
    modified_records = modified[["hour", "label", "visitors", "original"]].to_dict("records")

    return {
        "modified": modified_records,
        "peakVisitors": peak,
        "totalVisitors": total,
        "anomalies": anomaly_count,
        "criticals": criticals,
        "safetyScore": safety_score,
        "resourceScore": resource_score,
        "costFactor": cost_percent,
        "overallScore": overall,
    }
