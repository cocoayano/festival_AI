"""
Configuration statique du festival : scènes, équipes logistiques, ressources.

Portage fidèle des fichiers stages.js / teams.js / resources.js de la version JS,
regroupés ici car ce sont des constantes partagées par tous les modules.
"""

# ─── Scènes ──────────────────────────────────────────────────────
# capacity : capacité max | x, y : coordonnées (%) pour la carte
STAGES = [
    {"id": "main",      "name": "Scène Principale", "capacity": 5000, "genre": "Pop/Rock",           "x": 50, "y": 30},
    {"id": "electro",   "name": "Scène Electro",    "capacity": 3000, "genre": "Electro/DJ",          "x": 75, "y": 55},
    {"id": "jazz",      "name": "Scène Jazz",       "capacity": 1500, "genre": "Jazz/Blues",          "x": 25, "y": 60},
    {"id": "acoustic",  "name": "Scène Acoustique", "capacity": 800,  "genre": "Folk/Acoustique",     "x": 40, "y": 75},
    {"id": "discovery", "name": "Scène Découverte", "capacity": 1200, "genre": "Artistes émergents",  "x": 60, "y": 80},
]

# Ratios de répartition des visiteurs entre les scènes (somme = 1.0)
STAGE_RATIOS = [0.35, 0.25, 0.15, 0.10, 0.15]

TOTAL_CAPACITY = sum(s["capacity"] for s in STAGES)

# ─── Équipes logistiques ─────────────────────────────────────────
TEAMS = [
    {"id": "security", "name": "Sécurité",    "members": 40, "color": "#EF4444"},
    {"id": "medical",  "name": "Médical",     "members": 15, "color": "#10B981"},
    {"id": "tech",     "name": "Technique",   "members": 25, "color": "#3B82F6"},
    {"id": "cleaning", "name": "Nettoyage",   "members": 20, "color": "#F59E0B"},
    {"id": "catering", "name": "Restauration","members": 30, "color": "#8B5CF6"},
]

TOTAL_STAFF = sum(t["members"] for t in TEAMS)

# ─── Ressources matérielles ──────────────────────────────────────
RESOURCES = [
    {"id": "water",    "name": "Points d'eau",       "total": 50,  "unit": "unités"},
    {"id": "toilets",  "name": "Sanitaires",         "total": 80,  "unit": "cabines"},
    {"id": "barriers", "name": "Barrières",          "total": 200, "unit": "mètres"},
    {"id": "lights",   "name": "Éclairage",          "total": 120, "unit": "projecteurs"},
    {"id": "sound",    "name": "Sonorisation",       "total": 30,  "unit": "systèmes"},
    {"id": "firstaid", "name": "Kits premiers soins","total": 60,  "unit": "kits"},
]

# Accès rapide par id
STAGE_BY_ID = {s["id"]: s for s in STAGES}
TEAM_BY_ID = {t["id"]: t for t in TEAMS}
RESOURCE_BY_ID = {r["id"]: r for r in RESOURCES}
