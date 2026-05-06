import type { LandmarkName } from '../pose/landmarks';

/**
 * Référence à un point: soit un landmark MediaPipe nommé,
 * soit un point composite calculé (ex: milieu des hanches).
 */
export type PointRef =
  | { kind: 'lm'; name: LandmarkName }
  | { kind: 'mid'; a: PointRef; b: PointRef };

/** Helpers de construction. */
export const lm = (name: LandmarkName): PointRef => ({ kind: 'lm', name });
export const mid = (a: PointRef, b: PointRef): PointRef => ({ kind: 'mid', a, b });

export type Normalize = 'shoulderWidth' | 'hipWidth' | 'torsoHeight' | 'bodyScale' | 'none';

/** Base commune à toutes les contraintes. */
interface ConstraintBase {
  /** Libellé court affiché dans le rapport (ex: "Genou avant"). */
  label?: string;
  /** Conseil de correction si la contrainte échoue. */
  hint?: string;
  /** Poids relatif dans le score global. Défaut: 1. */
  weight?: number;
}

/**
 * Angle articulaire au sommet `vertex` formé par les segments vertex->a et vertex->b.
 * Mesuré dans [0..180]°.
 *
 * Ex: angle du genou = (hanche, genou, cheville).
 */
export interface JointAngleConstraint extends ConstraintBase {
  type: 'jointAngle';
  a: PointRef;
  vertex: PointRef;
  b: PointRef;
  /** Valeur cible en degrés. */
  target: number;
  /** Tolérance: au-delà de cette déviation absolue, score = 0. */
  tolerance: number;
}

/**
 * Angle d'un segment par rapport à l'horizontale (en degrés, [-180..180]).
 *  - 0°   = horizontal vers la droite
 *  - 90°  = vers le haut
 *  - -90° = vers le bas
 *
 * `axis: 'horizontal'` => target = 0
 * `axis: 'vertical'`   => target = 90 (ou -90, selon le signe attendu)
 */
export interface SegmentAngleConstraint extends ConstraintBase {
  type: 'segmentAngle';
  from: PointRef;
  to: PointRef;
  /** Cible en degrés (ex: 0 = horizontal, 90 = vertical haut). */
  target: number;
  tolerance: number;
  /** Si true, on ignore le sens (alignement, pas direction). Défaut: false. */
  unsigned?: boolean;
}

/**
 * Distance entre deux points, normalisée par une mesure du corps.
 * `target` et `tolerance` sont exprimés dans la même unité que la normalisation
 * (ex: target=2.0 avec normalize='shoulderWidth' => 2 largeurs d'épaules).
 */
export interface DistanceConstraint extends ConstraintBase {
  type: 'distance';
  a: PointRef;
  b: PointRef;
  normalize?: Normalize;
  target: number;
  tolerance: number;
}

/**
 * Ordonnancement vertical: `a` doit être au-dessus de `b` à l'image
 * (y de a < y de b, car y croît vers le bas).
 * `minGap` est exprimé en fraction de bodyScale.
 */
export interface AboveConstraint extends ConstraintBase {
  type: 'above';
  a: PointRef;
  b: PointRef;
  minGap?: number;
  tolerance?: number;
}

/** Ordonnancement horizontal. `a` à gauche/droite de `b` à l'image. */
export interface HorizontalOrderConstraint extends ConstraintBase {
  type: 'leftOf' | 'rightOf';
  a: PointRef;
  b: PointRef;
  minGap?: number;
  tolerance?: number;
}

/** Visibilité minimale d'un point (utile pour exiger qu'on voie tel membre). */
export interface VisibilityConstraint extends ConstraintBase {
  type: 'visible';
  point: PointRef;
  /** Seuil minimum (0..1). Défaut: 0.5. */
  min?: number;
}

export type Constraint =
  | JointAngleConstraint
  | SegmentAngleConstraint
  | DistanceConstraint
  | AboveConstraint
  | HorizontalOrderConstraint
  | VisibilityConstraint;

export type View = 'front' | 'back' | 'side-left' | 'side-right' | 'any';

export interface PostureSpec {
  id: string;
  name: string;
  category?: string;
  description?: string;
  view?: View;
  /** Seuil de réussite global (0..1). Défaut: 0.75. */
  passThreshold?: number;
  constraints: Constraint[];
}

/** Résultat d'évaluation d'une contrainte. */
export interface ConstraintResult {
  type: Constraint['type'];
  label: string;
  hint?: string;
  weight: number;
  score: number; // 0..1
  measured?: number;
  target?: number;
  tolerance?: number;
  passed: boolean;
  reason?: string;
}

export interface PostureReport {
  specId: string;
  specName: string;
  /** Score global pondéré (0..1). */
  score: number;
  passed: boolean;
  passThreshold: number;
  results: ConstraintResult[];
  /** Suggestions consolidées. */
  suggestions: string[];
}
