# FestivalAI - Système Intelligent de Gestion de Festival Musical
Le dashboard React affiche les données et tout le backend avec la simulation, les prédictions, la détection d'anomalies, les allocation des ressources et les scénarios est fait via une API REST (FastAPI).

## Architecture
```
FestivalAI/
├── backend/                     # Python
│   ├── main.py                  # API FastAPI (endpoints)
│   ├── requirements.txt
│   └── src/
│       ├── data/
│       │   ├── config.py        # scènes, équipes, ressources
│       │   └── generator.py     # données + corpus d'entraînement
│       └── models/
│           ├── prediction.py    # prédiction (Gradient Boosting quantile)
│           ├── anomaly.py       # règles à seuils + IsolationForest
│           ├── resources.py     # allocation des ressources
│           └── scenario.py      # évaluation de scénarios
│
└── frontend/                    # JavaScript - React + Vite
    ├── package.json
    ├── vite.config.js           # proxy /api → backend:8000
    └── src/
        ├── api.js               # client API (fetch)
        ├── App.jsx              # orchestration + état global
        ├── components/          # onglets + composants UI
        ├── data/                # constantes d'affichage (scène, etc…)
        └── utils/colors.js
```

## Lancement

Prérequis : **Python 3.10+** et **Node.js 18+**.

### 1. Backend (terminal 1)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optionnel mais recommandé
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Le premier démarrage entraîne les modèles (quelques secondes). L'API écoute sur
`http://localhost:8000`.

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Ouvrir **http://localhost:5173**. Le proxy Vite redirige `/api` vers le backend

> Si le dashboard affiche « Backend injoignable », c'est que le serveur Python du
> terminal A n'est pas démarré.

---

## Endpoints de l'API

| Méthode | Route | Rôle |
|--------|-------|------|
| GET | `/api/festival` | Les 4 jours vitrine (données horaires) |
| GET | `/api/analysis?day=&hour=` | Prédictions + anomalies + ressources à un instant |
| POST | `/api/scenario` | Évaluation d'un scénario what-if |
| GET | `/api/metrics` | Métriques d'évaluation du modèle ML |
| GET | `/api/health` | État du service |
