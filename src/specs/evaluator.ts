import { LM, type Pose, type Point } from '../pose/landmarks';
import {
  bodyScale,
  distance,
  hipWidth,
  jointAngleDeg,
  midpoint,
  segmentAngleDeg,
  shoulderWidth,
  torsoHeight,
} from '../pose/geometry';
import type {
  Constraint,
  ConstraintResult,
  Normalize,
  PointRef,
  PostureReport,
  PostureSpec,
} from './types';

/** Résout un PointRef en Point réel à partir d'une pose. */
function resolvePoint(pose: Pose, ref: PointRef): Point {
  if (ref.kind === 'lm') {
    return pose[LM[ref.name]];
  }
  return midpoint(resolvePoint(pose, ref.a), resolvePoint(pose, ref.b));
}

function describePoint(ref: PointRef): string {
  if (ref.kind === 'lm') {
    return ref.name.toLowerCase().replace(/_/g, ' ');
  }
  return `milieu(${describePoint(ref.a)}, ${describePoint(ref.b)})`;
}

function normalizationValue(pose: Pose, kind: Normalize | undefined): number {
  switch (kind) {
    case 'shoulderWidth':
      return shoulderWidth(pose) || 1e-6;
    case 'hipWidth':
      return hipWidth(pose) || 1e-6;
    case 'torsoHeight':
      return torsoHeight(pose) || 1e-6;
    case 'bodyScale':
      return bodyScale(pose);
    case 'none':
    case undefined:
      return 1;
  }
}

/** Score linéaire [0..1] selon |delta| par rapport à la tolérance. */
function toleranceScore(delta: number, tolerance: number): number {
  if (tolerance <= 0) return delta === 0 ? 1 : 0;
  return Math.max(0, 1 - Math.abs(delta) / tolerance);
}

function passLevel(score: number): boolean {
  return score >= 0.6;
}

function evaluateConstraint(pose: Pose, c: Constraint): ConstraintResult {
  const weight = c.weight ?? 1;
  const baseLabel = c.label ?? c.type;

  switch (c.type) {
    case 'jointAngle': {
      const a = resolvePoint(pose, c.a);
      const v = resolvePoint(pose, c.vertex);
      const b = resolvePoint(pose, c.b);
      const measured = jointAngleDeg(a, v, b);
      if (Number.isNaN(measured)) {
        return {
          type: c.type, label: baseLabel, hint: c.hint, weight,
          score: 0, passed: false, reason: 'Points superposés ou non visibles',
        };
      }
      const delta = measured - c.target;
      const score = toleranceScore(delta, c.tolerance);
      const passed = passLevel(score);
      return {
        type: c.type,
        label: baseLabel,
        hint: c.hint,
        weight,
        score,
        measured,
        target: c.target,
        tolerance: c.tolerance,
        passed,
        reason: passed
          ? undefined
          : `Angle ${baseLabel}: ${measured.toFixed(0)}° vs ${c.target}° (±${c.tolerance}°)`,
      };
    }

    case 'segmentAngle': {
      const f = resolvePoint(pose, c.from);
      const t = resolvePoint(pose, c.to);
      let measured = segmentAngleDeg(f, t);
      let target = c.target;
      if (c.unsigned) {
        measured = Math.abs(measured);
        target = Math.abs(target);
      }
      // Ramener delta dans [-180, 180] pour gérer le wrap
      let delta = measured - target;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const score = toleranceScore(delta, c.tolerance);
      const passed = passLevel(score);
      return {
        type: c.type, label: baseLabel, hint: c.hint, weight,
        score, measured, target, tolerance: c.tolerance, passed,
        reason: passed ? undefined :
          `Inclinaison ${baseLabel}: ${measured.toFixed(0)}° vs ${target}°`,
      };
    }

    case 'distance': {
      const a = resolvePoint(pose, c.a);
      const b = resolvePoint(pose, c.b);
      const raw = distance(a, b);
      const norm = normalizationValue(pose, c.normalize);
      const measured = raw / norm;
      const delta = measured - c.target;
      const score = toleranceScore(delta, c.tolerance);
      const passed = passLevel(score);
      return {
        type: c.type, label: baseLabel, hint: c.hint, weight,
        score, measured, target: c.target, tolerance: c.tolerance, passed,
        reason: passed ? undefined :
          `Distance ${baseLabel}: ${measured.toFixed(2)} vs ${c.target.toFixed(2)} (${c.normalize ?? 'none'})`,
      };
    }

    case 'above': {
      const a = resolvePoint(pose, c.a);
      const b = resolvePoint(pose, c.b);
      const scale = bodyScale(pose);
      // Idéal: a.y + minGap*scale < b.y. Mesure du "déficit" en unités bodyScale.
      const minGap = c.minGap ?? 0;
      const deficit = (a.y + minGap * scale - b.y) / scale; // <0 => OK
      const tolerance = c.tolerance ?? 0.1;
      const score = deficit <= 0 ? 1 : Math.max(0, 1 - deficit / tolerance);
      const passed = passLevel(score);
      return {
        type: c.type, label: baseLabel, hint: c.hint, weight,
        score, passed,
        measured: -deficit,
        reason: passed ? undefined :
          `${describePoint(c.a)} doit être au-dessus de ${describePoint(c.b)}`,
      };
    }

    case 'leftOf':
    case 'rightOf': {
      const a = resolvePoint(pose, c.a);
      const b = resolvePoint(pose, c.b);
      const scale = bodyScale(pose);
      const minGap = c.minGap ?? 0;
      // leftOf: a.x + minGap < b.x (a à gauche)
      const deficit = c.type === 'leftOf'
        ? (a.x + minGap * scale - b.x) / scale
        : (b.x + minGap * scale - a.x) / scale;
      const tolerance = c.tolerance ?? 0.1;
      const score = deficit <= 0 ? 1 : Math.max(0, 1 - deficit / tolerance);
      const passed = passLevel(score);
      return {
        type: c.type, label: baseLabel, hint: c.hint, weight,
        score, passed,
        measured: -deficit,
        reason: passed ? undefined :
          `${describePoint(c.a)} doit être ${c.type === 'leftOf' ? 'à gauche de' : 'à droite de'} ${describePoint(c.b)}`,
      };
    }

    case 'visible': {
      const p = resolvePoint(pose, c.point);
      const v = p.visibility ?? 1;
      const min = c.min ?? 0.5;
      const score = Math.min(1, v / Math.max(1e-6, min));
      const passed = v >= min;
      return {
        type: c.type, label: baseLabel, hint: c.hint, weight,
        score: passed ? 1 : score,
        measured: v, target: min, passed,
        reason: passed ? undefined :
          `${describePoint(c.point)} pas suffisamment visible (${v.toFixed(2)} < ${min})`,
      };
    }
  }
}

export function evaluatePosture(pose: Pose, spec: PostureSpec): PostureReport {
  const results = spec.constraints.map((c) => evaluateConstraint(pose, c));
  const totalW = results.reduce((s, r) => s + r.weight, 0) || 1;
  const score = results.reduce((s, r) => s + r.score * r.weight, 0) / totalW;
  const passThreshold = spec.passThreshold ?? 0.75;
  const passed = score >= passThreshold;
  const suggestions = results
    .filter((r) => !r.passed)
    .map((r) => r.hint || r.reason || `${r.label}: à corriger`);
  return {
    specId: spec.id,
    specName: spec.name,
    score,
    passed,
    passThreshold,
    results,
    suggestions,
  };
}
