import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { DEFAULTS, KIND_NAME, newId, type Kind, type Recipe } from '../../shared/recipe';
import { MODELS, nearest, roundedNow, toLocalInput } from '../lib/dough';
import { primeRecipe, useRecipes, useSaveRecipe } from '../lib/query';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { DoughBall } from '../components/DoughBall';

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

function summary(r: Recipe) {
  const s = r.settings;
  const m = MODELS[r.kind];
  return `${s.balls} × ${s.bw} g · ${+s.hyd.toFixed(1)}% · ${nearest(m.hours, s.hours)} h @ ${nearest(m.temps, s.temp)}°`;
}

export function useCreateRecipe() {
  const save = useSaveRecipe();
  const navigate = useNavigate();
  return (kind: Kind, from?: Recipe) => {
    const now = Date.now();
    const r: Recipe = {
      id: newId(),
      kind,
      name: from ? `${from.name} (copy)`.slice(0, 60) : `${KIND_NAME[kind]} dough`,
      settings: from ? structuredClone(from.settings) : { ...structuredClone(DEFAULTS[kind]), start: toLocalInput(roundedNow()) },
      createdAt: now,
      updatedAt: now,
    };
    primeRecipe(r); // synchronously, so the editor never renders "not found" for a frame
    save.mutate(r);
    navigate({ to: '/r/$id', params: { id: r.id }, viewTransition: { types: ['push'] } });
  };
}

export function RecipesPage() {
  const { data, isPending, isError, refetch } = useRecipes();
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [picker, setPicker] = useState(false);
  const create = useCreateRecipe();
  const search = useSearch({ from: '/' });
  const navigate = useNavigate();

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

  return (
    <Page
      title="Doughs"
      large={<h1>Doughs</h1>}
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
                  <span className="row-sub">{summary(r)}</span>
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
          <h2>No doughs yet</h2>
          <p>Start with a stiff biga or a runny poolish. Everything saves as you go.</p>
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
