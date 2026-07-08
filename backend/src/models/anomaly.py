"""
Détection d'anomalies — hybride règles + apprentissage automatique.

Deux détecteurs complémentaires :

1. RÈGLES À SEUILS (interprétables) — port de la version JS. Cinq types :
   surcharge, incidents, bruit, afflux, médical. Chaque alerte est explicable
   (« occupation > 85 % »), ce qui est essentiel en contexte sécurité.

2. ISOLATION FOREST (ML non supervisé) — entraîné sur le corpus historique.
   Détecte les combinaisons multivariées atypiques qu'aucune règle simple ne
   capture (ex. affluence moyenne mais bruit + incidents + médical élevés
   simultanément). Quand la forêt isole une heure qu'aucune règle n'a signalée,
   on attribue l'anomalie à la variable la plus déviante (z-score) pour rester
   lisible et compatible avec la catégorisation en 5 types.

Les deux détecteurs renvoient le même format d'anomalie, consommé tel quel par
le frontend.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from ..data.config import STAGES
from ..data.generator import generate_history

STAGE_IDS = [s["id"] for s in STAGES]

# ─── Seuils des règles ───────────────────────────────────────────

DEFAULT_THRESHOLDS = {
    "overcrowding": {"warning": 0.85, "critical": 0.95},
    "incidents":    {"warning": 5,    "critical": 8},
    "noise":        {"warning": 85,   "critical": 90},
    "spike":        {"warning": 0.4,  "critical": 0.6},
    "medical":      {"warning": 3,    "critical": 5},
}

# Variables utilisées par IsolationForest et le z-score d'attribution
ML_FEATURES = ["visitors", "incidents", "medicalCalls", "noiseLevel", "max_occupancy"]

# Variable déviante → (type, localisation)
_FEATURE_TO_TYPE = {
    "visitors":     ("spike", "Entrées"),
    "incidents":    ("incidents", "Général"),
    "medicalCalls": ("medical", "Médical"),
    "noiseLevel":   ("noise", "Périmètre"),
    "max_occupancy":("overcrowding", "Scènes"),
}


# ─── Règles à seuils ─────────────────────────────────────────────

def _rule_anomalies(row: pd.Series, prev: pd.Series | None, th: dict) -> list:
    out = []

    # Surcharge par scène
    for stage in STAGES:
        occ = row[stage["id"]] / stage["capacity"]
        t = th["overcrowding"]
        if occ > t["warning"]:
            out.append({
                "hour": int(row["hour"]), "type": "overcrowding",
                "severity": "critical" if occ > t["critical"] else "warning",
                "location": stage["name"],
                "value": f"{round(occ * 100)}% capacité",
                "message": f"Surcharge {stage['name']}: {int(row[stage['id']])}/{stage['capacity']}",
            })

    # Incidents
    t = th["incidents"]
    if row["incidents"] > t["warning"]:
        out.append({
            "hour": int(row["hour"]), "type": "incidents",
            "severity": "critical" if row["incidents"] > t["critical"] else "warning",
            "location": "Général", "value": f"{int(row['incidents'])} incidents",
            "message": f"Pic d'incidents à {row['label']}",
        })

    # Bruit
    t = th["noise"]
    if row["noiseLevel"] > t["warning"]:
        out.append({
            "hour": int(row["hour"]), "type": "noise",
            "severity": "critical" if row["noiseLevel"] > t["critical"] else "warning",
            "location": "Périmètre", "value": f"{row['noiseLevel']} dB",
            "message": f"Niveau sonore excessif: {row['noiseLevel']} dB",
        })

    # Afflux soudain
    if prev is not None:
        t = th["spike"]
        spike = (row["visitors"] - prev["visitors"]) / max(1, prev["visitors"])
        if spike > t["warning"]:
            out.append({
                "hour": int(row["hour"]), "type": "spike",
                "severity": "critical" if spike > t["critical"] else "warning",
                "location": "Entrées", "value": f"+{round(spike * 100)}%",
                "message": f"Afflux soudain: +{round(spike * 100)}% en 1h",
            })

    # Médical
    t = th["medical"]
    if row["medicalCalls"] > t["warning"]:
        out.append({
            "hour": int(row["hour"]), "type": "medical",
            "severity": "critical" if row["medicalCalls"] > t["critical"] else "warning",
            "location": "Médical", "value": f"{int(row['medicalCalls'])} appels",
            "message": f"Appels médicaux élevés: {int(row['medicalCalls'])}",
        })

    return out


# ─── IsolationForest ─────────────────────────────────────────────

def _max_occupancy(df: pd.DataFrame) -> pd.Series:
    """Taux d'occupation maximal parmi les scènes, par ligne."""
    occ = pd.DataFrame({s["id"]: df[s["id"]] / s["capacity"] for s in STAGES})
    return occ.max(axis=1)


class AnomalyModel:
    def __init__(self):
        self.forest = None
        self.mean = None
        self.std = None
        self._trained = False

    def train(self, n_history_days: int = 60, seed: int = 11):
        hist = generate_history(n_days=n_history_days, seed=seed).copy()
        hist["max_occupancy"] = _max_occupancy(hist)
        X = hist[ML_FEATURES]
        self.mean = X.mean()
        self.std = X.std().replace(0, 1)
        self.forest = IsolationForest(
            n_estimators=150, contamination=0.08, random_state=42
        ).fit(X)
        self._trained = True
        return self

    def ml_anomalies(self, df: pd.DataFrame, covered_hours: set) -> list:
        """Anomalies détectées par la forêt et non déjà couvertes par une règle."""
        if not self._trained or df.empty:
            return []
        d = df.copy()
        d["max_occupancy"] = _max_occupancy(d)
        X = d[ML_FEATURES]
        flags = self.forest.predict(X)          # -1 = outlier
        scores = self.forest.score_samples(X)   # plus bas = plus anormal
        z = (X - self.mean) / self.std          # z-scores pour l'attribution

        out = []
        for i in range(len(d)):
            if flags[i] != -1:
                continue
            hour = int(d["hour"].iloc[i])
            if hour in covered_hours:
                continue  # déjà signalé par une règle
            dominant = z.iloc[i].abs().idxmax()
            atype, location = _FEATURE_TO_TYPE[dominant]
            severity = "critical" if scores[i] < np.quantile(scores, 0.15) else "warning"
            out.append({
                "hour": hour, "type": atype, "severity": severity,
                "location": location,
                "value": f"score ML {scores[i]:.2f}",
                "message": f"Anomalie multivariée détectée par ML (variable dominante : {dominant})",
            })
        return out


_MODEL = None


def get_model() -> AnomalyModel:
    global _MODEL
    if _MODEL is None:
        _MODEL = AnomalyModel().train()
    return _MODEL


# ─── API principale ──────────────────────────────────────────────

def detect_anomalies(hourly: pd.DataFrame, thresholds: dict | None = None) -> list:
    """
    Analyse les heures fournies et retourne toutes les anomalies (règles + ML).
    ``hourly`` : DataFrame des heures observées.
    """
    th = {**DEFAULT_THRESHOLDS, **(thresholds or {})}
    d = hourly.sort_values("hour").reset_index(drop=True)

    rule_out = []
    for i in range(len(d)):
        prev = d.iloc[i - 1] if i > 0 else None
        rule_out.extend(_rule_anomalies(d.iloc[i], prev, th))

    covered = {a["hour"] for a in rule_out}
    ml_out = get_model().ml_anomalies(d, covered)

    return sorted(rule_out + ml_out, key=lambda a: a["hour"])
