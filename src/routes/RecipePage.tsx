import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { KIND_NAME, LIMITS, type Bake, type Recipe, type Settings } from '../../shared/recipe';
import { useCreateRecipe, useStartBake } from '../lib/actions';
import { Locked, useLock } from '../lib/lock';
import { useBakes, useDeleteRecipe, useRecipe, useSaveBake, useSaveRecipe } from '../lib/query';
import { toast } from '../lib/toast';
import { useDebouncedEffect } from '../lib/useDebounced';
import { useNow } from '../lib/useNow';
import { useStoredFlag } from '../lib/useStoredFlag';
import { BakeRow } from '../components/BakeRow';
import { doughSummary, DoughCard, HowCard, JumpNav, RecipeCard, TempFold, TimingFold, useDough, usePlanStart, YeastCard } from '../components/Dough';
import { Icon } from '../components/Icon';
import { IngredientsView } from '../components/IngredientsView';
import { useLockButton } from '../components/LockButton';
import { METHOD_TEMPLATE, NotesCard } from '../components/Notes';
import { Page } from '../components/Page';
import { Sheet } from '../components/Sheet';
import { mobileOrder } from '../components/Fold';

export function RecipePage() {
  const { id } = useParams({ from: '/r/$id' });
  const { recipe, isPending } = useRecipe(id);
  if (!recipe) return <Missing busy={isPending} />;
  return <RecipeEditor key={recipe.id} recipe={recipe} />;
}

function Missing({ busy }: { busy: boolean }) {
  return (
    <Page title="" left={<BackHome />}>
      {busy ? (
        <div className="empty" aria-busy="true" />
      ) : (
        <div className="empty">
          <h2>Recipe not found</h2>
          <p>It may have been deleted on another device.</p>
          <Link to="/" className="btn">
            Back to doughs
          </Link>
        </div>
      )}
    </Page>
  );
}

export function BackHome() {
  return (
    <Link to="/" className="nav-btn back" aria-label="Back to doughs" viewTransition={{ types: ['pop'] }}>
      <Icon name="back" />
      <span>Doughs</span>
    </Link>
  );
}

const SECTIONS = [
  { id: 'yeast', label: 'Yeast' },
  { id: 'dough', label: 'Dough' },
  { id: 'recipe', label: 'Recipe' },
  { id: 'notes', label: 'Notes' },
  { id: 'timing', label: 'Timing' },
] as const;

const byStart = (a: Bake, b: Bake) => (b.start || '').localeCompare(a.start || '') || b.createdAt - a.createdAt;

