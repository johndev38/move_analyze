// Builders de contraintes réutilisables: stances, blocages, frappes.
// Permet de composer une posture de poomse en assemblant stance + technique.

import { lm, mid, type Constraint } from './types';

type Side = 'LEFT' | 'RIGHT';
const other = (s: Side): Side => (s === 'LEFT' ? 'RIGHT' : 'LEFT');
const fr = (s: Side): string => (s === 'LEFT' ? 'gauche' : 'droit');

// ─── Bras chambré au flanc (poing près de la hanche, opposé) ─────────────────
export function chambered(side: Side, weight = 0.6): Constraint[] {
  return [
    {
      type: 'distance',
      a: lm(`${side}_WRIST` as const),
      b: lm(`${side}_HIP` as const),
      normalize: 'shoulderWidth',
      target: 0.3, tolerance: 0.5, weight,
      label: `Poing ${fr(side)} chambré`,
      hint: 'Garde le poing chambré au flanc, près de la hanche.',
    },
  ];
}

// ─── Tronc vertical ──────────────────────────────────────────────────────────
function trunkVertical(weight = 0.8): Constraint[] {
  return [
    {
      type: 'segmentAngle',
      from: mid(lm('LEFT_HIP'), lm('RIGHT_HIP')),
      to: mid(lm('LEFT_SHOULDER'), lm('RIGHT_SHOULDER')),
      target: 90, tolerance: 20, weight,
      label: 'Tronc vertical',
      hint: 'Garde le buste droit.',
    },
  ];
}

// ─── Stances ─────────────────────────────────────────────────────────────────
/** Ap-seogi (앞서기) — position courte: un pied devant, jambes peu fléchies. */
export function apSeogi(front: Side): Constraint[] {
  const back = other(front);
  return [
    {
      type: 'jointAngle',
      a: lm(`${front}_HIP` as const),
      vertex: lm(`${front}_KNEE` as const),
      b: lm(`${front}_ANKLE` as const),
      target: 165, tolerance: 20, weight: 0.8,
      label: `Genou ${fr(front)} (avant) peu fléchi`,
    },
    {
      type: 'jointAngle',
      a: lm(`${back}_HIP` as const),
      vertex: lm(`${back}_KNEE` as const),
      b: lm(`${back}_ANKLE` as const),
      target: 170, tolerance: 20, weight: 0.8,
      label: `Genou ${fr(back)} (arrière) presque tendu`,
    },
    {
      type: 'distance',
      a: lm('LEFT_ANKLE'), b: lm('RIGHT_ANKLE'),
      normalize: 'shoulderWidth',
      target: 1.2, tolerance: 0.7, weight: 0.7,
      label: 'Écart pieds (ap-seogi)',
      hint: 'Position courte: ~1 longueur de pied entre les chevilles.',
    },
    ...trunkVertical(),
  ];
}

/** Ap-kubi (앞굽이) — position longue: avant fléchi, arrière tendu. */
export function apKubi(front: Side): Constraint[] {
  const back = other(front);
  return [
    {
      type: 'jointAngle',
      a: lm(`${front}_HIP` as const),
      vertex: lm(`${front}_KNEE` as const),
      b: lm(`${front}_ANKLE` as const),
      target: 110, tolerance: 25, weight: 1.5,
      label: `Genou ${fr(front)} fléchi (ap-kubi avant)`,
      hint: 'Fléchis bien le genou avant.',
    },
    {
      type: 'jointAngle',
      a: lm(`${back}_HIP` as const),
      vertex: lm(`${back}_KNEE` as const),
      b: lm(`${back}_ANKLE` as const),
      target: 175, tolerance: 15, weight: 1.5,
      label: `Jambe ${fr(back)} tendue (ap-kubi arrière)`,
    },
    {
      type: 'distance',
      a: lm('LEFT_ANKLE'), b: lm('RIGHT_ANKLE'),
      normalize: 'shoulderWidth',
      target: 2.5, tolerance: 1.0, weight: 0.8,
      label: 'Position longue',
    },
    ...trunkVertical(),
  ];
}

// ─── Techniques de bras ──────────────────────────────────────────────────────
/** Arae makgi (아래막기) — blocage bas avec le bras `arm`. */
export function araeMakgi(arm: Side): Constraint[] {
  return [
    {
      type: 'jointAngle',
      a: lm(`${arm}_SHOULDER` as const),
      vertex: lm(`${arm}_ELBOW` as const),
      b: lm(`${arm}_WRIST` as const),
      target: 165, tolerance: 25, weight: 1,
      label: `Bras ${fr(arm)} en blocage bas`,
      hint: 'Bras quasi tendu, légèrement fléchi vers la cuisse.',
    },
    // Le poignet doit être plus bas que la hanche (devant la cuisse).
    {
      type: 'above',
      a: lm(`${arm}_HIP` as const),
      b: lm(`${arm}_WRIST` as const),
      minGap: -0.05, tolerance: 0.4, weight: 1.2,
      label: 'Poing du blocage en bas',
      hint: 'Le poing descend au niveau de la cuisse, sous la ligne de hanche.',
    },
    ...chambered(other(arm), 0.8),
  ];
}

