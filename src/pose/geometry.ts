import type { Point, Pose } from './landmarks';
import { LM } from './landmarks';

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function midpoint(a: Point, b: Point): Point {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: a.z !== undefined && b.z !== undefined ? (a.z + b.z) / 2 : undefined,
    visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1),
  };
}

/**
 * Angle (en degrés, 0-180) au sommet `vertex` formé par les segments vertex->a et vertex->b.
 */
export function jointAngleDeg(a: Point, vertex: Point, b: Point): number {
  const v1x = a.x - vertex.x;
  const v1y = a.y - vertex.y;
  const v2x = b.x - vertex.x;
  const v2y = b.y - vertex.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return NaN;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Angle (en degrés) du segment `from -> to` par rapport à l'horizontale (axe X).
 * Renvoyé dans [-180, 180].
 *
 * Coordonnées d'image: y vers le bas.
 *  - 0°   => segment va vers la droite
 *  - 90°  => segment va vers le haut (y diminue) => on inverse le signe pour que +90° soit vers le haut
 *  - -90° => segment va vers le bas
 */
export function segmentAngleDeg(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return (Math.atan2(-dy, dx) * 180) / Math.PI;
}

/** Différence d'angles modulo 360 ramenée dans [-180, 180]. */
export function angleDelta(a: number, b: number): number {
  let d = (a - b + 540) % 360 - 180;
  if (d <= -180) d += 360;
  return d;
}

/** Largeur d'épaule en unités normalisées MediaPipe (utilisée comme échelle). */
export function shoulderWidth(pose: Pose): number {
  return distance(pose[LM.LEFT_SHOULDER], pose[LM.RIGHT_SHOULDER]);
}

export function hipWidth(pose: Pose): number {
  return distance(pose[LM.LEFT_HIP], pose[LM.RIGHT_HIP]);
}

export function torsoHeight(pose: Pose): number {
  const shoulderMid = midpoint(pose[LM.LEFT_SHOULDER], pose[LM.RIGHT_SHOULDER]);
  const hipMid = midpoint(pose[LM.LEFT_HIP], pose[LM.RIGHT_HIP]);
  return distance(shoulderMid, hipMid);
}

export function bodyScale(pose: Pose): number {
  // Échelle robuste: max(épaules, hanches, torse) — au cas où une mesure dégénère.
  return Math.max(shoulderWidth(pose), hipWidth(pose), torsoHeight(pose), 1e-6);
}
