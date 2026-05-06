// Définitions des poomse: séquences ordonnées de postures cibles.
// Chaque PoomseStep réutilise les builders de techniques.ts.

import {
  apChagiChamber,
  apKubi,
  apSeogi,
  araeMakgi,
  eolgulMakgi,
  momtongAnMakgi,
  momtongJirugi,
} from './techniques';
import type { Constraint, PostureSpec } from './types';

export interface PoomseStep {
  /** Numéro du mouvement (commence à 1). */
  index: number;
  /** Description du mouvement (déplacement + technique). */
  description: string;
  /** Direction du sujet (face, gauche, droite, arrière) à titre indicatif. */
  facing?: 'N' | 'E' | 'S' | 'W';
  /** Spec auto-générée (id, name, constraints…) à valider lorsque le pratiquant
   *  est en position finale du mouvement. */
  spec: PostureSpec;
}

export interface PoomseSpec {
  id: string;
  name: string;
  description?: string;
  /** Représentation du tracé (utile pour un pictogramme). */
  pattern?: string;
  steps: PoomseStep[];
}

/** Helper interne pour générer le PostureSpec d'une étape. */
function step(
  poomseId: string,
  index: number,
  description: string,
  shortName: string,
  constraints: Constraint[],
  opts: { facing?: PoomseStep['facing']; passThreshold?: number } = {},
): PoomseStep {
  return {
    index,
    description,
    facing: opts.facing,
    spec: {
      id: `${poomseId}_step_${String(index).padStart(2, '0')}`,
      name: `${index}. ${shortName}`,
      category: poomseId,
      view: 'any',
      passThreshold: opts.passThreshold ?? 0.7,
      description,
      constraints,
    },
  };
}

// ─── Taegeuk Il Jang (태극 1장) ───────────────────────────────────────────────
// 18 mouvements, tracé en forme du trigramme ☰ (Keon, le ciel).
const id = 'taegeuk_il_jang';

export const TAEGEUK_IL_JANG: PoomseSpec = {
  id,
  name: 'Taegeuk Il Jang (태극 1장)',
  pattern: '☰ Keon',
  description:
    'Premier poomse Taegeuk (WT/Kukkiwon). Tracé en forme du trigramme ☰ (le ciel). 18 mouvements, kihap au n°18.',
  steps: [
    step(id, 1, 'Tourner 90° à gauche, ap-seogi gauche, arae makgi gauche.',
      'Ap-seogi G + Arae makgi G',
      [...apSeogi('LEFT'), ...araeMakgi('LEFT')], { facing: 'W' }),

    step(id, 2, 'Avancer le pied droit, ap-seogi droit, momtong baro jirugi droit.',
      'Ap-seogi D + Jirugi D',
      [...apSeogi('RIGHT'), ...momtongJirugi('RIGHT')], { facing: 'W' }),

    step(id, 3, 'Pivoter 180° à droite, ap-seogi droit, arae makgi droit.',
      'Ap-seogi D + Arae makgi D',
      [...apSeogi('RIGHT'), ...araeMakgi('RIGHT')], { facing: 'E' }),

    step(id, 4, 'Avancer le pied gauche, ap-seogi gauche, momtong baro jirugi gauche.',
      'Ap-seogi G + Jirugi G',
      [...apSeogi('LEFT'), ...momtongJirugi('LEFT')], { facing: 'E' }),

    step(id, 5, 'Pivoter 90° à gauche, ap-kubi gauche, arae makgi gauche.',
      'Ap-kubi G + Arae makgi G',
      [...apKubi('LEFT'), ...araeMakgi('LEFT')], { facing: 'N' }),

    step(id, 6, 'Avancer le pied droit, ap-kubi droit, momtong baro jirugi droit.',
      'Ap-kubi D + Jirugi D',
      [...apKubi('RIGHT'), ...momtongJirugi('RIGHT')], { facing: 'N' }),

    step(id, 7, 'Pivoter 90° à droite, ap-seogi droit, momtong an makgi gauche.',
      'Ap-seogi D + An makgi G',
      [...apSeogi('RIGHT'), ...momtongAnMakgi('LEFT')], { facing: 'E' }),

    step(id, 8, 'Avancer le pied gauche, ap-seogi gauche, momtong baro jirugi droit.',
      'Ap-seogi G + Jirugi D',
      [...apSeogi('LEFT'), ...momtongJirugi('RIGHT')], { facing: 'E' }),

    step(id, 9, 'Pivoter 180° à gauche, ap-seogi gauche, momtong an makgi droit.',
      'Ap-seogi G + An makgi D',
      [...apSeogi('LEFT'), ...momtongAnMakgi('RIGHT')], { facing: 'W' }),

    step(id, 10, 'Avancer le pied droit, ap-seogi droit, momtong baro jirugi gauche.',
      'Ap-seogi D + Jirugi G',
      [...apSeogi('RIGHT'), ...momtongJirugi('LEFT')], { facing: 'W' }),

    step(id, 11, 'Pivoter 90° à droite, ap-kubi droit, arae makgi droit.',
      'Ap-kubi D + Arae makgi D',
      [...apKubi('RIGHT'), ...araeMakgi('RIGHT')], { facing: 'N' }),

    step(id, 12, 'Avancer le pied gauche, ap-kubi gauche, momtong baro jirugi gauche.',
      'Ap-kubi G + Jirugi G',
      [...apKubi('LEFT'), ...momtongJirugi('LEFT')], { facing: 'N' }),

    step(id, 13, 'Pivoter 90° à gauche, ap-seogi gauche, eolgul makgi gauche.',
      'Ap-seogi G + Eolgul makgi G',
      [...apSeogi('LEFT'), ...eolgulMakgi('LEFT')], { facing: 'W' }),

    step(id, 14, 'Ap-chagi droit (chambré: genou levé) — avant la frappe.',
      'Ap-chagi D — chambré',
      [...apChagiChamber('RIGHT')], { facing: 'W', passThreshold: 0.6 }),

    step(id, 15, 'Pivoter 180° à droite, ap-seogi droit, eolgul makgi droit.',
      'Ap-seogi D + Eolgul makgi D',
      [...apSeogi('RIGHT'), ...eolgulMakgi('RIGHT')], { facing: 'E' }),

    step(id, 16, 'Ap-chagi gauche (chambré: genou levé) — avant la frappe.',
      'Ap-chagi G — chambré',
      [...apChagiChamber('LEFT')], { facing: 'E', passThreshold: 0.6 }),

    step(id, 17, 'Pivoter 90° à gauche, ap-kubi gauche, arae makgi gauche.',
      'Ap-kubi G + Arae makgi G',
      [...apKubi('LEFT'), ...araeMakgi('LEFT')], { facing: 'S' }),

    step(id, 18, 'Avancer le pied droit, ap-kubi droit, momtong baro jirugi droit — KIHAP!',
      'Ap-kubi D + Jirugi D — KIHAP!',
      [...apKubi('RIGHT'), ...momtongJirugi('RIGHT')], { facing: 'S' }),
  ],
};

// ─── Registre ────────────────────────────────────────────────────────────────
export const POOMSE_LIBRARY: PoomseSpec[] = [TAEGEUK_IL_JANG];

export function findPoomse(id: string): PoomseSpec | undefined {
  return POOMSE_LIBRARY.find((p) => p.id === id);
}

/** Aplatit toutes les étapes de tous les poomse en PostureSpec[]. */
export function allPoomseSpecs(): PostureSpec[] {
  return POOMSE_LIBRARY.flatMap((p) => p.steps.map((s) => s.spec));
}
