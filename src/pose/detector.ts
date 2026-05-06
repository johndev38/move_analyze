import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { Pose } from './landmarks';

// Les fichiers wasm sont copiés depuis node_modules vers public/mediapipe/wasm
// au moment de l'install (cf. script `postinstall` dans package.json).
// Servi à la racine par Vite.
const WASM_PATH = '/mediapipe/wasm';

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task';

export type RunningMode = 'IMAGE' | 'VIDEO';

let cachedImage: PoseLandmarker | null = null;
let cachedVideo: PoseLandmarker | null = null;

function ensureBrowserSupport(): void {
  if (typeof globalThis.WebAssembly === 'undefined') {
    throw new Error(
      'Ce navigateur ne supporte pas WebAssembly. Utilise Chrome/Edge/Firefox récent.',
    );
  }
}

async function create(mode: RunningMode): Promise<PoseLandmarker> {
  ensureBrowserSupport();
  const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
  const common = {
    runningMode: mode,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  } as const;

  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'GPU',
      },
      ...common,
    });
  } catch (gpuErr) {
    console.warn('[Move Analyze] Delegate GPU indisponible, fallback CPU.', gpuErr);
    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: 'CPU',
      },
      ...common,
    });
  }
}

export async function getDetector(mode: RunningMode): Promise<PoseLandmarker> {
  if (mode === 'IMAGE') {
    if (!cachedImage) cachedImage = await create('IMAGE');
    return cachedImage;
  }
  if (!cachedVideo) cachedVideo = await create('VIDEO');
  return cachedVideo;
}

export function extractPose(result: PoseLandmarkerResult): Pose | null {
  if (!result.landmarks || result.landmarks.length === 0) return null;
  return result.landmarks[0] as Pose;
}
