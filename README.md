# Move Analyze — Taekwondo Posture Checker

Application web qui analyse une posture (photo, vidéo ou webcam) et la compare à des **specs** déclaratives via [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker).

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Modes d'analyse

- **Webcam** — temps réel.
- **Image** — une photo (.jpg, .png, .webp…). Idéal pour vérifier une posture statique.
- **Vidéo** — un fichier .mp4 / .webm. La pose est analysée à chaque image.

## Système de specs

Chaque posture est décrite par une **`PostureSpec`** : un identifiant, un nom, des métadonnées et un tableau de **contraintes**. Chaque contrainte produit un score 0..1 ; le score global est la moyenne pondérée.

### Contraintes disponibles

| Type            | Description                                                                                                        |
|-----------------|--------------------------------------------------------------------------------------------------------------------|
| `jointAngle`    | Angle articulaire au sommet `vertex` formé par `vertex→a` et `vertex→b` (ex. genou, coude). Cible en degrés.       |
| `segmentAngle`  | Angle d'un segment par rapport à l'horizontale (`0°`=droite, `90°`=haut). Utile pour mesurer un tronc vertical.    |
| `distance`      | Distance entre deux points, normalisée par `shoulderWidth`, `hipWidth`, `torsoHeight` ou `bodyScale`.              |
| `above`         | Le point `a` doit être au-dessus du point `b` à l'image (avec un éventuel `minGap`).                               |
| `leftOf`/`rightOf` | Ordonnancement horizontal entre deux points.                                                                    |
| `visible`       | Visibilité minimum (renvoyée par MediaPipe) d'un point — utile pour exiger qu'on voie tel membre.                 |

### Référence à un point (`PointRef`)

- `lm('LEFT_KNEE')` — un landmark MediaPipe.
- `mid(lm('LEFT_HIP'), lm('RIGHT_HIP'))` — le milieu de deux points (composable récursivement).

### Exemple

```ts
import { lm, mid } from './specs/types';
import type { PostureSpec } from './specs/types';

export const apKubiLeft: PostureSpec = {
  id: 'ap_kubi_left_front',
  name: 'Ap Kubi — pied gauche devant',
  view: 'any',
  passThreshold: 0.7,
  constraints: [
    {
      type: 'jointAngle',
      a: lm('LEFT_HIP'), vertex: lm('LEFT_KNEE'), b: lm('LEFT_ANKLE'),
      target: 110, tolerance: 25, weight: 1.5,
      label: 'Genou avant fléchi',
      hint: 'Fléchis bien le genou avant.',
    },
    {
      type: 'jointAngle',
      a: lm('RIGHT_HIP'), vertex: lm('RIGHT_KNEE'), b: lm('RIGHT_ANKLE'),
      target: 175, tolerance: 15, weight: 1.5,
      label: 'Jambe arrière tendue',
    },
    {
      type: 'segmentAngle',
      from: mid(lm('LEFT_HIP'), lm('RIGHT_HIP')),
      to: mid(lm('LEFT_SHOULDER'), lm('RIGHT_SHOULDER')),
      target: 90, tolerance: 20, weight: 1,
      label: 'Tronc vertical',
    },
  ],
};
```

### Postures fournies

- **Charyeot Seogi** (차렷서기) — position d'attention
- **Joonbi Seogi** (준비서기) — position de prêt
- **Garde de combat**
- **Ap Kubi** (앞굽이) — position longue (gauche/droite)
- **Dwit Kubi** (뒷굽이) — position arrière (gauche/droite)
- **Ap Chagi** (앞차기) — coup de pied frontal (gauche/droite)

Pour ajouter une posture, édite `src/specs/library.ts` ou clique sur **Export spec** pour récupérer le JSON d'une posture existante et la modifier.

## Structure

```
src/
  pose/
    landmarks.ts      # 33 landmarks MediaPipe + connexions du squelette
    geometry.ts       # angles, distances, échelles corporelles
    detector.ts       # init MediaPipe (modes IMAGE et VIDEO)
  specs/
    types.ts          # types des contraintes et specs (DSL)
    evaluator.ts      # évalue une pose vs une spec → rapport
    library.ts        # postures de Taekwondo prédéfinies
  ui/
    overlay.ts        # rendu landmarks/squelette sur canvas
    report.ts         # rapport HTML détaillé
  styles.css
  main.ts             # entrée + gestion sources (webcam/image/vidéo)
```

## Notes techniques

- Les coordonnées MediaPipe sont normalisées dans `[0, 1]` (l'origine est en haut-gauche, `y` croît vers le bas).
- L'angle d'un segment est exprimé avec l'axe `y` inversé pour rester intuitif (`+90°` = vers le haut de l'image).
- Le scoring est linéaire : `score = max(0, 1 - |Δ| / tolerance)`. Une contrainte est considérée "passée" à partir de `score ≥ 0.6`.
- Le seuil de validation global par défaut est `0.75` (configurable par spec via `passThreshold`).
