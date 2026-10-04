import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { KIND_NAME, LIMITS, type Bake, type Recipe, type Settings } from '../../shared/recipe';
import { bakeName, useStartBake } from '../lib/actions';
import { bakeStatus, fmtClock, fmtDate, fmtDay, fmtDur, parseStart, roundedNow, toLocalInput, type BakeStatus, type Timeline } from '../lib/dough';
import { Locked, useLock } from '../lib/lock';
import { useBake, useDeleteBake, useRecipe, useSaveBake, useSaveRecipe } from '../lib/query';
import { toast } from '../lib/toast';
import { useDebouncedEffect } from '../lib/useDebounced';
import { useNow } from '../lib/useNow';
import { useStoredFlag } from '../lib/useStoredFlag';
import {
  ClockNote,
  doughSummary,
  DoughCard,
  HowCard,
  JumpNav,
  RecipeCard,
  TempFold,
  TimelineList,
  TimingFields,
  useDough,
  YeastCard,
  type Dough,
} from '../components/Dough';
import { Fold, mobileOrder } from '../components/Fold';
import { Icon } from '../components/Icon';
import { IngredientsView } from '../components/IngredientsView';
import { useLockButton } from '../components/LockButton';
import { NotesCard, NotesText } from '../components/Notes';
import { Page } from '../components/Page';
import { Sheet } from '../components/Sheet';
import { BackHome } from './RecipePage';

export function BakePage() {
  const { id } = useParams({ from: '/b/$id' });
  const { bake, isPending } = useBake(id);
  const { recipe } = useRecipe(bake?.recipeId ?? '');
  if (!bake) {
    return (
      <Page title="" left={<BackHome />}>
        {isPending ? (
          <div className="empty" aria-busy="true" />
        ) : (
          <div className="empty">
            <h2>Bake not found</h2>
            <p>It may have been deleted on another device.</p>
            <Link to="/" className="btn">
              Back to doughs
            </Link>
          </div>
        )}
      </Page>
    );
  }
  return <BakeEditor key={bake.id} bake={bake} recipe={recipe} />;
}

const SECTIONS = [
  { id: 'timing', label: 'Timing' },
  { id: 'recipe', label: 'Recipe' },
  { id: 'notes', label: 'Notes' },
  { id: 'yeast', label: 'Yeast' },
  { id: 'dough', label: 'Dough' },
] as const;