function RecipeEditor({ recipe }: { recipe: Recipe }) {
  const kind = recipe.kind;
  const [name, setName] = useState(recipe.name);
  const [s, setS] = useState<Settings>(recipe.settings);
  const [notes, setNotes] = useState(recipe.notes ?? '');
  const [locked, setLocked] = useLock(recipe.id);
  const [menu, setMenu] = useState<null | 'menu' | 'delete'>(null);
  const [cook, setCook] = useState(false);
  const [timingOpen, setTimingOpen] = useStoredFlag('biga-open-timing', false);
  const save = useSaveRecipe();
  const del = useDeleteRecipe();
  const saveBake = useSaveBake();
  const navigate = useNavigate();
  const create = useCreateRecipe();
  const startBake = useStartBake();
  const { data: allBakes } = useBakes();
  const bakes = useMemo(() => (allBakes ?? []).filter((b) => b.recipeId === recipe.id).sort(byStart), [allBakes, recipe.id]);

  // A recipe has no clock times of its own: its schedule is shown as if you started now.
  const { start, planned } = usePlanStart(kind, s);
  const d = useDough(kind, s, setS, start, !planned);
  const sub = doughSummary(s, d.c);

  // Autosave: local state is the source of truth while editing; the cache is updated optimistically.
  const current = (): Recipe => ({ ...recipe, name: name.trim().slice(0, LIMITS.name) || 'Untitled', settings: s, notes });
  const draft = useMemo(() => ({ name, s, notes }), [name, s, notes]);
  const autosave = useDebouncedEffect(draft, 400, (x) =>
    save.mutate({ ...recipe, name: x.name.trim().slice(0, LIMITS.name) || 'Untitled', settings: x.s, notes: x.notes, updatedAt: Date.now() }),
  );

  const bake = () => {
    autosave.flush();
    setMenu(null);
    startBake(recipe, s, planned ? s.plan : undefined);
  };

  const lock = useLockButton(locked, (next) => {
    if (next) {
      autosave.flush();
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    setLocked(next);
  });

  const remove = () => {
    autosave.cancel();
    const snapshot = current();
    const kept = bakes;
    del.mutate({ id: recipe.id });
    navigate({ to: '/', viewTransition: { types: ['pop'] } });
    toast(`Deleted “${snapshot.name}”`, {
      label: 'Undo',
      run: () => {
        const now = Date.now();
        save.mutate({ ...snapshot, updatedAt: now });
        for (const b of kept) saveBake.mutate({ ...b, updatedAt: now });
      },
    });
  };

  return (
    <Locked.Provider value={locked}>
      <Page
        title={name || 'Untitled'}
        className="editor"
        left={<BackHome />}
        onClickCapture={lock.onClickCapture}
        right={
          <>
            {lock.button}
            <button type="button" className="nav-btn" aria-label="Recipe actions" onClick={() => setMenu('menu')}>
              <Icon name="more" />
            </button>
          </>
        }
        large={
          <div className="title-block">
            <span className={`chip ${kind}`}>{KIND_NAME[kind]}</span>
            <input
              className="title-input"
              value={name}
              maxLength={LIMITS.name}
              onChange={(e) => setName(e.target.value)}
              readOnly={locked}
              data-locked={locked ? '' : undefined}
              aria-label="Recipe name"
              enterKeyHint="done"
              autoComplete="off"
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <p className="title-sub">{sub}</p>
            {locked ? null : <p className="editing-note">Editing the recipe. Changes save as you go; bakes you’ve already started keep their own copy.</p>}
          </div>
        }
        below={<JumpNav sections={SECTIONS} onJump={(id) => id === 'timing' && setTimingOpen(true)} />}
      >
        <div className="cols">
          <div className="col">
            <YeastCard d={d} order={1} planner />
            <DoughCard d={d} order={2} />
            {/* Notes aren't settings: they stay editable while the recipe is locked. */}
            <NotesCard
              id="notes"
              title="Notes"
              hint="Method, tips, what to look for"
              value={notes}
              onChange={setNotes}
              editable
              placeholder="Write the method, tips, and what to look for…"
              empty=""
              template={METHOD_TEMPLATE[kind]}
              order={4}
            />
          </div>
          <div className="col sticky">
            <RecipeCard d={d} onFull={() => setCook(true)} order={3} />
            <TempFold d={d} order={5} />
            <TimingFold d={d} open={timingOpen} onToggle={setTimingOpen} order={6} />
            <BakesCard bakes={bakes} onStart={bake} order={7} />
            <HowCard c={d.c} order={8} />
          </div>
        </div>

        <IngredientsView open={cook} onClose={() => setCook(false)} title={name || 'Untitled'} sub={sub} stages={d.stages} />

        <Sheet
          open={menu !== null}
          onClose={() => setMenu(null)}
          title={menu === 'delete' ? `Delete “${name || 'Untitled'}”?` : undefined}
          label="Recipe actions"
        >
          {menu === 'delete' ? (
            <>
              {bakes.length ? (
                <p className="sheet-text">
                  Its {bakes.length === 1 ? 'bake' : `${bakes.length} bakes`} and {bakes.length === 1 ? 'its notes' : 'their notes'} will be deleted too.
                </p>
              ) : null}
              <div className="sheet-actions">
                <button type="button" className="btn danger block" onClick={remove}>
                  Delete recipe
                </button>
                <button type="button" className="btn block" onClick={() => setMenu(null)}>
                  Keep it
                </button>
              </div>
            </>
          ) : (
            <div className="sheet-actions">
              <button type="button" className="action" onClick={bake}>
                <Icon name="flame" /> Start a bake
              </button>
              <button
                type="button"
                className="action"
                onClick={() => {
                  setMenu(null);
                  setCook(true);
                }}
              >
                <Icon name="expand" /> Ingredients full screen
              </button>
              <button
                type="button"
                className="action"
                onClick={() => {
                  autosave.flush();
                  setMenu(null);
                  create(kind, { name: `${current().name} (copy)`, settings: s, notes });
                }}
              >
                <Icon name="copy" /> Duplicate
              </button>
              <button type="button" className="action danger" onClick={() => setMenu('delete')}>
                <Icon name="trash" /> Delete
              </button>
              <button type="button" className="btn block" onClick={() => setMenu(null)}>
                Cancel
              </button>
            </div>
          )}
        </Sheet>
      </Page>
    </Locked.Provider>
  );
}

/** Bakes made from this recipe, and a way to start one. Low on the page: most of the time you just use the recipe. */
function BakesCard({ bakes, onStart, order }: { bakes: Bake[]; onStart: () => void; order: number }) {
  const now = useNow();
  const [all, setAll] = useState(false);
  const shown = all ? bakes : bakes.slice(0, 3);
  return (
    <section className="card" id="bakes" aria-labelledby="h-bakes" style={mobileOrder(order)}>
      <div className="card-h">
        <h2 id="h-bakes">Bakes</h2>
        {bakes.length ? <span className="hint">{bakes.length === 1 ? '1 bake' : `${bakes.length} bakes`}</span> : null}
      </div>
      {bakes.length ? (
        <ul className="list inset">
          {shown.map((b) => (
            <BakeRow key={b.id} b={b} now={now} />
          ))}
        </ul>
      ) : (
        <p className="note">
          Want to follow one session on the clock? A bake keeps its own start time, tweaks and notes without changing the recipe.
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn small" onClick={onStart}>
          <Icon name="flame" size={16} /> Start a bake
        </button>
        {bakes.length > shown.length ? (
          <button type="button" className="btn small" onClick={() => setAll(true)}>
            Show all {bakes.length}
          </button>
        ) : null}
      </div>
    </section>
  );
}
