/**
 * FestivalAI — Application principale.
 *
 * Dashboard React. Toute la logique (données simulées, prédiction ML,
 * détection d'anomalies, allocation, scénarios) est calculée par le backend
 * Python et récupérée via l'API (voir src/api.js). Ce composant orchestre
 * l'état global (jour, heure, onglet, scénario) et l'affichage.
 */

import { useState, useEffect } from "react";
import { COLORS } from "./utils/colors";
import {
  DEFAULT_SCENARIO,
  fetchFestival,
  fetchMetrics,
  fetchAnalysis,
  postScenario,
} from "./api";

import TabButton from "./components/ui/TabButton";
import OverviewTab from "./components/OverviewTab";
import PredictionTab from "./components/PredictionTab";
import AnomaliesTab from "./components/AnomaliesTab";
import ResourcesTab from "./components/ResourcesTab";
import ScenariosTab from "./components/ScenariosTab";
import MapTab from "./components/MapTab";

// ─── État global ─────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentHour, setCurrentHour] = useState(16);
  const [isLive, setIsLive] = useState(false);
  const [scenario, setScenario] = useState({ ...DEFAULT_SCENARIO });

  // ── Données chargées depuis le backend ──────────────────────
  const [festivalData, setFestivalData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [analysis, setAnalysis] = useState(null);      // {predictions, anomalies, resources}
  const [scenarioResult, setScenarioResult] = useState(null);
  const [error, setError] = useState(null);

  // ── Chargement initial (données + métriques du modèle) ──────
  useEffect(() => {
    Promise.all([fetchFestival(), fetchMetrics()])
      .then(([fest, met]) => { setFestivalData(fest); setMetrics(met); })
      .catch(err => setError(err.message));
  }, []);

  // ── Analyse (prédiction / anomalies / ressources) à chaque changement ──
  useEffect(() => {
    const controller = new AbortController();
    fetchAnalysis(selectedDay, currentHour, controller.signal)
      .then(setAnalysis)
      .catch(err => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [selectedDay, currentHour]);

  // ── Évaluation du scénario (jour + paramètres) ──────────────
  useEffect(() => {
    postScenario(selectedDay, scenario).then(setScenarioResult).catch(() => {});
  }, [selectedDay, scenario]);

  // ── Simulation live ─────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => {
      setCurrentHour(h => {
        if (h >= 23) { setIsLive(false); return 23; }
        return h + 1;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [isLive]);

  // ── Écran de chargement / erreur ────────────────────────────
  if (error) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, fontFamily: "'Inter', sans-serif", padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.danger }}>⚠ Backend injoignable</div>
        <div style={{ fontSize: 14, color: COLORS.textMuted, maxWidth: 460 }}>{error}</div>
        <div style={{ fontSize: 13, color: COLORS.textDim, maxWidth: 460 }}>
          Vérifiez que le serveur Python tourne : <code>uvicorn main:app --port 8000</code> dans le dossier <code>backend/</code>.
        </div>
      </div>
    );
  }

  if (!festivalData || !analysis || !scenarioResult) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ fontSize: 15, color: COLORS.textMuted }}>◆ Chargement du modèle et des données…</div>
      </div>
    );
  }

  // ── Données dérivées ────────────────────────────────────────
  const dayData = festivalData[selectedDay];
  const hourlyData = dayData.hours;
  const currentIndex = hourlyData.findIndex(d => d.hour === currentHour);
  const visibleData = hourlyData.slice(0, currentIndex + 1);
  const currentStats = visibleData[visibleData.length - 1] || hourlyData[0];

  const { predictions, anomalies, resources } = analysis;

  const prevStats = currentIndex > 0 ? visibleData[currentIndex - 1] : null;
  const trend = prevStats
    ? Math.round((currentStats.visitors - prevStats.visitors) / prevStats.visitors * 100)
    : 0;

  // ── Données pour les graphiques (réel + prédiction) ─────────
  const chartData = (() => {
    const actual = visibleData.map(d => ({ label: d.label, visitors: d.visitors }));
    const pred = predictions.map(p => ({ label: p.label, predicted: p.predicted, lower: p.lower, upper: p.upper }));
    const bridge = actual.length > 0
      ? { label: actual[actual.length - 1].label, predicted: actual[actual.length - 1].visitors, lower: actual[actual.length - 1].visitors, upper: actual[actual.length - 1].visitors }
      : null;
    return [...actual, ...(bridge ? [bridge] : []), ...pred];
  })();

  const tabs = [
    { id: "overview",   label: "Vue d'ensemble" },
    { id: "prediction", label: "Prédiction" },
    { id: "anomalies",  label: `Anomalies (${anomalies.length})` },
    { id: "resources",  label: "Ressources" },
    { id: "scenarios",  label: "Scénarios" },
    { id: "map",        label: "Carte" },
  ];

  // ─── RENDU ──────────────────────────────────────────────────
  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.bg} 0%, #1a1040 100%)`, borderBottom: `1px solid ${COLORS.border}`, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
              <span style={{ color: COLORS.accentLight }}>◆</span> FestivalAI — Centre de Contrôle
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.textDim }}>
              Système intelligent de gestion de festival • {dayData.label} • {dayData.weather}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {festivalData.map((d, i) => (
              <button key={i} onClick={() => { setSelectedDay(i); setCurrentHour(16); }}
                style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: selectedDay === i ? 600 : 400,
                  border: selectedDay === i ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                  background: selectedDay === i ? COLORS.accentGlow : "transparent",
                  color: selectedDay === i ? COLORS.accentLight : COLORS.textMuted }}>
                J{d.day}
              </button>
            ))}
            <button onClick={() => setIsLive(!isLive)}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 500,
                border: `1px solid ${isLive ? COLORS.success : COLORS.border}`,
                background: isLive ? `${COLORS.success}22` : "transparent",
                color: isLive ? COLORS.success : COLORS.textMuted }}>
              {isLive ? "⏸ Pause" : "▶ Simuler"}
            </button>
          </div>
        </div>

        {/* Slider temporel */}
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: COLORS.textDim, minWidth: 40 }}>10:00</span>
          <input type="range" min={10} max={23} value={currentHour}
            onChange={e => setCurrentHour(+e.target.value)}
            style={{ flex: 1, accentColor: COLORS.accent }} />
          <span style={{ fontSize: 12, color: COLORS.textDim, minWidth: 40 }}>{currentHour}:00</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "16px 24px", overflowX: "auto", flexWrap: "wrap" }}>
        {tabs.map(t => (
          <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      <div style={{ padding: "0 24px 32px" }}>
        {activeTab === "overview" && (
          <OverviewTab currentStats={currentStats} chartData={chartData} anomalies={anomalies} resources={resources} trend={trend} dayData={dayData} currentHour={currentHour} />
        )}
        {activeTab === "prediction" && (
          <PredictionTab predictions={predictions} chartData={chartData} metrics={metrics} />
        )}
        {activeTab === "anomalies" && (
          <AnomaliesTab anomalies={anomalies} visibleData={visibleData} />
        )}
        {activeTab === "resources" && (
          <ResourcesTab resources={resources} currentHour={currentHour} />
        )}
        {activeTab === "scenarios" && (
          <ScenariosTab scenario={scenario} setScenario={setScenario} scenarioResult={scenarioResult} />
        )}
        {activeTab === "map" && (
          <MapTab currentStats={currentStats} dayData={dayData} />
        )}
      </div>
    </div>
  );
}
