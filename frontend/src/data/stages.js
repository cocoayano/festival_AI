/**
 * Définition des 5 scènes du festival.
 *
 * Chaque scène possède :
 * - id        : identifiant unique
 * - name      : nom affiché
 * - capacity  : capacité maximale (nombre de places)
 * - genre     : genre musical principal
 * - x, y      : coordonnées relatives (%) pour la carte
 *
 * Les capacités sont inspirées de festivals réels :
 * - Grande scène : 5 000 (type Mainstage)
 * - Scène Electro : 3 000 (type scène couverte)
 * - Scène Jazz : 1 500 (type chapiteau)
 * - Scène Acoustique : 800 (type scène intimiste)
 * - Scène Découverte : 1 200 (type tremplin)
 */

export const STAGES = [
  {
    id: "main",
    name: "Scène Principale",
    capacity: 5000,
    genre: "Pop/Rock",
    x: 50,
    y: 30,
  },
  {
    id: "electro",
    name: "Scène Electro",
    capacity: 3000,
    genre: "Electro/DJ",
    x: 75,
    y: 55,
  },
  {
    id: "jazz",
    name: "Scène Jazz",
    capacity: 1500,
    genre: "Jazz/Blues",
    x: 25,
    y: 60,
  },
  {
    id: "acoustic",
    name: "Scène Acoustique",
    capacity: 800,
    genre: "Folk/Acoustique",
    x: 40,
    y: 75,
  },
  {
    id: "discovery",
    name: "Scène Découverte",
    capacity: 1200,
    genre: "Artistes émergents",
    x: 60,
    y: 80,
  },
];

/** Capacité totale du festival (somme de toutes les scènes). */
export const TOTAL_CAPACITY = STAGES.reduce((sum, s) => sum + s.capacity, 0);

/** Ratios de répartition des visiteurs entre les scènes. */
export const STAGE_RATIOS = [0.35, 0.25, 0.15, 0.10, 0.15];
