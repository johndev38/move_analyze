import { LM, POSE_CONNECTIONS, type Pose } from '../pose/landmarks';
import type { PostureReport } from '../specs/types';

interface DrawOptions {
  width: number;
  height: number;
  pose: Pose | null;
  report: PostureReport | null;
}

/** Couleur selon score: rouge -> jaune -> vert. */
function scoreColor(score: number): string {
  const s = Math.max(0, Math.min(1, score));
  const r = Math.round(255 * (1 - s));
  const g = Math.round(180 * s + 60);
  return `rgb(${r}, ${g}, 80)`;
}

/**
 * Index des landmarks impliqués dans une contrainte (à mettre en évidence si elle échoue).
 * On reste simple: pour les contraintes basées sur des landmarks directs, on collecte les LM.
 */
function collectFailingLandmarks(report: PostureReport | null): Set<number> {
  const out = new Set<number>();
  if (!report) return out;
  for (const r of report.results) {
    if (r.passed) continue;
    // Best-effort: on n'a pas le détail dans le ConstraintResult, on laisse vide.
    // (Une amélioration possible: stocker les indices des points dans le résultat.)
  }
  return out;
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource | null,
  opts: DrawOptions,
): void {
  const { width, height, pose, report } = opts;
  ctx.clearRect(0, 0, width, height);

  if (source) {
    ctx.drawImage(source, 0, 0, width, height);
  }

  if (!pose) return;

  // Connexions
  ctx.lineWidth = 3;
  ctx.strokeStyle = report ? scoreColor(report.score) : '#22d3ee';
  for (const [i, j] of POSE_CONNECTIONS) {
    const a = pose[i];
    const b = pose[j];
    if (!a || !b) continue;
    if ((a.visibility ?? 1) < 0.3 || (b.visibility ?? 1) < 0.3) continue;
    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  }

  // Landmarks
  const failing = collectFailingLandmarks(report);
  for (let idx = 0; idx < pose.length; idx++) {
    const p = pose[idx];
    if (!p || (p.visibility ?? 1) < 0.3) continue;
    const isMajor = idx >= 11; // ignorer les détails du visage
    if (!isMajor && idx > 0) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, idx === 0 ? 4 : 5, 0, Math.PI * 2);
    ctx.fillStyle = failing.has(idx) ? '#ef4444' : '#fafafa';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Bandeau score en haut
  if (report) {
    const pad = 12;
    const barH = 10;
    const barW = width - pad * 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, width, 56);
    ctx.fillStyle = '#fff';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(
      `${report.specName} — ${(report.score * 100).toFixed(0)}%${report.passed ? '  ✓' : ''}`,
      pad, 8,
    );
    // jauge
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(pad, 36, barW, barH);
    ctx.fillStyle = scoreColor(report.score);
    ctx.fillRect(pad, 36, barW * report.score, barH);
    // marqueur du seuil
    const tx = pad + barW * report.passThreshold;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx, 33);
    ctx.lineTo(tx, 36 + barH + 3);
    ctx.stroke();
  }
}

export function drawNoPoseHint(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  msg = 'Aucune pose détectée',
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, height - 36, width, 36);
  ctx.fillStyle = '#fff';
  ctx.font = '500 14px system-ui, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(msg, 12, height - 18);
}

export { LM };
