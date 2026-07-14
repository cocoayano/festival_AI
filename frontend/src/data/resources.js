/**
 * Définition des 6 catégories de ressources matérielles.
 *
 * Chaque ressource possède :
 * - id    : identifiant unique
 * - name  : nom affiché
 * - total : quantité totale disponible
 * - unit  : unité de mesure
 */

export const RESOURCES = [
  { id: "water",    name: "Points d'eau",       total: 50,  unit: "unités" },
  { id: "toilets",  name: "Sanitaires",         total: 80,  unit: "cabines" },
  { id: "barriers", name: "Barrières",          total: 200, unit: "mètres" },
  { id: "lights",   name: "Éclairage",          total: 120, unit: "projecteurs" },
  { id: "sound",    name: "Sonorisation",        total: 30,  unit: "systèmes" },
  { id: "firstaid", name: "Kits premiers soins", total: 60,  unit: "kits" },
];
