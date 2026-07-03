"""
Moteur de génération de données simulées du festival.

Deux usages :

1. ``generate_festival()`` — les 4 jours "vitrine" du festival, DÉTERMINISTES
   (seed fixe), affichés dans le dashboard. Reproductibles pour la démo.

2. ``generate_history(n_days)`` — un CORPUS HISTORIQUE de N jours variés et
   bruités, utilisé pour ENTRAÎNER le modèle ML de prédiction. Chaque jour a
   ses propres facteurs météo/événementiel et son propre bruit, pour que le
   modèle apprenne une structure généralisable et non un jour mémorisé.

Le profil d'affluence suit une courbe en cloche (gaussienne) centrée en soirée.
La somme des affluences par scène est cohérente avec le total visiteurs
(le total affiché = somme des scènes, plafonnée aux capacités).
"""

import numpy as np
import pandas as pd

from .config import STAGES, STAGE_RATIOS

HOURS = list(range(10, 24))  # 10h → 23h inclus (14 heures)

# Paramètres du profil d'affluence (courbe en cloche)
_PEAK_HOUR = 18.0
_WIDTH = 4.5
_AMPLITUDE = 4200.0
_FLOOR = 600.0


def _base_flow(hour: float) -> float:
    """Flux de visiteurs de base pour une heure donnée (gaussienne en cloche)."""
    return _FLOOR + _AMPLITUDE * np.exp(-0.5 * ((hour - _PEAK_HOUR) / _WIDTH) ** 2)


def _split_stages(target_visitors: int, rng: np.random.Generator) -> dict:
    """
    Répartit les visiteurs entre les scènes (ratios + jitter), plafonne aux
    capacités. Retourne un dict {stage_id: attendance}.
    """
    attendance = {}
    for stage, ratio in zip(STAGES, STAGE_RATIOS):
        jitter = 0.85 + rng.random() * 0.30            # ±15 % autour du ratio
        raw = target_visitors * ratio * jitter
        attendance[stage["id"]] = int(min(stage["capacity"], max(0, round(raw))))
    return attendance


def _generate_day(day_index: int, weather_factor: float, event_factor: float,
                  seed: int, weather_label: str = "") -> list:
    """Génère les 14 lignes horaires d'une journée."""
    rng = np.random.default_rng(seed)
    rows = []
    for h in HOURS:
        base = _base_flow(h)
        noise = (rng.random() - 0.5) * 700
        target = max(200, round((base + noise) * weather_factor * event_factor))

        stages = _split_stages(target, rng)
        visitors = sum(stages.values())  # total cohérent avec la somme des scènes

        incidents = round((visitors / 2000) * (1 + rng.random()) * (1.5 if h >= 18 else 1.0))
        medical = round((visitors / 3000) * (1 + rng.random() * 0.5))
        noise_db = round((65 + visitors / 200 + (rng.random() - 0.5) * 10) * 10) / 10
        temperature = round((22 + 8 * np.sin((h - 6) * np.pi / 12) + (rng.random() - 0.5) * 3) * 10) / 10

        rows.append({
            "day": day_index + 1,
            "weather": weather_label,
            "weatherFactor": round(weather_factor, 3),
            "eventFactor": round(event_factor, 3),
            "hour": h,
            "label": f"{h}:00",
            "visitors": visitors,
            **stages,
            "incidents": int(incidents),
            "medicalCalls": int(medical),
            "noiseLevel": float(noise_db),
            "temperature": float(temperature),
        })
    return rows


# Configuration météo des 4 jours vitrine (déterministe)
_DAY_CONFIG = [
    {"weather": "Ensoleillé", "weatherFactor": 1.00, "eventFactor": 0.90},
    {"weather": "Nuageux",    "weatherFactor": 0.85, "eventFactor": 1.00},
    {"weather": "Beau temps", "weatherFactor": 1.10, "eventFactor": 1.15},
    {"weather": "Pluvieux",   "weatherFactor": 0.70, "eventFactor": 1.20},
]


def generate_festival() -> pd.DataFrame:
    """Génère les 4 jours vitrine du festival (déterministes)."""
    all_rows = []
    for d, cfg in enumerate(_DAY_CONFIG):
        all_rows.extend(_generate_day(
            d, cfg["weatherFactor"], cfg["eventFactor"],
            seed=1000 + d, weather_label=cfg["weather"],
        ))
    return pd.DataFrame(all_rows)


def generate_history(n_days: int = 60, seed: int = 7) -> pd.DataFrame:
    """
    Génère un corpus historique de ``n_days`` jours variés pour l'entraînement.
    Facteurs météo/événementiel tirés aléatoirement, bruit indépendant par jour.
    """
    master = np.random.default_rng(seed)
    all_rows = []
    for d in range(n_days):
        weather_factor = float(master.uniform(0.65, 1.15))
        event_factor = float(master.uniform(0.85, 1.25))
        rows = _generate_day(
            d, weather_factor, event_factor,
            seed=int(master.integers(0, 2**31 - 1)),
            weather_label="historique",
        )
        for r in rows:
            r["day"] = d + 1
        all_rows.extend(rows)
    return pd.DataFrame(all_rows)
