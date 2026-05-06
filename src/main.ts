import { extractPose, getDetector } from './pose/detector';
import type { Pose } from './pose/landmarks';
import { evaluatePosture } from './specs/evaluator';
import { findSpec, SPEC_LIBRARY } from './specs/library';
import { findPoomse, POOMSE_LIBRARY, type PoomseSpec } from './specs/poomse';
import type { PostureReport, PostureSpec } from './specs/types';
import { drawNoPoseHint, drawOverlay } from './ui/overlay';
import { renderReport } from './ui/report';

const $ = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const video = $<HTMLVideoElement>('video');
const image = $<HTMLImageElement>('image');
const canvas = $<HTMLCanvasElement>('canvas');
const stage = $<HTMLDivElement>('stage');
const placeholder = $<HTMLDivElement>('placeholder');
const statusBadge = $<HTMLDivElement>('status-badge');
const specSelect = $<HTMLSelectElement>('spec-select');
const poomseSelect = $<HTMLSelectElement>('poomse-select');
const poomseNav = $<HTMLDivElement>('poomse-nav');
const poomseStepTitle = $<HTMLDivElement>('poomse-step-title');
const poomseStepDesc = $<HTMLDivElement>('poomse-step-desc');
const btnPrevStep = $<HTMLButtonElement>('btn-prev-step');
const btnNextStep = $<HTMLButtonElement>('btn-next-step');
const fileInput = $<HTMLInputElement>('file-input');
const btnWebcam = $<HTMLButtonElement>('btn-webcam');
const btnPause = $<HTMLButtonElement>('btn-pause');
const btnStop = $<HTMLButtonElement>('btn-stop');
const btnUpload = $<HTMLButtonElement>('btn-upload');
const btnExport = $<HTMLButtonElement>('btn-export');
const reportPanel = $<HTMLElement>('report-panel');
const loadingOverlay = $<HTMLDivElement>('loading-overlay');
const loadingText = $<HTMLDivElement>('loading-text');

const ctx = canvas.getContext('2d')!;

type SourceMode = 'idle' | 'webcam' | 'video' | 'image';
let mode: SourceMode = 'idle';
let rafId: number | null = null;
let stream: MediaStream | null = null;
let currentSpec: PostureSpec | null = null;
let lastReport: PostureReport | null = null;
let smoothScore = 0;

// État poomse (séquence de pas).
let activePoomse: PoomseSpec | null = null;
let activeStepIdx = 0; // index dans activePoomse.steps

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'type' in err) {
    return `Erreur de chargement (${String((err as { type?: unknown }).type)})`;
  }
  return 'Erreur inconnue';
}

// ─── Spec selector ───────────────────────────────────────────────────────────
function populateSpecs() {
  const groups = new Map<string, PostureSpec[]>();
  for (const s of SPEC_LIBRARY) {
    const cat = s.category ?? 'Autres';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(s);
  }
  specSelect.innerHTML = '';
  for (const [cat, list] of groups) {
    const og = document.createElement('optgroup');
    og.label = cat;
    for (const s of list) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      og.appendChild(opt);
    }
    specSelect.appendChild(og);
  }
  currentSpec = SPEC_LIBRARY[0];
  specSelect.value = currentSpec.id;
}

specSelect.addEventListener('change', () => {
  // Choisir une posture libre désactive le mode poomse.
  if (activePoomse) {
    activePoomse = null;
    poomseSelect.value = '';
    updatePoomseUI();
  }
  currentSpec = findSpec(specSelect.value) ?? null;
  lastReport = null;
  if (mode === 'image') analyzeImageOnce();
  renderReport(reportPanel, lastReport, currentSpec);
});

// ─── Poomse navigation ───────────────────────────────────────────────────────
function populatePoomse() {
  for (const p of POOMSE_LIBRARY) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.pattern ? `${p.name} · ${p.pattern}` : p.name;
    poomseSelect.appendChild(opt);
  }
}

function updatePoomseUI() {
  if (!activePoomse) {
    poomseNav.hidden = true;
    return;
  }
  poomseNav.hidden = false;
  const total = activePoomse.steps.length;
  const step = activePoomse.steps[activeStepIdx];
  poomseStepTitle.textContent = `${activePoomse.name} — ${step.spec.name}  (${step.index}/${total})`;
  poomseStepDesc.textContent = step.description;
  btnPrevStep.disabled = activeStepIdx <= 0;
  btnNextStep.disabled = activeStepIdx >= total - 1;
}

