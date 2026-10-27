import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { CATEGORIES, CATEGORY_BLURB, CATEGORY_NAME, defaultFormula, type Category } from '../../shared/formula';
import { DOUGH_KINDS, KIND_NAME, KINDS, type DoughKind, type Kind, type Recipe, type Settings } from '../../shared/recipe';
import { useCreateRecipe } from '../lib/actions';
import { BAKE_GRACE_MIN, MODELS, nearest, parseStart, timeline } from '../lib/dough';
import { calcFormula, formulaSummary } from '../lib/formula';
import { useBakes, usePlayground, useRecipes } from '../lib/query';
import { useNow } from '../lib/useNow';
import { BakeRow } from '../components/BakeRow';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { DoughBall } from '../components/DoughBall';
import { PasteSheet } from '../components/PasteRecipe';
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

const KIND_BLURB: Record<DoughKind, string> = {
  biga: 'Stiff, 45% hydration. Deep, nutty flavour and strong structure.',
  poolish: 'Batter-like, 100% hydration. Extensible dough, open and airy crumb.',
  direct: 'No preferment: everything mixed at once, a bulk ferment, then balls. Simple, same-day or overnight.',
};

function doughLine(kind: DoughKind, s: Settings) {
  const m = MODELS[kind];
  return `${s.balls} × ${s.bw} g · ${+s.hyd.toFixed(1)}% · ${nearest(m.hours, s.hours)} h @ ${nearest(m.temps, s.temp)}°`;
}

function summary(r: Recipe) {
  return r.kind === 'manual' ? formulaSummary(r.settings, calcFormula(r.settings)) : doughLine(r.kind, r.settings);
}

/** The chip on a recipe: its dough kind, or a general recipe's category. */
export const recipeLabel = (r: Recipe) => (r.kind === 'manual' ? CATEGORY_NAME[r.settings.category] : KIND_NAME[r.kind]);

export function HomePage() {
  const { data, isPending, isError, refetch } = useRecipes();
  const { data: bakes } = useBakes();
  const { data: play } = usePlayground();
  const [filter, setFilter] = useState<'all' | Kind>('all');
  const [picker, setPicker] = useState(false);
  const [paste, setPaste] = useState(false);
  const [pasteCat, setPasteCat] = useState<Category>('pizza');
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
      <Link to="/play" className="play-card" viewTransition={{ types: ['push'] }}>
        <span className="play-icon" aria-hidden="true">
          <Icon name="sliders" size={24} />
        </span>
        <span className="play-text">
          <b>Playground</b>
          <small>{playSettings ? `${KIND_NAME[playKind]} · ${doughLine(playKind, playSettings)}` : 'Try out numbers freely. It saves as you go.'}</small>
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
          {(['all', ...KINDS] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>
              {k === 'all' ? 'All' : k === 'manual' ? 'Recipes' : KIND_NAME[k]}
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
                  <span className={`chip ${r.kind}`}>{recipeLabel(r)}</span>
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
          <p>Start with a stiff biga, a runny poolish or a direct dough, or write any recipe: bread, brioche, pastry, cake, in baker’s percentages or by weight.</p>
          <div className="empty-actions">
            <button type="button" className="btn primary" onClick={() => create('biga')}>
              New biga
            </button>
            <button type="button" className="btn" onClick={() => create('poolish')}>
              New poolish
            </button>
            <button type="button" className="btn" onClick={() => create('direct')}>
              New direct dough
            </button>
            <button type="button" className="btn" onClick={() => setPicker(true)}>
              Another recipe…
            </button>
          </div>
        </div>
      )}

      <Sheet open={picker} onClose={() => setPicker(false)} title="New recipe">
        <div className="choice-list">
          <button
            type="button"
            className="choice"
            onClick={() => {
              setPicker(false);
              setPaste(true);
            }}
          >
            <span className="kind-badge manual" aria-hidden="true">
              <Icon name="paste" size={22} />
            </span>
            <span>
              <b>Paste a recipe</b>
              <small>From a post, a book or a message: the amounts and stages are read for you, ready to turn into baker’s percentages.</small>
            </span>
            <Icon name="chevron" size={18} />
          </button>
          <div className="group-label">Pizza dough, to the hour</div>
          {DOUGH_KINDS.map((k) => (
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
                {KIND_NAME[k][0]}
              </span>
              <span>
                <b>{KIND_NAME[k]}</b>
                <small>{KIND_BLURB[k]}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
          <div className="group-label">Any recipe, your own numbers</div>
          {CATEGORIES.map((cat: Category) => (
            <button
              key={cat}
              type="button"
              className="choice"
              onClick={() => {
                setPicker(false);
                create('manual', { category: cat });
              }}
            >
              <span className="kind-badge manual" aria-hidden="true">
                {CATEGORY_NAME[cat][0]}
              </span>
              <span>
                <b>{cat === 'other' ? 'Anything else' : CATEGORY_NAME[cat]}</b>
                <small>{CATEGORY_BLURB[cat]}</small>
              </span>
              <Icon name="chevron" size={18} />
            </button>
          ))}
        </div>
      </Sheet>

      <PasteSheet
        open={paste}
        onClose={() => setPaste(false)}
        title="Paste a recipe"
        action="Create recipe"
        category={pasteCat}
        onCategory={setPasteCat}
        onDone={(p) => {
          setPaste(false);
          create('manual', {
            category: pasteCat,
            settings: { ...defaultFormula(pasteCat), method: p.method, ingredients: p.ingredients, stages: p.stages },
            notes: p.notes.length ? p.notes.join('\n\n') : '',
          });
        }}
      />
    </Page>
  );
}
