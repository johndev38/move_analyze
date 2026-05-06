import type { Constraint, PostureSpec } from './types';
import { lm, mid } from './types';

/**
 * Bibliothèque de specs de postures de Taekwondo (ITF/WT mélangés).
 *
 * Convention angles (jointAngle):
 *   - 180° = membre tendu
 *   - 90°  = angle droit
 *   - 0°   = membre totalement replié
 *
 * Convention segmentAngle:
 *   -   0° = horizontal vers la droite de l'image
 *   -  90° = vers le haut de l'image
 *   - -90° = vers le bas
 *   - 180/-180° = horizontal vers la gauche
 */

// ─── Charyeot Seogi (차렷서기) — position d'attention ────────────────────────
const CHARYEOT: PostureSpec = {
  id: 'charyeot_seogi',
  name: 'Charyeot Seogi (차렷서기)',
  category: 'Position de base',
  view: 'front',
  description: 'Position d\'attention. Talons joints, bras le long du corps, regard droit.',
  passThreshold: 0.75,
  constraints: [
    {
      type: 'jointAngle',
      a: lm('LEFT_SHOULDER'), vertex: lm('LEFT_ELBOW'), b: lm('LEFT_WRIST'),
      target: 175, tolerance: 25, weight: 1,
      label: 'Bras gauche tendu',
      hint: 'Tends ton bras gauche le long du corps.',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_SHOULDER'), vertex: lm('RIGHT_ELBOW'), b: lm('RIGHT_WRIST'),
      target: 175, tolerance: 25, weight: 1,
      label: 'Bras droit tendu',
      hint: 'Tends ton bras droit le long du corps.',
    },
    {
      type: 'jointAngle',
      a: lm('LEFT_HIP'), vertex: lm('LEFT_KNEE'), b: lm('LEFT_ANKLE'),
      target: 178, tolerance: 15, weight: 1.2,
      label: 'Jambe gauche tendue',
      hint: 'Garde ta jambe gauche bien droite.',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_HIP'), vertex: lm('RIGHT_KNEE'), b: lm('RIGHT_ANKLE'),
      target: 178, tolerance: 15, weight: 1.2,
      label: 'Jambe droite tendue',
      hint: 'Garde ta jambe droite bien droite.',
    },
    {
      type: 'distance',
      a: lm('LEFT_ANKLE'), b: lm('RIGHT_ANKLE'),
      normalize: 'shoulderWidth',
      target: 0.2, tolerance: 0.4, weight: 0.8,
      label: 'Talons rapprochés',
      hint: 'Rapproche tes talons.',
    },
    {
      type: 'segmentAngle',
      from: mid(lm('LEFT_HIP'), lm('RIGHT_HIP')),
      to: mid(lm('LEFT_SHOULDER'), lm('RIGHT_SHOULDER')),
      target: 90, tolerance: 15, weight: 1,
      label: 'Tronc vertical',
      hint: 'Redresse-toi, le tronc doit être bien vertical.',
    },
  ],
};

// ─── Joonbi Seogi (준비서기) — position de prêt ──────────────────────────────
const JOONBI: PostureSpec = {
  id: 'joonbi_seogi',
  name: 'Joonbi Seogi (준비서기)',
  category: 'Position de base',
  view: 'front',
  description: 'Position de prêt. Pieds écartés largeur d\'épaules, poings devant le ventre.',
  passThreshold: 0.75,
  constraints: [
    {
      type: 'distance',
      a: lm('LEFT_ANKLE'), b: lm('RIGHT_ANKLE'),
      normalize: 'shoulderWidth',
      target: 1.0, tolerance: 0.4, weight: 1.2,
      label: 'Écart des pieds',
      hint: 'Écarte les pieds à largeur d\'épaules.',
    },
    {
      type: 'jointAngle',
      a: lm('LEFT_SHOULDER'), vertex: lm('LEFT_ELBOW'), b: lm('LEFT_WRIST'),
      target: 120, tolerance: 30, weight: 1,
      label: 'Coude gauche fléchi',
      hint: 'Fléchis le coude gauche, poing devant le nombril.',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_SHOULDER'), vertex: lm('RIGHT_ELBOW'), b: lm('RIGHT_WRIST'),
      target: 120, tolerance: 30, weight: 1,
      label: 'Coude droit fléchi',
      hint: 'Fléchis le coude droit, poing devant le nombril.',
    },
    {
      type: 'above',
      a: lm('LEFT_WRIST'), b: lm('LEFT_HIP'),
      minGap: -0.1, tolerance: 0.4, weight: 0.8,
      label: 'Poignet gauche à hauteur de ceinture',
      hint: 'Place le poing gauche à hauteur du nombril.',
    },
    {
      type: 'above',
      a: lm('RIGHT_WRIST'), b: lm('RIGHT_HIP'),
      minGap: -0.1, tolerance: 0.4, weight: 0.8,
      label: 'Poignet droit à hauteur de ceinture',
      hint: 'Place le poing droit à hauteur du nombril.',
    },
    {
      type: 'jointAngle',
      a: lm('LEFT_HIP'), vertex: lm('LEFT_KNEE'), b: lm('LEFT_ANKLE'),
      target: 175, tolerance: 20, weight: 0.8,
      label: 'Jambe gauche tendue',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_HIP'), vertex: lm('RIGHT_KNEE'), b: lm('RIGHT_ANKLE'),
      target: 175, tolerance: 20, weight: 0.8,
      label: 'Jambe droite tendue',
    },
  ],
};

