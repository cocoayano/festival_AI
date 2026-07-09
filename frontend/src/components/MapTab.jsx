/**
 * Onglet Carte — vue spatiale du festival avec marqueurs
 * d'occupation colorés et données environnementales.
 */

import { COLORS } from "../utils/colors";
import { STAGES } from "../data/stages";
import MetricCard from "./ui/MetricCard";

export default function MapTab({ currentStats, dayData }) {
  return (
    <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}` }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Carte du festival — Occupation en temps réel</h3>

      {/* Carte */}
      <div style={{ position: "relative", width: "100%", paddingBottom: "60%", background: `linear-gradient(135deg, #1a2332 0%, #0f1922 100%)`, borderRadius: 12, overflow: "hidden" }}>
        {/* Grille */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {Array.from({ length: 10 }, (_, i) => (
            <g key={i}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke={COLORS.border} strokeWidth="0.15" />
              <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke={COLORS.border} strokeWidth="0.15" />
            </g>
          ))}
          {STAGES.slice(0, -1).map((s, i) => (
            <line key={i} x1={s.x} y1={s.y} x2={STAGES[i + 1].x} y2={STAGES[i + 1].y}
              stroke={COLORS.accent} strokeWidth="0.3" strokeDasharray="1 1" opacity={0.3} />
          ))}
        </svg>

        {/* Marqueurs des scènes */}
        {STAGES.map(stage => {
          const occ = currentStats[stage.id] / stage.capacity;
          const color = occ > 0.9 ? COLORS.danger : occ > 0.7 ? COLORS.warning : COLORS.success;
          const size = 28 + occ * 20;
          return (
            <div key={stage.id} style={{ position: "absolute", left: `${stage.x}%`, top: `${stage.y}%`, transform: "translate(-50%, -50%)", textAlign: "center" }}>
              <div style={{
                width: size, height: size, borderRadius: "50%",
                background: `${color}33`, border: `2px solid ${color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color,
                boxShadow: `0 0 20px ${color}44`,
                animation: occ > 0.85 ? "pulse 1.5s infinite" : "none",
              }}>
                {Math.round(occ * 100)}%
              </div>
              <div style={{ fontSize: 10, color: COLORS.text, marginTop: 4, fontWeight: 500, whiteSpace: "nowrap" }}>
                {stage.name.replace("Scène ", "")}
              </div>
              <div style={{ fontSize: 9, color: COLORS.textDim }}>
                {currentStats[stage.id]} / {stage.capacity}
              </div>
            </div>
          );
        })}

        {/* Légende */}
        <div style={{ position: "absolute", bottom: 10, right: 10, background: `${COLORS.bg}cc`, borderRadius: 8, padding: "8px 12px", fontSize: 10 }}>
          {[{ color: COLORS.success, label: "< 70%" }, { color: COLORS.warning, label: "70-90%" }, { color: COLORS.danger, label: "> 90%" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span style={{ color: COLORS.textMuted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>

      {/* Métriques environnement */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 16 }}>
        <MetricCard label="Température" value={`${currentStats.temperature}°C`} icon="🌡️" />
        <MetricCard label="Niveau sonore" value={`${currentStats.noiseLevel} dB`}
          sub={currentStats.noiseLevel > 85 ? "Au-dessus du seuil" : "Normal"} icon="🔊" />
        <MetricCard label="Météo" value={dayData.weather} icon="☀️" />
      </div>
    </div>
  );
}