function setActiveStep(idx: number) {
  if (!activePoomse) return;
  const total = activePoomse.steps.length;
  activeStepIdx = Math.max(0, Math.min(total - 1, idx));
  currentSpec = activePoomse.steps[activeStepIdx].spec;
  lastReport = null;
  updatePoomseUI();
  if (mode === 'image') analyzeImageOnce();
  renderReport(reportPanel, lastReport, currentSpec);
}

poomseSelect.addEventListener('change', () => {
  const id = poomseSelect.value;
  if (!id) {
    activePoomse = null;
    updatePoomseUI();
    // Revenir à la première spec libre.
    currentSpec = SPEC_LIBRARY[0] ?? null;
    if (currentSpec) specSelect.value = currentSpec.id;
    lastReport = null;
    if (mode === 'image') analyzeImageOnce();
    renderReport(reportPanel, lastReport, currentSpec);
    return;
  }
  activePoomse = findPoomse(id) ?? null;
  setActiveStep(0);
});

btnPrevStep.addEventListener('click', () => setActiveStep(activeStepIdx - 1));
btnNextStep.addEventListener('click', () => setActiveStep(activeStepIdx + 1));

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement;
  // Ne pas intercepter quand l'utilisateur tape dans un champ.
  if (target.tagName === 'SELECT' || target.tagName === 'INPUT') return;

  // Espace = pause/play (uniquement en mode vidéo)
  if (e.key === ' ' && mode === 'video') {
    e.preventDefault();
    btnPause.click();
    return;
  }

  if (!activePoomse) return;
  if (e.key === 'ArrowLeft') setActiveStep(activeStepIdx - 1);
  else if (e.key === 'ArrowRight') setActiveStep(activeStepIdx + 1);
});

// ─── UI helpers ──────────────────────────────────────────────────────────────
function setStatus(s: SourceMode) {
  mode = s;
  statusBadge.className = 'badge-status';
  if (s === 'webcam') {
    statusBadge.classList.add('live');
    statusBadge.textContent = '● LIVE';
  } else if (s === 'video') {
    statusBadge.classList.add('video');
    statusBadge.textContent = '▶ Vidéo';
  } else if (s === 'image') {
    statusBadge.classList.add('image');
    statusBadge.textContent = '🖼 Image';
  }
  placeholder.style.display = s === 'idle' ? 'block' : 'none';
  btnStop.disabled = s === 'idle' || s === 'image';
  updatePauseButton();
}

function setLoading(msg = 'Chargement…') {
  loadingText.textContent = msg;
  loadingOverlay.hidden = false;
}
function clearLoading() {
  loadingOverlay.hidden = true;
}

function updatePauseButton() {
  if (mode === 'video') {
    btnPause.hidden = false;
    btnPause.disabled = false;
    btnPause.textContent = video.paused ? '▶ Lecture' : '⏸ Pause';
  } else {
    btnPause.hidden = true;
    btnPause.disabled = true;
  }
}

video.addEventListener('play', updatePauseButton);
video.addEventListener('pause', updatePauseButton);

btnPause.addEventListener('click', async () => {
  if (mode !== 'video') return;
  if (video.paused) {
    try {
      await video.play();
    } catch (err) {
      console.warn('[Move Analyze] play() impossible:', err);
    }
  } else {
    video.pause();
  }
});

function fitCanvasTo(srcW: number, srcH: number) {
  // Le canvas se dimensionne en CSS via max-width/max-height (cf. styles.css).
  // On lui donne juste la résolution native du média.
  canvas.width = srcW;
  canvas.height = srcH;
}

// ─── Webcam ──────────────────────────────────────────────────────────────────
async function startWebcam() {
  await stopAll();
  setLoading('Activation de la webcam…');
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  } catch (err) {
    clearLoading();
    alert('Impossible d\'accéder à la webcam: ' + errorMessage(err));
    return;
  }
  video.srcObject = stream;
  video.muted = true;
  await video.play();
  setStatus('webcam');
  await new Promise<void>((res) => {
    if (video.videoWidth) return res();
    video.onloadedmetadata = () => res();
  });
  fitCanvasTo(video.videoWidth, video.videoHeight);
  loopVideo();
}

// ─── Vidéo fichier ───────────────────────────────────────────────────────────
async function startVideoFile(file: File) {
  await stopAll();
  setLoading('Chargement de la vidéo…');
  const url = URL.createObjectURL(file);
  video.srcObject = null;
  video.src = url;
  video.muted = true;
  video.loop = true;
  setStatus('video');
  await new Promise<void>((res) => {
    if (video.videoWidth) return res();
    video.onloadedmetadata = () => res();
  });
  try {
    await video.play();
  } catch (err) {
    console.warn('[Move Analyze] video.play() bloqué:', err);
  }
  fitCanvasTo(video.videoWidth, video.videoHeight);
  // Première frame visible immédiatement
  if (video.readyState >= 2) {
    drawOverlay(ctx, video, {
      width: canvas.width, height: canvas.height,
      pose: null, report: null,
    });
  }
  loopVideo();
}