// ─── Ap Kubi (앞굽이) — position longue, jambe avant fléchie ─────────────────
function makeApKubi(front: 'LEFT' | 'RIGHT'): PostureSpec {
  const back = front === 'LEFT' ? 'RIGHT' : 'LEFT';
  const constraints: Constraint[] = [
    {
      type: 'jointAngle',
      a: lm(`${front}_HIP` as const),
      vertex: lm(`${front}_KNEE` as const),
      b: lm(`${front}_ANKLE` as const),
      target: 110, tolerance: 25, weight: 1.5,
      label: `Genou ${front === 'LEFT' ? 'gauche' : 'droit'} fléchi (avant)`,
      hint: 'Fléchis bien le genou avant — la cuisse doit aller vers l\'horizontale.',
    },
    {
      type: 'jointAngle',
      a: lm(`${back}_HIP` as const),
      vertex: lm(`${back}_KNEE` as const),
      b: lm(`${back}_ANKLE` as const),
      target: 175, tolerance: 15, weight: 1.5,
      label: `Jambe ${back === 'LEFT' ? 'gauche' : 'droite'} tendue (arrière)`,
      hint: 'Tends complètement la jambe arrière.',
    },
    {
      type: 'distance',
      a: lm(`${front}_ANKLE` as const),
      b: lm(`${back}_ANKLE` as const),
      normalize: 'shoulderWidth',
      target: 2.5, tolerance: 1.0, weight: 1,
      label: 'Écart entre les pieds',
      hint: 'Allonge la position: ~2 longueurs de pied entre les chevilles.',
    },
    {
      type: 'segmentAngle',
      from: mid(lm('LEFT_HIP'), lm('RIGHT_HIP')),
      to: mid(lm('LEFT_SHOULDER'), lm('RIGHT_SHOULDER')),
      target: 90, tolerance: 20, weight: 1,
      label: 'Tronc vertical',
      hint: 'Garde le buste droit, ne te penche pas en avant.',
    },
    // Genou avant approximativement au-dessus de la cheville avant (ne pas dépasser)
    {
      type: 'above',
      a: lm(`${front}_KNEE` as const),
      b: lm(`${front}_ANKLE` as const),
      minGap: 0.1, tolerance: 0.3, weight: 0.6,
      label: 'Genou avant aligné',
      hint: 'Le genou avant doit rester à l\'aplomb de la cheville.',
    },
  ];
  return {
    id: `ap_kubi_${front.toLowerCase()}_front`,
    name: `Ap Kubi (앞굽이) — pied ${front === 'LEFT' ? 'gauche' : 'droit'} devant`,
    category: 'Position de combat',
    view: 'any',
    description:
      'Position longue: jambe avant fléchie, jambe arrière tendue, ~70% du poids sur l\'avant.',
    passThreshold: 0.7,
    constraints,
  };
}

// ─── Dwit Kubi (뒷굽이) — position arrière ───────────────────────────────────
function makeDwitKubi(front: 'LEFT' | 'RIGHT'): PostureSpec {
  const back = front === 'LEFT' ? 'RIGHT' : 'LEFT';
  return {
    id: `dwit_kubi_${front.toLowerCase()}_front`,
    name: `Dwit Kubi (뒷굽이) — pied ${front === 'LEFT' ? 'gauche' : 'droit'} devant`,
    category: 'Position de combat',
    view: 'any',
    description: 'Position arrière: ~70% du poids sur la jambe arrière, qui est très fléchie.',
    passThreshold: 0.7,
    constraints: [
      {
        type: 'jointAngle',
        a: lm(`${back}_HIP` as const),
        vertex: lm(`${back}_KNEE` as const),
        b: lm(`${back}_ANKLE` as const),
        target: 110, tolerance: 25, weight: 1.5,
        label: 'Genou arrière très fléchi',
        hint: 'Plie davantage le genou arrière (~110°).',
      },
      {
        type: 'jointAngle',
        a: lm(`${front}_HIP` as const),
        vertex: lm(`${front}_KNEE` as const),
        b: lm(`${front}_ANKLE` as const),
        target: 155, tolerance: 25, weight: 1,
        label: 'Genou avant légèrement fléchi',
        hint: 'Fléchis légèrement le genou avant.',
      },
      {
        type: 'segmentAngle',
        from: mid(lm('LEFT_HIP'), lm('RIGHT_HIP')),
        to: mid(lm('LEFT_SHOULDER'), lm('RIGHT_SHOULDER')),
        target: 90, tolerance: 20, weight: 1,
        label: 'Tronc vertical',
        hint: 'Garde le buste vertical.',
      },
      {
        type: 'distance',
        a: lm(`${front}_ANKLE` as const),
        b: lm(`${back}_ANKLE` as const),
        normalize: 'shoulderWidth',
        target: 1.5, tolerance: 0.7, weight: 0.8,
        label: 'Écart entre les pieds',
      },
    ],
  };
}

