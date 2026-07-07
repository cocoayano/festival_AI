"""
Module de prédiction d'affluence — VRAI apprentissage automatique.

Contrairement à la version JS (extrapolation tendance+momentum, non entraînée),
ce module entraîne des modèles supervisés scikit-learn sur un corpus historique.

Approche
--------
Problème posé comme une RÉGRESSION supervisée : prédire ``visitors`` à l'heure t
à partir de variables construites (feature engineering) :

    - encodage cyclique de l'heure (sin/cos)
    - contexte du jour : weatherFactor, eventFactor
    - retards (lags) : visiteurs à t-1 et t-2
    - moyenne glissante sur 3 heures
    - variation instantanée (delta t-1)

Modèles
-------
Trois ``GradientBoostingRegressor`` en régression quantile :
    - quantile 0.5  → prévision ponctuelle (médiane)
    - quantile 0.1  → borne basse de l'intervalle
    - quantile 0.9  → borne haute de l'intervalle
L'intervalle [q0.1, q0.9] est un VRAI intervalle de prédiction à 80 %, appris sur
les données, et non une marge codée en dur.

Évaluation
----------
Découpage train/test par jours (hold-out), puis MAE et RMSE comparés à deux
baselines (persistance = « demain comme aujourd'hui », et moyenne). Ces métriques
sont exposées à l'API (onglet Prédiction / soutenance).

Prévision multi-pas
-------------------
Pour prédire H+1..H+3, on procède de façon récursive : la prévision de H+1 est
réinjectée comme lag pour H+2, etc. L'incertitude s'accroît donc avec l'horizon.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

from ..data.generator import generate_history, HOURS

FEATURES = ["hour_sin", "hour_cos", "weatherFactor", "eventFactor",
            "lag1", "lag2", "roll3", "delta1"]

MIN_OBSERVATIONS = 3   # nb d'heures observées nécessaires avant de prédire
MAX_HORIZON = 3        # horizon max de prévision (heures)


# ─── Construction des variables ──────────────────────────────────

def _build_features(day_hours: pd.DataFrame) -> pd.DataFrame:
    """
    Construit les variables pour une journée (DataFrame trié par heure).
    Les premières lignes (sans lag disponible) sont retirées.
    """
    d = day_hours.sort_values("hour").reset_index(drop=True).copy()
    d["hour_sin"] = np.sin(2 * np.pi * d["hour"] / 24)
    d["hour_cos"] = np.cos(2 * np.pi * d["hour"] / 24)
    d["lag1"] = d["visitors"].shift(1)
    d["lag2"] = d["visitors"].shift(2)
    d["roll3"] = d["visitors"].shift(1).rolling(3, min_periods=1).mean()
    d["delta1"] = d["lag1"] - d["lag2"]
    return d.dropna(subset=["lag1", "lag2"]).reset_index(drop=True)


def _assemble_training_set(history: pd.DataFrame):
    """Empile les variables de tous les jours du corpus historique."""
    frames = [_build_features(g) for _, g in history.groupby("day")]
    full = pd.concat(frames, ignore_index=True)
    return full[FEATURES], full["visitors"]


# ─── Entraînement ────────────────────────────────────────────────

class AttendanceModel:
    """Encapsule les 3 modèles quantiles entraînés et les métriques de test."""

    def __init__(self):
        self.models = {}
        self.metrics = {}
        self._trained = False

    def train(self, n_history_days: int = 60, test_days: int = 12, seed: int = 7):
        history = generate_history(n_days=n_history_days, seed=seed)

        days = sorted(history["day"].unique())
        train_days = set(days[:-test_days])
        test_days_set = set(days[-test_days:])

        train_df = history[history["day"].isin(train_days)]
        test_df = history[history["day"].isin(test_days_set)]

        X_train, y_train = _assemble_training_set(train_df)
        X_test, y_test = _assemble_training_set(test_df)

        # 3 modèles quantiles
        for q, name in [(0.1, "lower"), (0.5, "median"), (0.9, "upper")]:
            m = GradientBoostingRegressor(
                loss="quantile", alpha=q,
                n_estimators=200, max_depth=3,
                learning_rate=0.05, subsample=0.9, random_state=42,
            )
            m.fit(X_train, y_train)
            self.models[name] = m

        # ── Évaluation du modèle médian vs baselines ──
        y_pred = self.models["median"].predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))

        # Baseline 1 : persistance (prédire lag1)
        base_persist = X_test["lag1"].values
        mae_persist = mean_absolute_error(y_test, base_persist)
        rmse_persist = float(np.sqrt(mean_squared_error(y_test, base_persist)))

        # Baseline 2 : moyenne du train
        mean_val = float(y_train.mean())
        mae_mean = mean_absolute_error(y_test, np.full_like(y_test, mean_val, dtype=float))

        self.metrics = {
            "model": "GradientBoostingRegressor (quantile)",
            "features": FEATURES,
            "n_train": int(len(X_train)),
            "n_test": int(len(X_test)),
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "baseline_persistence_mae": round(mae_persist, 1),
            "baseline_persistence_rmse": round(rmse_persist, 1),
            "baseline_mean_mae": round(mae_mean, 1),
            "improvement_vs_persistence_pct": round((mae_persist - mae) / mae_persist * 100, 1),
        }
        self._trained = True
        return self

    # ── Prévision récursive multi-pas ────────────────────────────

    def predict(self, observed: pd.DataFrame, horizon: int = MAX_HORIZON) -> list:
        """
        Prévoit les ``horizon`` prochaines heures à partir des heures observées.

        ``observed`` : DataFrame des heures déjà écoulées de la journée courante
        (colonnes visitors, hour, weatherFactor, eventFactor).
        """
        if not self._trained:
            raise RuntimeError("Modèle non entraîné")

        obs = observed.sort_values("hour").reset_index(drop=True)
        if len(obs) < MIN_OBSERVATIONS:
            return []

        series = obs["visitors"].astype(float).tolist()
        last_hour = int(obs["hour"].iloc[-1])
        weather = float(obs["weatherFactor"].iloc[-1])
        event = float(obs["eventFactor"].iloc[-1])

        predictions = []
        for step in range(1, horizon + 1):
            target_hour = last_hour + step
            if target_hour > HOURS[-1]:
                break

            lag1 = series[-1]
            lag2 = series[-2]
            roll3 = float(np.mean(series[-3:]))
            feat = pd.DataFrame([{
                "hour_sin": np.sin(2 * np.pi * target_hour / 24),
                "hour_cos": np.cos(2 * np.pi * target_hour / 24),
                "weatherFactor": weather,
                "eventFactor": event,
                "lag1": lag1, "lag2": lag2,
                "roll3": roll3, "delta1": lag1 - lag2,
            }])[FEATURES]

            median = float(self.models["median"].predict(feat)[0])
            lower = float(self.models["lower"].predict(feat)[0])
            upper = float(self.models["upper"].predict(feat)[0])

            # Élargissement léger de l'intervalle avec l'horizon (incertitude récursive)
            widen = 1 + 0.08 * (step - 1)
            center = median
            lower = center - (center - lower) * widen
            upper = center + (upper - center) * widen

            median = max(200, round(median))
            lower = max(200, round(min(lower, median)))
            upper = round(max(upper, median))

            # Confiance dérivée de la largeur relative de l'intervalle (bornée 50–95 %)
            rel_width = (upper - lower) / max(1, median)
            confidence = int(np.clip(round(100 * (1 - rel_width)), 50, 95))

            predictions.append({
                "hour": target_hour,
                "label": f"{target_hour}:00",
                "predicted": median,
                "lower": lower,
                "upper": upper,
                "confidence": confidence,
            })

            series.append(float(median))  # réinjection pour le pas suivant

        return predictions


# ─── Singleton entraîné une seule fois ───────────────────────────

_MODEL = None


def get_model() -> AttendanceModel:
    """Retourne le modèle (l'entraîne au premier appel)."""
    global _MODEL
    if _MODEL is None:
        _MODEL = AttendanceModel().train()
    return _MODEL


def predict_attendance(observed: pd.DataFrame, horizon: int = MAX_HORIZON) -> list:
    """API simple : prévoit l'affluence à partir des heures observées."""
    return get_model().predict(observed, horizon)


def model_metrics() -> dict:
    """Retourne les métriques d'évaluation du modèle."""
    return get_model().metrics
