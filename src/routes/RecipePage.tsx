import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { CATEGORY_NAME } from '../../shared/formula';
import { KIND_NAME, LIMITS, type Bake, type DoughRecipe, type GeneralRecipe, type Recipe } from '../../shared/recipe';
import { useCreateRecipe, useStartBake } from '../lib/actions';
import { formulaSummary, toDough } from '../lib/formula';
import { Locked, useLock } from '../lib/lock';
import type { Vars } from '../lib/math';
import { useBakes, useDeleteRecipe, useRecipe, useSaveBake, useSaveRecipe } from '../lib/query';
import { toast } from '../lib/toast';
import { useDebouncedEffect } from '../lib/useDebounced';
import { useNow } from '../lib/useNow';
import { useStoredFlag } from '../lib/useStoredFlag';
import { BakeRow } from '../components/BakeRow';
import { CalculatorCard } from '../components/Calculator';
import { doughSummary, DoughCard, HowCard, JumpNav, RecipeCard, TempFold, TimingFold, useDough, usePlanStart, YeastCard } from '../components/Dough';
import { CategoryChips, FormulaCard, FormulaTemp, MethodCard, useFormula } from '../components/Formula';
import { Icon, type IconName } from '../components/Icon';
import { IngredientsView, type Stage } from '../components/IngredientsView';
import { useLockButton } from '../components/LockButton';
import { METHOD_TEMPLATE, NotesCard } from '../components/Notes';
import { PasteSheet } from '../components/PasteRecipe';
import { Page } from '../components/Page';
import { Sheet } from '../components/Sheet';
import { mobileOrder } from '../components/Fold';

export function RecipePage() {
  const { id } = useParams({ from: '/r/$id' });
  const { recipe, isPending } = useRecipe(id);
  if (!recipe) return <Missing busy={isPending} />;
  return recipe.kind === 'manual' ? <GeneralEditor key={recipe.id} recipe={recipe} /> : <DoughEditor key={recipe.id} recipe={recipe} />;
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
  { id: 'calc', label: 'Calculator' },
] as const;

const GENERAL_SECTIONS = [
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'method', label: 'Method' },
  { id: 'notes', label: 'Notes' },
  { id: 'calc', label: 'Calculator' },
] as const;

const byStart = (a: Bake, b: Bake) => (b.start || '').localeCompare(a.start || '') || b.createdAt - a.createdAt;

const cleanName = (name: string) => name.trim().slice(0, LIMITS.name) || 'Untitled';

/**
 * The recipe as you edit it: local state is the source of truth while editing, saved after a pause and
 * applied to the cache optimistically. Shared by both editors; only the settings' shape differs.
 */
function useDraft<R extends Recipe>(recipe: R) {
  const [name, setName] = useState(recipe.name);
  const [s, setS] = useState<R['settings']>(recipe.settings);
  const [notes, setNotes] = useState(recipe.notes ?? '');
  const save = useSaveRecipe();
  const current = (): R => ({ ...recipe, name: cleanName(name), settings: s, notes }) as R;
  const draft = useMemo(() => ({ name, s, notes }), [name, s, notes]);
  const autosave = useDebouncedEffect(draft, 400, (x) => save.mutate({ ...recipe, name: cleanName(x.name), settings: x.s, notes: x.notes, updatedAt: Date.now() } as R));
  return { name, setName, s, setS, notes, setNotes, current, autosave };
}
type Draft<R extends Recipe> = ReturnType<typeof useDraft<R>>;

type ShellProps<R extends Recipe> = {
  recipe: R;
  draft: Draft<R>;
  /** The chip beside the name: the dough kind, or a general recipe's category. */
  chip: string;
  sub: string;
  stages: Stage[];
  sections: readonly { id: string; label: string }[];
  onJump?: (id: string) => void;
  bakes: Bake[];
  /** Starts a bake (dough recipes only). */
  onBake?: () => void;
  /** Shown under the name while editing (a general recipe's category). */
  extra?: ReactNode;
  /** More entries for the actions menu. */
  actions?: { label: string; icon: IconName; run: () => void }[];
  children: (ctx: { openFull: () => void; locked: boolean }) => ReactNode;
};