async function loopVideo() {
  let detector;
  try {
    setLoading('Chargement du modèle MediaPipe…');
    detector = await getDetector('VIDEO');
  } catch (err) {
    clearLoading();
    console.error('[Move Analyze] Impossible de charger MediaPipe:', err);
    drawNoPoseHint(
      ctx, canvas.width, canvas.height,
      'Erreur MediaPipe: ' + errorMessage(err),
    );
    return;
  }
  clearLoading();
  const tick = () => {
    if (mode !== 'webcam' && mode !== 'video') return;
    if (video.readyState >= 2) {
      let pose: Pose | null = null;
      try {
        const result = detector.detectForVideo(video, performance.now());
        pose = extractPose(result);
      } catch (err) {
        console.error('[Move Analyze] detectForVideo a échoué:', err);
      }
      const report = pose && currentSpec ? evaluatePosture(pose, currentSpec) : null;
      lastReport = report;
      if (report) smoothScore = smoothScore * 0.7 + report.score * 0.3;
      drawOverlay(ctx, video, {
        width: canvas.width,
        height: canvas.height,
        pose,
        report,
      });
      if (!pose) drawNoPoseHint(ctx, canvas.width, canvas.height);
    }
    rafId = requestAnimationFrame(tick);
  };
  // throttle report panel
  let lastPanel = 0;
  const panelTick = () => {
    const now = performance.now();
    if (now - lastPanel > 200) {
      renderReport(reportPanel, lastReport, currentSpec);
      lastPanel = now;
    }
    if (mode === 'webcam' || mode === 'video') {
      requestAnimationFrame(panelTick);
    }
  };
  panelTick();
  tick();
}

// ─── Image fichier ───────────────────────────────────────────────────────────
async function startImageFile(file: File) {
  await stopAll();
  setLoading('Chargement de l\'image…');
  const url = URL.createObjectURL(file);
  image.src = url;
  await new Promise<void>((res, rej) => {
    image.onload = () => res();
    image.onerror = () => rej(new Error('Image illisible'));
  });
  setStatus('image');
  fitCanvasTo(image.naturalWidth, image.naturalHeight);
  // Affichage immédiat de la photo (avant que le modèle ne soit chargé/exécuté)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  await analyzeImageOnce();
}

async function analyzeImageOnce() {
  if (mode !== 'image' || !image.src || !image.complete) return;
  setLoading('Analyse de la posture…');
  let pose: Pose | null = null;
  try {
    const detector = await getDetector('IMAGE');
    const result = detector.detect(image);
    pose = extractPose(result);
  } catch (err) {
    clearLoading();
    console.error('[Move Analyze] Échec de la détection (image):', err);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawNoPoseHint(
      ctx, canvas.width, canvas.height,
      'Erreur d\'analyse: ' + errorMessage(err),
    );
    return;
  }
  clearLoading();
  const report = pose && currentSpec ? evaluatePosture(pose, currentSpec) : null;
  lastReport = report;
  drawOverlay(ctx, image, {
    width: canvas.width,
    height: canvas.height,
    pose,
    report,
  });
  if (!pose) drawNoPoseHint(ctx, canvas.width, canvas.height);
  renderReport(reportPanel, lastReport, currentSpec);
}

// ─── Stop ────────────────────────────────────────────────────────────────────
async function stopAll() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  video.pause();
  video.srcObject = null;
  if (video.src) {
    URL.revokeObjectURL(video.src);
    video.removeAttribute('src');
    video.load();
  }
  if (image.src) {
    URL.revokeObjectURL(image.src);
    image.removeAttribute('src');
  }
  setStatus('idle');
  clearLoading();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lastReport = null;
  renderReport(reportPanel, null, currentSpec);
}

// ─── Events ──────────────────────────────────────────────────────────────────
btnWebcam.addEventListener('click', () => startWebcam());
btnStop.addEventListener('click', () => stopAll());
btnUpload.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.type.startsWith('image/')) {
    await startImageFile(file);
  } else if (file.type.startsWith('video/')) {
    await startVideoFile(file);
  } else {
    alert('Format non supporté: ' + file.type);
  }
  fileInput.value = '';
});

btnExport.addEventListener('click', () => {
  if (!currentSpec) return;
  const blob = new Blob([JSON.stringify(currentSpec, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentSpec.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Init ────────────────────────────────────────────────────────────────────
populateSpecs();
populatePoomse();
updatePoomseUI();
renderReport(reportPanel, null, currentSpec);
setStatus('idle');
