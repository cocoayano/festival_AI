import { COLORS } from "../../utils/colors";

/**
 * Bouton d'onglet avec état actif/inactif.
 */
export default function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px", borderRadius: 10, fontSize: 13,
      cursor: "pointer", transition: "all 0.2s", letterSpacing: 0.2,
      border: active ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
      background: active ? COLORS.accentGlow : "transparent",
      color: active ? COLORS.accentLight : COLORS.textMuted,
      fontWeight: active ? 600 : 400,
    }}>
      {children}
    </button>
  );
}
