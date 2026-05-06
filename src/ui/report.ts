import type { PostureReport, PostureSpec } from '../specs/types';

function scoreClass(score: number): string {
  if (score >= 0.85) return 'ok';
  if (score >= 0.6) return 'warn';
  return 'bad';
}

export function renderReport(container: HTMLElement, report: PostureReport | null, spec: PostureSpec | null): void {
  if (!report || !spec) {
    container.innerHTML = `
      <div class="empty">
        <p>Choisis une posture, puis lance la webcam ou charge une image / vidéo.</p>
      </div>
    `;
    return;
  }

  const pct = (report.score * 100).toFixed(0);
  const passClass = report.passed ? 'ok' : 'bad';

  const rows = report.results.map((r) => {
    const measured = r.measured !== undefined ? formatMeasure(r) : '—';
    const target = r.target !== undefined
      ? r.tolerance !== undefined
        ? `${formatTarget(r)} ±${r.tolerance}`
        : formatTarget(r)
      : '—';
    return `
      <li class="row ${scoreClass(r.score)}">
        <div class="row-head">
          <span class="dot"></span>
          <span class="label">${escapeHtml(r.label)}</span>
          <span class="score">${(r.score * 100).toFixed(0)}%</span>
        </div>
        <div class="row-body">
          <span><b>Mesuré:</b> ${measured}</span>
          <span><b>Cible:</b> ${target}</span>
        </div>
        ${r.reason || r.hint ? `<p class="hint">${escapeHtml(r.hint || r.reason || '')}</p>` : ''}
      </li>
    `;
  }).join('');

  container.innerHTML = `
    <header class="report-head ${passClass}">
      <div>
        <h2>${escapeHtml(spec.name)}</h2>
        ${spec.description ? `<p class="desc">${escapeHtml(spec.description)}</p>` : ''}
      </div>
      <div class="score-big">
        <div class="num">${pct}<span>%</span></div>
        <div class="badge">${report.passed ? '✓ Validé' : 'À corriger'}</div>
        <div class="threshold">seuil ${(report.passThreshold * 100).toFixed(0)}%</div>
      </div>
    </header>
    ${report.suggestions.length ? `
      <section class="suggestions">
        <h3>Corrections prioritaires</h3>
        <ul>${report.suggestions.slice(0, 5).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
      </section>` : ''}
    <ol class="constraints">${rows}</ol>
  `;
}

function formatMeasure(r: { type: string; measured?: number }): string {
  if (r.measured === undefined) return '—';
  switch (r.type) {
    case 'jointAngle':
    case 'segmentAngle':
      return `${r.measured.toFixed(0)}°`;
    case 'distance':
      return r.measured.toFixed(2);
    case 'visible':
      return r.measured.toFixed(2);
    default:
      return r.measured.toFixed(2);
  }
}
function formatTarget(r: { type: string; target?: number }): string {
  if (r.target === undefined) return '—';
  switch (r.type) {
    case 'jointAngle':
    case 'segmentAngle':
      return `${r.target}°`;
    default:
      return r.target.toFixed(2);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
