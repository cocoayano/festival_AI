/**
 * Onglet Scénarios — interface de simulation what-if
 * avec contrôles, résultats multicritères et graphique comparatif.
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { COLORS } from "../utils/colors";
import { DEFAULT_SCENARIO } from "../api";
import MetricCard from "./ui/MetricCard";

const SCENARIO_OPTIONS = [
  { key: "extraStage",    label: "Scène supplémentaire (+15% visiteurs)" },
  { key: "extendedHours", label: "Horaires étendus (après 22h)" },
  { key: "extraSecurity", label: "Sécurité renforcée" },
];

export default function ScenariosTab({ scenario, setScenario, scenarioResult }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        {/* Contrôles */}
        <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}`, flex: "1 1 300px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Paramètres du scénario</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>
                Multiplicateur de capacité : ×{scenario.capacityMultiplier.toFixed(1)}
              </label>
              <input type="range" min={0.5} max={1.5} step={0.1} value={scenario.capacityMultiplier}
                onChange={e => setScenario(s => ({ ...s, capacityMultiplier: +e.target.value }))}
                style={{ width: "100%", accentColor: COLORS.accent }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textMuted, display: "block", marginBottom: 4 }}>
                Impact météo : ×{scenario.weatherImpact.toFixed(1)}
              </label>
              <input type="range" min={0.5} max={1.3} step={0.1} value={scenario.weatherImpact}
                onChange={e => setScenario(s => ({ ...s, weatherImpact: +e.target.value }))}
                style={{ width: "100%", accentColor: COLORS.accent }} />
            </div>
            {SCENARIO_OPTIONS.map(opt => (
              <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: COLORS.textMuted }}>
                <input type="checkbox" checked={scenario[opt.key]}
                  onChange={e => setScenario(s => ({ ...s, [opt.key]: e.target.checked }))}
                  style={{ accentColor: COLORS.accent }} />
                {opt.label}
              </label>
            ))}
            <button onClick={() => setScenario(DEFAULT_SCENARIO)}
              style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", marginTop: 4 }}>
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Résultats */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 14 }}>
          <MetricCard label="Score global" value={`${scenarioResult.overallScore}/100`} sub={`Sécurité: ${scenarioResult.safetyScore} • Ressources: ${scenarioResult.resourceScore}`} icon="⭐" />
          <MetricCard label="Pic visiteurs" value={scenarioResult.peakVisitors.toLocaleString()} icon="📈" />
          <MetricCard label="Alertes" value={`${scenarioResult.anomalies} (${scenarioResult.criticals} crit.)`} icon="⚠️" />
          <MetricCard label="Coût relatif" value={`${scenarioResult.costFactor}%`} sub="par rapport au scénario de base" icon="💰" />
        </div>
      </div>

      {/* Graphique comparatif */}
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 20, border: `1px solid ${COLORS.border}` }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>Comparaison : scénario actuel vs base</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={scenarioResult.modified.map(d => ({ label: d.label, modifié: d.visitors, original: d.original }))}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textDim }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.textDim }} />
            <Tooltip contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, fontSize: 12, color: COLORS.text }} />
            <Area type="monotone" dataKey="original" stroke={COLORS.textDim} fill={COLORS.textDim} fillOpacity={0.1} strokeDasharray="4 4" name="Base" />
            <Area type="monotone" dataKey="modifié" stroke={COLORS.accent} fill={COLORS.accent} fillOpacity={0.15} name="Scénario modifié" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