// ─── Ap Chagi (앞차기) — coup de pied frontal, jambe levée ──────────────────
function makeApChagi(kicking: 'LEFT' | 'RIGHT'): PostureSpec {
  const stance = kicking === 'LEFT' ? 'RIGHT' : 'LEFT';
  return {
    id: `ap_chagi_${kicking.toLowerCase()}`,
    name: `Ap Chagi (앞차기) — jambe ${kicking === 'LEFT' ? 'gauche' : 'droite'}`,
    category: 'Coup de pied',
    view: 'any',
    description: 'Coup de pied frontal: genou levé puis jambe étendue vers la cible.',
    passThreshold: 0.65,
    constraints: [
      {
        type: 'above',
        a: lm(`${kicking}_KNEE` as const),
        b: lm(`${kicking}_HIP` as const),
        minGap: -0.1, tolerance: 0.3, weight: 1.5,
        label: 'Genou levé',
        hint: 'Lève davantage le genou (au moins à hauteur de hanche).',
      },
      {
        type: 'above',
        a: lm(`${kicking}_ANKLE` as const),
        b: lm(`${kicking}_KNEE` as const),
        minGap: -0.2, tolerance: 0.4, weight: 1.2,
        label: 'Pied projeté',
        hint: 'Projette le pied vers l\'avant/le haut, cheville à hauteur du genou.',
      },
      {
        type: 'jointAngle',
        a: lm(`${stance}_HIP` as const),
        vertex: lm(`${stance}_KNEE` as const),
        b: lm(`${stance}_ANKLE` as const),
        target: 165, tolerance: 25, weight: 0.8,
        label: 'Jambe d\'appui solide',
        hint: 'Garde la jambe d\'appui légèrement fléchie mais stable.',
      },
      {
        type: 'segmentAngle',
        from: mid(lm('LEFT_HIP'), lm('RIGHT_HIP')),
        to: mid(lm('LEFT_SHOULDER'), lm('RIGHT_SHOULDER')),
        target: 90, tolerance: 25, weight: 0.8,
        label: 'Tronc droit',
        hint: 'Évite de te pencher en arrière.',
      },
    ],
  };
}

// ─── Garde de combat ──────────────────────────────────────────────────────────
const GARDE: PostureSpec = {
  id: 'garde_combat',
  name: 'Garde de combat',
  category: 'Position de combat',
  view: 'any',
  description: 'Position de garde: jambes fléchies, poings au visage, coudes près du corps.',
  passThreshold: 0.7,
  constraints: [
    {
      type: 'jointAngle',
      a: lm('LEFT_HIP'), vertex: lm('LEFT_KNEE'), b: lm('LEFT_ANKLE'),
      target: 160, tolerance: 25, weight: 1,
      label: 'Jambe gauche fléchie',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_HIP'), vertex: lm('RIGHT_KNEE'), b: lm('RIGHT_ANKLE'),
      target: 160, tolerance: 25, weight: 1,
      label: 'Jambe droite fléchie',
    },
    {
      type: 'above',
      a: lm('LEFT_WRIST'), b: lm('LEFT_SHOULDER'),
      minGap: -0.3, tolerance: 0.3, weight: 1.2,
      label: 'Poing gauche haut',
      hint: 'Lève les poings au niveau du visage pour protéger.',
    },
    {
      type: 'above',
      a: lm('RIGHT_WRIST'), b: lm('RIGHT_SHOULDER'),
      minGap: -0.3, tolerance: 0.3, weight: 1.2,
      label: 'Poing droit haut',
      hint: 'Lève les poings au niveau du visage pour protéger.',
    },
    {
      type: 'jointAngle',
      a: lm('LEFT_SHOULDER'), vertex: lm('LEFT_ELBOW'), b: lm('LEFT_WRIST'),
      target: 80, tolerance: 30, weight: 0.8,
      label: 'Coude gauche fermé',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_SHOULDER'), vertex: lm('RIGHT_ELBOW'), b: lm('RIGHT_WRIST'),
      target: 80, tolerance: 30, weight: 0.8,
      label: 'Coude droit fermé',
    },
  ],
};

export const SPEC_LIBRARY: PostureSpec[] = [
  CHARYEOT,
  JOONBI,
  GARDE,
  makeApKubi('LEFT'),
  makeApKubi('RIGHT'),
  makeDwitKubi('LEFT'),
  makeDwitKubi('RIGHT'),
  makeApChagi('LEFT'),
  makeApChagi('RIGHT'),
];

export function findSpec(id: string): PostureSpec | undefined {
  return SPEC_LIBRARY.find((s) => s.id === id);
}
