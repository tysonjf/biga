import { Link } from '@tanstack/react-router';
import type { Bake } from '../../shared/recipe';
import { bakeName } from '../lib/actions';
import { bakeStatus, fmtDate, fmtDay, parseStart, timeline, type BakeStatus } from '../lib/dough';
import { Icon } from './Icon';

// What "next" reads as in a one-line status, by step.
const NEXT: Record<string, string> = {
  start: 'mix',
  ready: 'final mix',
  ball: 'ball',
  fridge: 'into the fridge',
  out: 'out of the fridge',
  bake: 'bake',
};

/** Where a bake is up to, worked out from its schedule and the time now. */
export function bakeProgress(b: Bake, now: Date): { status: BakeStatus | null; line: string } {
  const start = parseStart(b.start);
  if (!start) return { status: null, line: 'No start time yet' };
  const tl = timeline(b.kind, b.settings, start);
  const status = bakeStatus(b.kind, tl, now);
  const next = status.next;
  const line =
    status.phase === 'done'
      ? `Baked ${fmtDate(tl.bake)}`
      : status.phase === 'ready'
        ? `Ready to bake since ${fmtDay(tl.bake)}`
        : next
          ? `${status.phase === 'planned' ? 'Starts' : `${status.title} · ${NEXT[next.key] ?? 'next'}`} ${fmtDay(next.at)}`
          : status.title;
  return { status, line };
}

/** A bake in a list. `title` replaces the bake's own name (e.g. with its recipe's, on the home screen). */
export function BakeRow({ b, now, title }: { b: Bake; now: Date; title?: string }) {
  const { status, line } = bakeProgress(b, now);
  const live = status && status.phase !== 'done';
  return (
    <li>
      <Link to="/b/$id" params={{ id: b.id }} className={'row' + (live ? ' live' : '')} viewTransition={{ types: ['push'] }}>
        <span className="row-main">
          <span className="row-title">{title ?? bakeName(b)}</span>
          <span className="row-sub">{line}</span>
          {live && status.phase === 'running' ? (
            <span className="row-bar" aria-hidden="true">
              <span style={{ width: `${Math.round(status.progress * 100)}%` }} />
            </span>
          ) : null}
        </span>
        {title && !live ? (
          <span className="row-meta">
            <span className="row-time">{bakeName(b)}</span>
          </span>
        ) : null}
        <Icon name="chevron" size={18} className="row-chev" />
      </Link>
    </li>
  );
}
