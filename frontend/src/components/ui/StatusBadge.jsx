import { getStatusColor } from "../../utils/colors";

/**
 * Badge coloré indiquant un statut (ok, warning, critical, etc.).
 */
export default function StatusBadge({ status, children }) {
  const bg = getStatusColor(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 10px", borderRadius: 12,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      background: `${bg}22`, color: bg, border: `1px solid ${bg}44`,
    }}>
      {children}
    </span>
  );
}
