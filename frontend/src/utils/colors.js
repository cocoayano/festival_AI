/**
 * Palette de couleurs et thème de l'application FestivalAI.
 * Centralise toutes les couleurs pour garantir la cohérence visuelle.
 */

export const COLORS = {
  // Backgrounds
  bg:        "#0F172A",
  card:      "#1E293B",
  cardHover: "#273548",
  border:    "#334155",

  // Text
  text:      "#F8FAFC",
  textMuted: "#94A3B8",
  textDim:   "#64748B",

  // Accent
  accent:      "#7C3AED",
  accentLight: "#A78BFA",
  accentGlow:  "rgba(124, 58, 237, 0.15)",

  // Status
  success: "#10B981",
  warning: "#F59E0B",
  danger:  "#EF4444",
  info:    "#3B82F6",

  // Charts
  chart1: "#7C3AED",
  chart2: "#06B6D4",
  chart3: "#F59E0B",
  chart4: "#EF4444",
  chart5: "#10B981",
};

/**
 * Retourne la couleur associée à un statut donné.
 */
export function getStatusColor(status) {
  const map = {
    critical: COLORS.danger,
    warning:  COLORS.warning,
    ok:       COLORS.success,
    high:     COLORS.danger,
    medium:   COLORS.warning,
    low:      COLORS.success,
    deficit:  COLORS.danger,
  };
  return map[status] || COLORS.info;
}
