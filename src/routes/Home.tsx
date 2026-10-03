import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { KIND_NAME, type Kind, type Recipe } from '../../shared/recipe';
import { useCreateRecipe } from '../lib/actions';
import { BAKE_GRACE_MIN, MODELS, nearest, parseStart, timeline } from '../lib/dough';
import { useBakes, usePlayground, useRecipes } from '../lib/query';
import { useNow } from '../lib/useNow';
import { BakeRow } from '../components/BakeRow';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { DoughBall } from '../components/DoughBall';
import { storedKind } from './PlaygroundPage';

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
function ago(ts: number) {
  const s = (ts - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (abs < 86400 * 7) return rtf.format(Math.round(s / 86400), 'day');
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function summary(kind: Kind, s: Recipe['settings']) {
  const m = MODELS[kind];
  return `${s.balls} × ${s.bw} g · ${+s.hyd.toFixed(1)}% · ${nearest(m.hours, s.hours)} h @ ${nearest(m.temps, s.temp)}°`;
}

export function HomePage() {
  const { data, isPending, isError, refetch } = useRecipes();
  const { data: bakes } = useBakes();
  const { data: play } = usePlayground();
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [picker, setPicker] = useState(false);
  const create = useCreateRecipe();
  const search = useSearch({ from: '/' });
  const navigate = useNavigate();
  const now = useNow();

  // Home-screen shortcuts ("New biga" / "New poolish") land here with ?new=…
  const handled = useRef(false);
  useEffect(() => {
    if (search.new && !handled.current) {
      handled.current = true;
      const kind = search.new;
      // Drop ?new from history first so Back doesn't create another one.
      navigate({ to: '/', search: {}, replace: true }).then(() => create(kind));
    }
  }, [search.new]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => (data ?? []).filter((r) => filter === 'all' || r.kind === filter), [data, filter]);
  const kinds = new Set((data ?? []).map((r) => r.kind));
  const names = useMemo(() => new Map((data ?? []).map((r) => [r.id, r.name])), [data]);

  // Bakes still on the go: planned, in progress, or ready to bake within the last few hours.
  const active = useMemo(
    () =>
      (bakes ?? [])
        .flatMap((b) => {
          const start = parseStart(b.start);
          if (!start) return [];
          const end = timeline(b.kind, b.settings, start).bake.getTime() + BAKE_GRACE_MIN * 60_000;
          return end > now.getTime() ? [{ b, start }] : [];
        })
        .sort((x, y) => x.start.getTime() - y.start.getTime())
        .map((x) => x.b),
    [bakes, now],
  );

  const playKind = storedKind();
  const playSettings = play?.[playKind]?.settings;

  return (
    <Page
      title="Recipes"
      large={<h1>Recipes</h1>}
      left={
        <Link to="/settings" className="nav-btn" aria-label="Settings" viewTransition={{ types: ['push'] }}>
          <Icon name="gear" />
        </Link>
      }
      right={
        <button type="button" className="nav-btn" aria-label="New recipe" onClick={() => setPicker(true)}>
          <Icon name="plus" size={26} />
        </button>
      }
    >
      <Link to="/play" className="play-card" viewTransition={{ types: ['push'] }}>
        <span className="play-icon" aria-hidden="true">
          <Icon name="sliders" size={24} />
        </span>
        <span className="play-text">
          <b>Playground</b>
          <small>{playSettings ? `${KIND_NAME[playKind]} · ${summary(playKind, playSettings)}` : 'Try out numbers freely. It saves as you go.'}</small>
        </span>
        <Icon name="chevron" size={18} className="row-chev" />
      </Link>

      {active.length ? (
        <section className="home-section" aria-labelledby="h-active">
          <h2 className="group-label" id="h-active">
            On the go
          </h2>
          <ul className="list">
            {active.map((b) => (
              <BakeRow key={b.id} b={b} now={now} title={names.get(b.recipeId) ?? 'Bake'} />
            ))}
          </ul>
        </section>
      ) : null}

      {kinds.size > 1 ? (
        <div className="segmented" role="tablist" aria-label="Filter recipes">
          {(['all', 'biga', 'poolish'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>
              {k === 'all' ? 'All' : KIND_NAME[k]}
            </button>
          ))}
        </div>
      ) : null}

      {isPending && !data ? (
        <ul className="list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="row skeleton">
              <span />
            </li>
          ))}
        </ul>
      ) : isError && !data ? (
        <div className="empty">
          <p>Couldn't load your recipes.</p>
          <button type="button" className="btn" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : list.length ? (
        <ul className="list">
          {list.map((r) => (
            <li key={r.id}>
              <Link to="/r/$id" params={{ id: r.id }} className="row" viewTransition={{ types: ['push'] }}>
                <span className="row-main">
                  <span className="row-title">{r.name || 'Untitled'}</span>
                  <span className="row-sub">{summary(r.kind, r.settings)}</span>
                </span>
                <span className="row-meta">
                  <span className={`chip ${r.kind}`}>{KIND_NAME[r.kind]}</span>
                  <span className="row-time">{ago(r.updatedAt)}</span>
                </span>
                <Icon name="chevron" size={18} className="row-chev" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <DoughBall />
          <h2>No recipes yet</h2>
          <p>Start with a stiff biga or a runny poolish, or work out the numbers in the playground and save them as a recipe.</p>
          <div className="empty-actions">
            <button type="button" className="btn primary" onClick={() => create('biga')}>
              New biga
            </button>
            <button type="button" className="btn" onClick={() => create('poolish')}>
              New poolish
            </button>
          </div>
        </div>
      )}

      <Sheet open={picker} onClose={() => setPicker(false)} title="New recipe">
        <div className="choice-list">
          {(['biga', 'poolish'] as const).map((k) => (
            <button
              key={k}
              type="button"
              className="choice"
              onClick={() => {
                setPicker(false);
                create(k);
              }}
            >
              <span className={`kind-badge ${k}`} aria-hidden="true">
                {k === 'biga' ? 'B' : 'P'}
              </span>
              <span>
                <b>{KIND_NAME[k]}</b>
                <small>
                  {k === 'biga'
                    ? 'Stiff, 45% hydration. Deep, nutty flavour and strong structure.'
                    : 'Batter-like, 100% hydration. Extensible dough, open and airy crumb.'}
                </small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
      </Sheet>
    </Page>
  );
}
