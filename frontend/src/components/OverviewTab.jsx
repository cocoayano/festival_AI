/**
 * Onglet Vue d'ensemble — affiche les KPI principaux,
 * le graphique d'affluence et les barres d'occupation par scène.
 */

import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "../utils/colors";
import { STAGES } from "../data/stages";
import MetricCard from "./ui/MetricCard";

export default function OverviewTab({ currentStats, chartData, anomalies, resources, trend, dayData, currentHour }) {
  return (
    <div>
      {/* KPI */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <MetricCard
          label="Visiteurs actuels" icon="👥"
          value={currentStats.visitors.toLocaleString()}
          sub={`Capacité totale: ${STAGES.reduce((s, st) => s + st.capacity, 0).toLocaleString()}`}
          trend={trend}
        />
        <MetricCard label="Incidents" icon="⚠️" value={currentStats.incidents} sub={`${currentStats.medicalCalls} appels médicaux`} />
        <MetricCard label="Alertes" icon="🔔" value={anomalies.length} sub={`${anomalies.filter(a => a.severity === "critical").length} critiques`} />
        <MetricCard label="Score ressources" icon="📊" value={`${resources.score}%`} sub="Couverture globale" />
      </div>

      {/* Graphique affluence */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Affluence en temps réel — {dayData.label}</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.chart1} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.chart1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textDim }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textDim }} />
            <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text }} />
            <Area type="monotone" dataKey="visitors" stroke={COLORS.chart1} fill="url(#gv)" strokeWidth={2.5} name="Visiteurs" />
            <Line type="monotone" dataKey="predicted" stroke={COLORS.chart2} strokeDasharray="5 5" strokeWidth={2} name="Prédiction" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Barres d'occupation */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Occupation des scènes à {currentHour}:00</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STAGES.map(stage => {
            const occ = currentStats[stage.id] / stage.capacity;
            const color = occ > 0.9 ? COLORS.danger : occ > 0.7 ? COLORS.warning : COLORS.success;
            return (
              <div key={stage.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: COLORS.text }}>{stage.name}</span>
                  <span style={{ color }}>{currentStats[stage.id]} / {stage.capacity} ({Math.round(occ * 100)}%)</span>
                </div>
                <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, occ * 100)}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