/** Momtong baro jirugi (몸통바로지르기) — coup de poing direct au plexus. */
export function momtongJirugi(arm: Side): Constraint[] {
  return [
    {
      type: 'jointAngle',
      a: lm(`${arm}_SHOULDER` as const),
      vertex: lm(`${arm}_ELBOW` as const),
      b: lm(`${arm}_WRIST` as const),
      target: 175, tolerance: 15, weight: 1.4,
      label: `Bras ${fr(arm)} étendu (jirugi)`,
      hint: 'Bras tendu en projection vers l\'avant.',
    },
    // Poing à hauteur du plexus (entre épaule et hanche).
    {
      type: 'above',
      a: lm(`${arm}_WRIST` as const),
      b: mid(lm(`${arm}_HIP` as const), lm(`${arm}_SHOULDER` as const)),
      minGap: -0.05, tolerance: 0.3, weight: 1.0,
      label: 'Hauteur du poing (plexus)',
      hint: 'Le poing doit viser le plexus solaire, pas trop haut ni trop bas.',
    },
    {
      type: 'above',
      a: lm(`${arm}_SHOULDER` as const),
      b: lm(`${arm}_WRIST` as const),
      minGap: -0.05, tolerance: 0.3, weight: 0.8,
      label: 'Poing pas plus haut que l\'épaule',
    },
    ...chambered(other(arm), 0.8),
  ];
}

/** Eolgul makgi (얼굴막기) — blocage haut avec le bras `arm`. */
export function eolgulMakgi(arm: Side): Constraint[] {
  return [
    {
      type: 'above',
      a: lm(`${arm}_WRIST` as const),
      b: lm('NOSE'),
      minGap: -0.05, tolerance: 0.3, weight: 1.4,
      label: 'Poignet au-dessus du visage',
      hint: 'Le bras de blocage passe au-dessus de la tête.',
    },
    {
      type: 'jointAngle',
      a: lm(`${arm}_SHOULDER` as const),
      vertex: lm(`${arm}_ELBOW` as const),
      b: lm(`${arm}_WRIST` as const),
      target: 120, tolerance: 30, weight: 1,
      label: `Coude ${fr(arm)} fléchi (eolgul makgi)`,
    },
    ...chambered(other(arm), 0.8),
  ];
}

/** Momtong an makgi (몸통안막기) — blocage moyen vers l'intérieur. */
export function momtongAnMakgi(arm: Side): Constraint[] {
  return [
    {
      type: 'jointAngle',
      a: lm(`${arm}_SHOULDER` as const),
      vertex: lm(`${arm}_ELBOW` as const),
      b: lm(`${arm}_WRIST` as const),
      target: 90, tolerance: 25, weight: 1.2,
      label: `Coude ${fr(arm)} à 90° (an makgi)`,
      hint: 'Avant-bras vertical, fermeture vers l\'intérieur.',
    },
    {
      type: 'above',
      a: lm(`${arm}_WRIST` as const),
      b: lm(`${arm}_HIP` as const),
      minGap: 0, tolerance: 0.3, weight: 1.0,
      label: 'Poing au-dessus de la hanche',
    },
    {
      type: 'above',
      a: lm(`${arm}_SHOULDER` as const),
      b: lm(`${arm}_WRIST` as const),
      minGap: -0.05, tolerance: 0.3, weight: 0.8,
      label: 'Poing pas plus haut que l\'épaule',
    },
    ...chambered(other(arm), 0.8),
  ];
}

/** Ap chagi (앞차기) — chambré: genou levé, jambe d'appui stable. */
export function apChagiChamber(kicking: Side): Constraint[] {
  const stance = other(kicking);
  return [
    {
      type: 'above',
      a: lm(`${kicking}_KNEE` as const),
      b: lm(`${kicking}_HIP` as const),
      minGap: -0.1, tolerance: 0.3, weight: 1.5,
      label: `Genou ${fr(kicking)} levé (chambré ap-chagi)`,
      hint: 'Lève le genou au moins à hauteur de hanche.',
    },
    {
      type: 'jointAngle',
      a: lm(`${stance}_HIP` as const),
      vertex: lm(`${stance}_KNEE` as const),
      b: lm(`${stance}_ANKLE` as const),
      target: 165, tolerance: 25, weight: 0.8,
      label: 'Jambe d\'appui solide',
    },
    ...trunkVertical(0.6),
  ];
}
