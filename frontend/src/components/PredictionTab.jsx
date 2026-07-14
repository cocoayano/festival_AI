/**
 * Onglet Prédiction — affiche les prédictions d'affluence
 * avec intervalles de confiance et méthodologie du modèle.
 */

import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "../utils/colors";
import MetricCard from "./ui/MetricCard";

export default function PredictionTab({ predictions, chartData, metrics }) {
  return (
    <div>
      {/* Cartes de prédiction */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {predictions.map((p, i) => (
          <MetricCard
            key={i} icon="🔮"
            label={`Prédiction ${p.label}`}
            value={p.predicted.toLocaleString()}
            sub={`Confiance: ${p.confidence}% • [${p.lower.toLocaleString()} – ${p.upper.toLocaleString()}]`}
          />
        ))}
      </div>

      {/* Graphique */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Modèle de prédiction — Gradient Boosting (régression quantile)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textDim }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textDim }} />
            <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text }} />
            <Area type="monotone" dataKey="upper" stroke="none" fill={COLORS.chart2} fillOpacity={0.15} name="Intervalle sup." />
            <Line type="monotone" dataKey="visitors" stroke={COLORS.chart1} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.chart1 }} name="Réel" />
            <Line type="monotone" dataKey="predicted" stroke={COLORS.chart2} strokeDasharray="6 4" strokeWidth={2} dot={{ r: 3, fill: COLORS.chart2, strokeDasharray: "none" }} name="Prédit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Métriques d'évaluation du modèle (hold-out) */}
      {metrics && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
          <MetricCard label="MAE (test)" value={metrics.mae} sub={`erreur moyenne, ~${Math.round(metrics.mae)} visiteurs`} icon="🎯" />
          <MetricCard label="RMSE (test)" value={metrics.rmse} icon="📐" />
          <MetricCard label="vs baseline persistance" value={`−${metrics.improvement_vs_persistence_pct}%`} sub={`MAE ${metrics.mae} vs ${metrics.baseline_persistence_mae}`} icon="📉" />
          <MetricCard label="Jeu d'entraînement" value={metrics.n_train} sub={`test : ${metrics.n_test} points`} icon="🗂️" />
        </div>
      )}

      {/* Méthodologie */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>Méthodologie du modèle prédictif</h3>
        <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 10px" }}>La prévision repose sur un <strong style={{ color: COLORS.accentLight }}>modèle d'apprentissage supervisé (Gradient Boosting)</strong> entraîné sur un corpus historique de journées de festival. La prévision d'affluence est posée comme un problème de régression.</p>
          <p style={{ margin: "0 0 6px" }}>• <strong style={{ color: COLORS.text }}>Variables</strong> : encodage cyclique de l'heure (sin/cos), facteurs météo et événementiel, retards (t-1, t-2), moyenne glissante 3h, variation instantanée</p>
          <p style={{ margin: "0 0 6px" }}>• <strong style={{ color: COLORS.text }}>Intervalles</strong> : trois modèles en régression quantile (0.1 / 0.5 / 0.9) → intervalle de prédiction à 80% appris sur les données, non codé en dur</p>
          <p style={{ margin: "0 0 6px" }}>• <strong style={{ color: COLORS.text }}>Multi-pas</strong> : prévision récursive (H+1 réinjecté pour H+2…), d'où un élargissement de l'incertitude avec l'horizon</p>
          <p style={{ margin: "10px 0 0", fontSize: 12, color: COLORS.textDim }}>Évaluation sur des jours tenus à l'écart (hold-out). Le modèle est comparé à deux baselines (persistance et moyenne) pour objectiver son apport.</p>
        </div>
      </div>
    </div>
  );
}