function BakeEditor({ bake, recipe }: { bake: Bake; recipe: Recipe | undefined }) {
  const kind = bake.kind;
  const [name, setName] = useState(bake.name);
  const [s, setS] = useState<Settings>(bake.settings);
  const [start, setStart] = useState(bake.start);
  const [notes, setNotes] = useState(bake.notes);
  const [locked, setLocked] = useLock(bake.id);
  const [menu, setMenu] = useState<null | 'menu' | 'delete' | 'update'>(null);
  const [cook, setCook] = useState(false);
  const [methodOpen, setMethodOpen] = useStoredFlag('biga-open-method', false);
  const save = useSaveBake();
  const del = useDeleteBake();
  const saveRecipe = useSaveRecipe();
  const startBake = useStartBake();
  const navigate = useNavigate();
  const now = useNow();

  const startAt = useMemo(() => parseStart(start), [start]);
  const d = useDough(kind, s, setS, startAt);
  const status = d.tl ? bakeStatus(kind, d.tl, now) : null;
  const fallbackName = bakeName({ name: '', start });
  const title = name.trim() || fallbackName;
  const sub = doughSummary(s, d.c);

  const current = (): Bake => ({ ...bake, name: name.trim().slice(0, LIMITS.name), settings: s, start, notes });
  const draft = useMemo(() => ({ name, s, start, notes }), [name, s, start, notes]);
  const autosave = useDebouncedEffect(draft, 400, (x) =>
    save.mutate({ ...bake, name: x.name.trim().slice(0, LIMITS.name), settings: x.s, start: x.start, notes: x.notes, updatedAt: Date.now() }),
  );

  const lock = useLockButton(locked, (next) => {
    if (next) {
      autosave.flush();
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    setLocked(next);
  });

  const back = recipe ? (
    <Link to="/r/$id" params={{ id: recipe.id }} className="nav-btn back" aria-label={`Back to ${recipe.name}`} viewTransition={{ types: ['pop'] }}>
      <Icon name="back" />
      <span>{recipe.name || 'Recipe'}</span>
    </Link>
  ) : (
    <BackHome />
  );

  const remove = () => {
    autosave.cancel();
    const snapshot = current();
    del.mutate({ id: bake.id });
    if (recipe) navigate({ to: '/r/$id', params: { id: recipe.id }, viewTransition: { types: ['pop'] } });
    else navigate({ to: '/', viewTransition: { types: ['pop'] } });
    toast(`Deleted the bake “${title}”`, { label: 'Undo', run: () => save.mutate({ ...snapshot, updatedAt: Date.now() }) });
  };

  const updateRecipe = () => {
    if (!recipe) return;
    const before = recipe;
    saveRecipe.mutate({ ...recipe, settings: s, updatedAt: Date.now() });
    setMenu(null);
    toast(`Updated “${recipe.name}”`, { label: 'Undo', run: () => saveRecipe.mutate({ ...before, updatedAt: Date.now() }) });
  };

  return (
    <Locked.Provider value={locked}>
      <Page
        title={title}
        className="editor"
        left={back}
        onClickCapture={lock.onClickCapture}
        right={
          <>
            {lock.button}
            <button type="button" className="nav-btn" aria-label="Show the ingredients full screen" onClick={() => setCook(true)}>
              <Icon name="expand" />
            </button>
            <button type="button" className="nav-btn" aria-label="Bake actions" onClick={() => setMenu('menu')}>
              <Icon name="more" />
            </button>
          </>
        }
        large={
          <div className="title-block">
            <span className="chips-row">
              <span className={`chip ${kind}`}>{KIND_NAME[kind]}</span>
              <span className="chip bake">Bake</span>
            </span>
            <input
              className="title-input"
              value={name}
              placeholder={fallbackName}
              maxLength={LIMITS.name}
              onChange={(e) => setName(e.target.value)}
              readOnly={locked}
              data-locked={locked ? '' : undefined}
              aria-label="Bake name"
              enterKeyHint="done"
              autoComplete="off"
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            />
            <p className="title-sub">
              {recipe ? (
                <>
                  From{' '}
                  <Link to="/r/$id" params={{ id: recipe.id }} className="inline-link" viewTransition={{ types: ['pop'] }}>
                    {recipe.name}
                  </Link>{' '}
                  ·{' '}
                </>
              ) : null}
              {sub}
            </p>
            {locked ? null : <p className="editing-note">Editing this bake. Changes save as you go and don’t touch the recipe.</p>}
          </div>
        }
        below={<JumpNav sections={SECTIONS} />}
      >
        <div className="cols">
          <div className="col">
            <ScheduleCard d={d} status={status} now={now} start={start} setStart={setStart} locked={locked} order={1} />
            <NotesCard
              id="notes"
              title="Bake notes"
              hint="How this one went"
              value={notes}
              onChange={setNotes}
              editable
              placeholder="How did it go? Rise, temperatures, what to change next time…"
              empty=""
              order={3}
            />
            {recipe?.notes?.trim() ? (
              <Fold id="recipe-notes" title="Recipe notes" summary={`From ${recipe.name}`} open={methodOpen} onToggle={setMethodOpen} order={4}>
                <NotesText value={recipe.notes} onChange={() => {}} editable={false} placeholder="" label="Recipe notes" />
              </Fold>
            ) : null}
            <YeastCard d={d} order={5} />
            <DoughCard d={d} order={6} />
          </div>
          <div className="col sticky">
            <RecipeCard d={d} onFull={() => setCook(true)} order={2} />
            <TempFold d={d} order={7} />
            <HowCard c={d.c} order={8} />
          </div>
        </div>

        <IngredientsView open={cook} onClose={() => setCook(false)} title={title} sub={sub} stages={d.stages} />

        <Sheet
          open={menu !== null}
          onClose={() => setMenu(null)}
          title={menu === 'delete' ? `Delete the bake “${title}”?` : menu === 'update' ? `Update “${recipe?.name}”?` : undefined}
          label="Bake actions"
        >
          {menu === 'delete' ? (
            <div className="sheet-actions">
              <button type="button" className="btn danger block" onClick={remove}>
                Delete bake
              </button>
              <button type="button" className="btn block" onClick={() => setMenu(null)}>
                Keep it
              </button>
            </div>
          ) : menu === 'update' ? (
            <>
              <p className="sheet-text">
                The recipe takes this bake’s amounts, ferment and timings. Its name, method and other bakes stay as they are.
              </p>
              <div className="sheet-actions">
                <button type="button" className="btn primary block" onClick={updateRecipe}>
                  Update recipe
                </button>
                <button type="button" className="btn block" onClick={() => setMenu(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="sheet-actions">
              {recipe ? (
                <button
                  type="button"
                  className="action"
                  onClick={() => {
                    autosave.flush();
                    setMenu(null);
                    startBake(recipe, s);
                  }}
                >
                  <Icon name="flame" /> Bake again with these settings
                </button>
              ) : null}
              {recipe ? (
                <button type="button" className="action" onClick={() => setMenu('update')}>
                  <Icon name="save" /> Save these settings to the recipe
                </button>
              ) : null}
              <button type="button" className="action danger" onClick={() => setMenu('delete')}>
                <Icon name="trash" /> Delete bake
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

function ScheduleCard({
  d,
  status,
  now,
  start,
  setStart,
  locked,
  order,
}: {
  d: Dough;
  status: BakeStatus | null;
  now: Date;
  start: string;
  setStart: (v: string) => void;
  locked: boolean;
  order: number;
}) {
  const at = parseStart(start);
  const pre = d.c.model.name.toLowerCase();
  return (
    <section className="card" id="timing" aria-labelledby="h-timing" style={mobileOrder(order)}>
      <h2 id="h-timing">Timing</h2>
      {status && d.tl ? <StatusPanel status={status} tl={d.tl} now={now} /> : null}
      <div className="startrow">
        <label>
          <span>{d.c.model.name} mixed at</span>
          {locked ? (
            <span className="start-static" data-locked="">
              {at ? `${fmtDate(at)}, ${fmtClock(at)}` : 'Not set'}
            </span>
          ) : (
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          )}
        </label>
        {locked ? null : (
          <button type="button" className="btn" onClick={() => setStart(toLocalInput(roundedNow()))}>
            Now
          </button>
        )}
      </div>
      {d.tl ? (
        <>
          <TimelineList tl={d.tl} status={status ?? undefined} />
          <ClockNote tl={d.tl} />
        </>
      ) : (
        <p className="note">Set when the {pre} was mixed to see the schedule.</p>
      )}
      <div className="sub-h">Timings</div>
      <TimingFields d={d} />
    </section>
  );
}

function StatusPanel({ status, tl, now }: { status: BakeStatus; tl: Timeline; now: Date }) {
  const next = status.next;
  const until = next ? fmtDur(Math.max(0, (next.at.getTime() - now.getTime()) / 60_000)) : null;
  return (
    <div className={`status ${status.phase}`} role="status">
      <div className="status-t">{status.title}</div>
      {next ? (
        <p>
          Next: {next.title.charAt(0).toLowerCase() + next.title.slice(1)}, <b>{fmtDay(next.at)}</b> <span className="status-in">in {until}</span>
        </p>
      ) : status.phase === 'ready' ? (
        <p>
          Since {fmtDay(tl.bake)}
          {tl.window ? `, best by ${fmtClock(tl.window.late)}` : ''}. Enjoy it.
        </p>
      ) : (
        <p>Baked {fmtDate(tl.bake)}.</p>
      )}
      {status.phase === 'running' ? (
        <div className="status-bar" aria-hidden="true">
          <span style={{ width: `${Math.round(status.progress * 100)}%` }} />
        </div>
      ) : null}
    </div>
  );
}
