import { COLORS } from "../../utils/colors";

/**
 * Carte affichant une métrique clé avec label, valeur, sous-titre et tendance.
 */
export default function MetricCard({ label, value, sub, trend, icon }) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 14,
      padding: "18px 20px", border: `1px solid ${COLORS.border}`,
      flex: "1 1 160px", minWidth: 160,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{
            fontSize: 11, color: COLORS.textDim,
            textTransform: "uppercase", letterSpacing: 1.2,
            marginBottom: 6, fontWeight: 500,
          }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.text, lineHeight: 1.1 }}>
            {value}
          </div>
          {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: 24, opacity: 0.5 }}>{icon}</div>}
      </div>
      {trend !== undefined && (
        <div style={{
          fontSize: 12, marginTop: 8, fontWeight: 500,
          color: trend >= 0 ? COLORS.success : COLORS.danger,
        }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs heure préc.
        </div>
      )}
    </div>
  );
}
