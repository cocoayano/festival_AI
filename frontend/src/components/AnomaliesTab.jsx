/**
 * Onglet Anomalies — affiche les compteurs, graphiques
 * de répartition et le journal des alertes détectées.
 */

import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "../utils/colors";
import MetricCard from "./ui/MetricCard";
import StatusBadge from "./ui/StatusBadge";

export default function AnomaliesTab({ anomalies, visibleData }) {
  const criticals = anomalies.filter(a => a.severity === "critical").length;
  const warnings = anomalies.filter(a => a.severity === "warning").length;

  // Données pour le pie chart
  const pieData = [
    { name: "Surcharge", value: anomalies.filter(a => a.type === "overcrowding").length, fill: COLORS.chart4 },
    { name: "Incidents", value: anomalies.filter(a => a.type === "incidents").length, fill: COLORS.chart3 },
    { name: "Bruit", value: anomalies.filter(a => a.type === "noise").length, fill: COLORS.chart1 },
    { name: "Afflux", value: anomalies.filter(a => a.type === "spike").length, fill: COLORS.chart2 },
    { name: "Médical", value: anomalies.filter(a => a.type === "medical").length, fill: COLORS.chart5 },
  ].filter(d => d.value > 0);

  // Données pour le bar chart (anomalies par heure) — dérivées des anomalies reçues
  const countByHour = {};
  anomalies.forEach(a => { countByHour[a.hour] = (countByHour[a.hour] || 0) + 1; });
  const barData = visibleData.map(d => ({
    label: d.label,
    anomalies: countByHour[d.hour] || 0,
  }));

  return (
    <div>
      {/* Compteurs */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <MetricCard label="Total anomalies" value={anomalies.length} icon="🔍" />
        <MetricCard label="Critiques" value={criticals} icon="🔴" />
        <MetricCard label="Avertissements" value={warnings} icon="🟡" />
      </div>

      {/* Graphiques */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}`, flex: "1 1 350px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Répartition par type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}`, flex: "1 1 350px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Anomalies par heure</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: COLORS.textDim }} />
              <YAxis tick={{ fontSize: 10, fill: COLORS.textDim }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text }} />
              <Bar dataKey="anomalies" fill={COLORS.chart4} radius={[4, 4, 0, 0]} name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Journal */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Journal des anomalies détectées</h3>
        {anomalies.length === 0 ? (
          <p style={{ color: COLORS.textDim, fontSize: 13 }}>Aucune anomalie détectée pour la période observée.</p>
        ) : (
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < anomalies.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                <div style={{ fontSize: 12, color: COLORS.textDim, minWidth: 45 }}>{a.hour}:00</div>
                <StatusBadge status={a.severity}>{a.severity === "critical" ? "CRITIQUE" : "ATTENTION"}</StatusBadge>
                <div style={{ flex: 1, fontSize: 13, color: COLORS.text }}>{a.message}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{a.location}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