/** The page around a recipe: its name and chip, the lock, the actions menu, the full-screen ingredients and deleting. */
function RecipeShell<R extends Recipe>({ recipe, draft, chip, sub, stages, sections, onJump, bakes, onBake, extra, actions, children }: ShellProps<R>) {
  const { name, setName, current, autosave } = draft;
  const [locked, setLocked] = useLock(recipe.id);
  const [menu, setMenu] = useState<null | 'menu' | 'delete'>(null);
  const [cook, setCook] = useState(false);
  const save = useSaveRecipe();
  const del = useDeleteRecipe();
  const saveBake = useSaveBake();
  const navigate = useNavigate();
  const create = useCreateRecipe();

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

  const duplicate = () => {
    autosave.flush();
    setMenu(null);
    const r = current();
    create(r.kind, { name: `${r.name} (copy)`, settings: r.settings, notes: r.notes });
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
            <span className={`chip ${recipe.kind}`}>{chip}</span>
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
            {locked ? null : <p className="editing-note">Editing the recipe. Changes save as you go{onBake ? '; bakes you’ve already started keep their own copy' : ''}.</p>}
            {locked ? null : extra}
          </div>
        }
        below={<JumpNav sections={sections} onJump={onJump} />}
      >
        {children({ openFull: () => setCook(true), locked })}

        <IngredientsView open={cook} onClose={() => setCook(false)} title={name || 'Untitled'} sub={sub} stages={stages} />

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
              {/* A general recipe has no schedule to follow. */}
              {onBake ? (
                <button
                  type="button"
                  className="action"
                  onClick={() => {
                    setMenu(null);
                    onBake();
                  }}
                >
                  <Icon name="flame" /> Start a bake
                </button>
              ) : null}
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
              {actions?.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  className="action"
                  onClick={() => {
                    setMenu(null);
                    a.run();
                  }}
                >
                  <Icon name={a.icon} /> {a.label}
                </button>
              ))}
              <button type="button" className="action" onClick={duplicate}>
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

/** Notes aren't settings: they stay editable while the recipe is locked. */
function notesCard(draft: { notes: string; setNotes: (v: string) => void }, vars: Vars, order: number, template?: string) {
  return (
    <NotesCard
      id="notes"
      title="Notes"
      hint="Method, tips, what to look for"
      value={draft.notes}
      onChange={draft.setNotes}
      editable
      placeholder="Write the method, tips, and what to look for…"
      empty=""
      template={template}
      order={order}
      vars={vars}
    />
  );
}

/* ---------- a biga, poolish or direct dough ---------- */

function DoughEditor({ recipe }: { recipe: DoughRecipe }) {
  const kind = recipe.kind;
  const draft = useDraft(recipe);
  const { s, setS } = draft;
  const [timingOpen, setTimingOpen] = useStoredFlag('biga-open-timing', false);
  const startBake = useStartBake();
  const { data: allBakes } = useBakes();
  const bakes = useMemo(() => (allBakes ?? []).filter((b) => b.recipeId === recipe.id).sort(byStart), [allBakes, recipe.id]);

  // A recipe has no clock times of its own: its schedule is shown as if you started now.
  const { start, planned } = usePlanStart(kind, s);
  const d = useDough(kind, s, setS, start, !planned);
  const sub = doughSummary(s, d.c);

  const bake = () => {
    draft.autosave.flush();
    startBake(recipe, s, planned ? s.plan : undefined);
  };

  return (
    <RecipeShell
      recipe={recipe}
      draft={draft}
      chip={KIND_NAME[kind]}
      sub={sub}
      stages={d.stages}
      sections={SECTIONS}
      onJump={(id) => id === 'timing' && setTimingOpen(true)}
      bakes={bakes}
      onBake={bake}
    >
      {({ openFull }) => (
        <div className="cols">
          <div className="col">
            <YeastCard d={d} order={1} planner />
            <DoughCard d={d} order={2} />
            {notesCard(draft, d.scope, 4, METHOD_TEMPLATE[kind])}
            {/* Last on a phone; under the notes on a computer. */}
            <CalculatorCard vars={d.vars} scope={d.scope} order={9} />
          </div>
          <div className="col sticky">
            <RecipeCard d={d} onFull={openFull} order={3} />
            <TempFold d={d} order={5} />
            <TimingFold d={d} open={timingOpen} onToggle={setTimingOpen} order={6} />
            <BakesCard bakes={bakes} onStart={bake} order={7} />
            <HowCard c={d.c} order={8} />
          </div>
        </div>
      )}
    </RecipeShell>
  );
}

