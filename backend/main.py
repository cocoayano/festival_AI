"""
FestivalAI — API backend (FastAPI).

Expose la logique Python (dont le modèle ML de prédiction) au frontend React.
Les formats de réponse reproduisent exactement ceux des anciens modules JS,
afin que les composants du frontend restent inchangés.

Endpoints
---------
GET  /api/festival              → les 4 jours vitrine (données horaires)
GET  /api/analysis?day=&hour=   → {predictions, anomalies, resources} à cet instant
POST /api/scenario              → évaluation d'un scénario what-if
GET  /api/metrics               → métriques d'évaluation du modèle ML
GET  /api/health                → état du service

Lancement : uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.data.generator import generate_festival
from src.data.config import STAGES, TEAMS, RESOURCES
from src.models.prediction import predict_attendance, model_metrics, get_model
from src.models.anomaly import detect_anomalies, get_model as get_anomaly_model
from src.models.resources import optimize_resources
from src.models.scenario import evaluate_scenario

app = FastAPI(title="FestivalAI API", version="2.0.0")

# CORS ouvert (dev). Le frontend Vite passe aussi par un proxy /api → 8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Données vitrine (générées une seule fois) ───────────────────
FESTIVAL = generate_festival()
_WEATHER_COLS = ["hour", "label", "visitors", *[s["id"] for s in STAGES],
                 "incidents", "medicalCalls", "noiseLevel", "temperature"]


def _festival_json():
    """Transforme le DataFrame en structure jour → heures attendue par le front."""
    days = []
    for day_num, g in FESTIVAL.groupby("day"):
        g = g.sort_values("hour")
        first = g.iloc[0]
        days.append({
            "day": int(day_num),
            "label": f"Jour {int(day_num)}",
            "weather": first["weather"],
            "weatherFactor": float(first["weatherFactor"]),
            "eventFactor": float(first["eventFactor"]),
            "hours": g[_WEATHER_COLS].to_dict("records"),
        })
    return days


@app.on_event("startup")
def _warmup():
    """Entraîne les modèles au démarrage pour que la 1re requête soit rapide."""
    get_model()          # modèle de prédiction ML
    get_anomaly_model()  # IsolationForest


@app.get("/api/health")
def health():
    return {"status": "ok", "days": int(FESTIVAL["day"].nunique())}


@app.get("/api/config")
def config():
    return {"stages": STAGES, "teams": TEAMS, "resources": RESOURCES}


@app.get("/api/festival")
def festival():
    return _festival_json()


@app.get("/api/metrics")
def metrics():
    return model_metrics()


@app.get("/api/analysis")
def analysis(day: int = Query(0, ge=0, le=3), hour: int = Query(16, ge=10, le=23)):
    """Prédictions + anomalies (jusqu'à l'heure) et ressources (à l'heure)."""
    day_df = FESTIVAL[FESTIVAL["day"] == day + 1].sort_values("hour")
    visible = day_df[day_df["hour"] <= hour]

    predictions = predict_attendance(visible)
    anomalies = detect_anomalies(visible)
    resources = optimize_resources(day_df, hour)

    return {"predictions": predictions, "anomalies": anomalies, "resources": resources}


class ScenarioRequest(BaseModel):
    day: int = 0
    scenario: dict = {}


@app.post("/api/scenario")
def scenario(req: ScenarioRequest):
    day_df = FESTIVAL[FESTIVAL["day"] == req.day + 1].sort_values("hour")
    return evaluate_scenario(day_df, req.scenario)
