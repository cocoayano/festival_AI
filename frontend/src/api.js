/**
 * Client API — communication avec le backend Python (FastAPI).
 *
 * En développement, les requêtes ciblent "/api/..." et sont redirigées vers
 * http://localhost:8000 par le proxy configuré dans vite.config.js.
 */

const BASE = "/api";

async function getJSON(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`Erreur API ${url} → ${res.status}`);
  return res.json();
}

/** Scénario par défaut (dupliqué côté client pour la réinitialisation UI). */
export const DEFAULT_SCENARIO = {
  capacityMultiplier: 1,
  weatherImpact: 1,
  extraStage: false,
  extendedHours: false,
  extraSecurity: false,
};

export const fetchFestival = () => getJSON(`${BASE}/festival`);

export const fetchMetrics = () => getJSON(`${BASE}/metrics`);

export const fetchAnalysis = (day, hour, signal) =>
  getJSON(`${BASE}/analysis?day=${day}&hour=${hour}`, { signal });

export const postScenario = (day, scenario) =>
  getJSON(`${BASE}/scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ day, scenario }),
  });
