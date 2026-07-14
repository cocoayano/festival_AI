/**
 * Onglet Ressources — affiche les indicateurs besoin/disponible,
 * le tableau d'allocation par scène et le radar chart de profil.
 */

import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer } from "recharts";
import { COLORS } from "../utils/colors";
import { STAGES } from "../data/stages";
import StatusBadge from "./ui/StatusBadge";

const RESOURCE_LABELS = {
  security: "Sécurité",
  medical: "Médical",
  water: "Points d'eau",
  toilets: "Sanitaires",
};

export default function ResourcesTab({ resources, currentHour }) {
  const { stageAllocations, summary } = resources;

  // Données radar
  const radarData = STAGES.map(s => ({
    name: s.name.replace("Scène ", ""),
    occupation: stageAllocations[s.id].occupancy,
    security: stageAllocations[s.id].security * 10,
    water: stageAllocations[s.id].water * 5,
  }));

  return (
    <div>
      {/* Cartes résumé */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(summary).map(([key, val]) => (
          <div key={key} style={{ background: COLORS.card, borderRadius: 14, padding: "16px 20px", border: `1px solid ${COLORS.border}`, flex: "1 1 180px" }}>
            <div style={{ fontSize: 11, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{RESOURCE_LABELS[key]}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: COLORS.text }}>{val.needed}</span>
              <span style={{ fontSize: 13, color: COLORS.textMuted }}>/ {val.available}</span>
            </div>
            <StatusBadge status={val.status}>{val.status === "ok" ? "Suffisant" : "Déficit"}</StatusBadge>
          </div>
        ))}
      </div>

      {/* Tableau d'allocation */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Allocation optimale par scène — {currentHour}:00</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.border}` }}>
                {["Scène", "Occupation", "Sécurité", "Médical", "Eau", "Sanitaires", "Priorité"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: COLORS.textDim, fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map(stage => {
                const alloc = stageAllocations[stage.id];
                return (
                  <tr key={stage.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "10px", fontWeight: 500, color: COLORS.text }}>{stage.name}</td>
                    <td style={{ padding: "10px" }}><StatusBadge status={alloc.priority}>{alloc.occupancy}%</StatusBadge></td>
                    <td style={{ padding: "10px", color: COLORS.textMuted }}>{alloc.security} agents</td>
                    <td style={{ padding: "10px", color: COLORS.textMuted }}>{alloc.medical} équipes</td>
                    <td style={{ padding: "10px", color: COLORS.textMuted }}>{alloc.water} points</td>
                    <td style={{ padding: "10px", color: COLORS.textMuted }}>{alloc.toilets} cabines</td>
                    <td style={{ padding: "10px" }}><StatusBadge status={alloc.priority}>{alloc.priority === "high" ? "Haute" : alloc.priority === "medium" ? "Moyenne" : "Basse"}</StatusBadge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Radar chart */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Profil d'utilisation des ressources</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke={COLORS.border} />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: COLORS.textMuted }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: COLORS.textDim }} />
            <Radar name="Occupation %" dataKey="occupation" stroke={COLORS.chart1} fill={COLORS.chart1} fillOpacity={0.2} />
            <Radar name="Sécurité" dataKey="security" stroke={COLORS.chart2} fill={COLORS.chart2} fillOpacity={0.1} />
            <Legend wrapperStyle={{ fontSize: 11, color: COLORS.textMuted }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