/* ---------- a general recipe: baker's percentages or amounts, any category ---------- */

function GeneralEditor({ recipe }: { recipe: GeneralRecipe }) {
  const draft = useDraft(recipe);
  const { s, setS, notes, setNotes } = draft;
  const d = useFormula(s, setS);
  const sub = formulaSummary(s, d.c);
  const [paste, setPaste] = useState(false);
  const create = useCreateRecipe();
  // The same dough as a biga, poolish or direct recipe, with the yeast chart and the schedule.
  const dough = useMemo(() => toDough(s, d.c), [s, d.c]);
  const makeDough = () => {
    if (!dough) return;
    draft.autosave.flush();
    const left = dough.dropped.length ? `Left out of the ${KIND_NAME[dough.kind].toLowerCase()} recipe: ${dough.dropped.join(', ')}.` : '';
    const extra = [left, ...dough.notes].filter(Boolean).join(' ');
    create(dough.kind, { name: draft.name.trim() || recipe.name, settings: dough.settings, notes: [notes.trim(), extra].filter(Boolean).join('\n\n') });
    if (extra) toast(extra);
  };
  const clear = () => {
    const before = s;
    setS((p) => ({ ...p, ingredients: [], stages: [] }));
    toast('Ingredients cleared', { label: 'Undo', run: () => setS(before) });
  };
  return (
    <RecipeShell
      recipe={recipe}
      draft={draft}
      chip={CATEGORY_NAME[s.category]}
      sub={sub}
      stages={d.stages}
      sections={GENERAL_SECTIONS}
      bakes={[]}
      extra={<CategoryChips d={d} />}
      actions={[
        ...(dough ? [{ label: `Make a ${KIND_NAME[dough.kind].toLowerCase()} recipe with a schedule`, icon: 'flame' as const, run: makeDough }] : []),
        { label: 'Paste ingredients…', icon: 'paste', run: () => setPaste(true) },
        ...(s.ingredients.length ? [{ label: 'Clear the ingredients', icon: 'reset' as const, run: clear }] : []),
      ]}
    >
      {({ openFull }) => (
        <div className="cols">
          <div className="col">
            <FormulaCard d={d} onFull={openFull} order={1} />
            {notesCard(draft, d.scope, 4)}
          </div>
          <div className="col sticky">
            <MethodCard d={d} order={2} />
            {d.c.dough ? <FormulaTemp d={d} order={3} /> : null}
            <CalculatorCard vars={d.vars} scope={d.scope} order={5} />
          </div>
          <PasteSheet
            open={paste}
            onClose={() => setPaste(false)}
            title="Paste ingredients"
            action="Replace the ingredients"
            onDone={(p) => {
              setPaste(false);
              const before = s;
              setS((prev) => ({ ...prev, method: p.method, ingredients: p.ingredients, stages: p.stages }));
              if (p.notes.length) setNotes((notes.trim() ? `${notes.trimEnd()}\n\n` : '') + p.notes.join('\n\n'));
              toast('Ingredients replaced', { label: 'Undo', run: () => setS(before) });
            }}
          />
        </div>
      )}
    </RecipeShell>
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
