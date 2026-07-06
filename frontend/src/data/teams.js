/**
 * Définition des 5 équipes logistiques du festival.
 *
 * Chaque équipe possède :
 * - id      : identifiant unique
 * - name    : nom affiché
 * - members : nombre de membres disponibles
 * - color   : couleur associée pour les visualisations
 *
 * Total : 130 personnes mobilisées.
 */

export const TEAMS = [
  { id: "security",  name: "Sécurité",      members: 40, color: "#EF4444" },
  { id: "medical",   name: "Médical",        members: 15, color: "#10B981" },
  { id: "tech",      name: "Technique",      members: 25, color: "#3B82F6" },
  { id: "cleaning",  name: "Nettoyage",      members: 20, color: "#F59E0B" },
  { id: "catering",  name: "Restauration",   members: 30, color: "#8B5CF6" },
];

/** Nombre total de personnes mobilisées. */
export const TOTAL_STAFF = TEAMS.reduce((sum, t) => sum + t.members, 0);
