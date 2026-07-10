"""
Allocation des ressources — port du module JS.

Calcule, pour une heure donnée, les besoins par scène (agents de sécurité,
équipes médicales, points d'eau, sanitaires) selon des ratios normés, puis
compare aux ressources disponibles et calcule un score de couverture global.

Format de sortie identique à la version JS (consommé tel quel par le frontend).
"""

import math
import pandas as pd

from ..data.config import STAGES, TEAM_BY_ID, RESOURCE_BY_ID

ALLOCATION_RATIOS = {"security": 150, "medical": 500, "water": 100, "toilets": 75}
PRIORITY_THRESHOLDS = {"high": 0.80, "medium": 0.50}


def _priority(occupancy: float) -> str:
    if occupancy > PRIORITY_THRESHOLDS["high"]:
        return "high"
    if occupancy > PRIORITY_THRESHOLDS["medium"]:
        return "medium"
    return "low"


def _status(needed: int, available: int) -> str:
    return "ok" if needed <= available else "deficit"


def optimize_resources(hourly: pd.DataFrame, current_hour: int) -> dict:
    """Calcule l'allocation des ressources pour ``current_hour``."""
    match = hourly[hourly["hour"] == current_hour]
    current = match.iloc[0] if len(match) else hourly.iloc[-1]

    stage_allocations = {}
    for stage in STAGES:
        visitors = int(current[stage["id"]])
        occupancy = visitors / stage["capacity"]
        stage_allocations[stage["id"]] = {
            "occupancy": round(occupancy * 100),
            "security": math.ceil(visitors / ALLOCATION_RATIOS["security"]),
            "medical":  math.ceil(visitors / ALLOCATION_RATIOS["medical"]),
            "water":    math.ceil(visitors / ALLOCATION_RATIOS["water"]),
            "toilets":  math.ceil(visitors / ALLOCATION_RATIOS["toilets"]),
            "priority": _priority(occupancy),
        }

    allocs = list(stage_allocations.values())
    total_security = sum(a["security"] for a in allocs)
    total_medical = sum(a["medical"] for a in allocs)
    total_water = sum(a["water"] for a in allocs)
    total_toilets = sum(a["toilets"] for a in allocs)

    security_avail = TEAM_BY_ID["security"]["members"]
    medical_avail = TEAM_BY_ID["medical"]["members"]
    water_avail = RESOURCE_BY_ID["water"]["total"]
    toilets_avail = RESOURCE_BY_ID["toilets"]["total"]

    summary = {
        "security": {"needed": total_security, "available": security_avail,
                     "status": _status(total_security, security_avail)},
        "medical":  {"needed": total_medical, "available": medical_avail,
                     "status": _status(total_medical, medical_avail)},
        "water":    {"needed": total_water, "available": water_avail,
                     "status": _status(total_water, water_avail)},
        "toilets":  {"needed": total_toilets, "available": toilets_avail,
                     "status": _status(total_toilets, toilets_avail)},
    }

    sec_cov = 1 if total_security <= security_avail else security_avail / total_security
    med_cov = 1 if total_medical <= medical_avail else medical_avail / total_medical
    score = round((sec_cov + med_cov) / 2 * 100)

    return {"stageAllocations": stage_allocations, "summary": summary, "score": score}
