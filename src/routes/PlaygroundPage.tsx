import { useEffect, useState } from 'react';
import { DEFAULTS, KIND_NAME, KINDS, LIMITS, normalise, type Kind, type Settings } from '../../shared/recipe';
import { useCreateRecipe } from '../lib/actions';
import { usePlayground, useSavePlay } from '../lib/query';
import { toast } from '../lib/toast';
import { useDebouncedEffect } from '../lib/useDebounced';
import { useStoredFlag } from '../lib/useStoredFlag';
import { doughSummary, DoughCard, HowCard, JumpNav, RecipeCard, TempFold, TimingFold, useDough, usePlanStart, YeastCard } from '../components/Dough';
import { Icon } from '../components/Icon';
import { IngredientsView } from '../components/IngredientsView';
import { Page } from '../components/Page';
import { Sheet } from '../components/Sheet';
import { BackHome } from './RecipePage';

const KIND_KEY = 'biga-play-kind';

/** The preferment the playground was last on, remembered on this device. */
export function storedKind(): Kind {
  try {
    const v = localStorage.getItem(KIND_KEY);
    return v === 'poolish' ? 'poolish' : 'biga';
  } catch {
    return 'biga';
  }
}

export function PlaygroundPage() {
  const { data, isError, refetch } = usePlayground();
  const [kind, setKind] = useState<Kind>(storedKind);
  useEffect(() => {
    try {
      localStorage.setItem(KIND_KEY, kind);
    } catch {
      /* private mode */
    }
  }, [kind]);

  if (!data) {
    return (
      <Page title="Playground" left={<BackHome />}>
        {isError ? (
          <div className="empty">
            <p>Couldn't load the playground.</p>
            <button type="button" className="btn" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <div className="empty" aria-busy="true" />
        )}
      </Page>
    );
  }
  // One playground per preferment: switching remounts with the other one's settings.
  return <Playground key={kind} kind={kind} setKind={setKind} initial={data[kind]?.settings ?? DEFAULTS[kind]} />;
}

const SECTIONS = [
  { id: 'yeast', label: 'Yeast' },
  { id: 'dough', label: 'Dough' },
  { id: 'recipe', label: 'Recipe' },
  { id: 'timing', label: 'Timing' },
] as const;

function Playground({ kind, setKind, initial }: { kind: Kind; setKind: (k: Kind) => void; initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [cook, setCook] = useState(false);
  const [menu, setMenu] = useState<null | 'menu' | 'save'>(null);
  const [recipeName, setRecipeName] = useState(`${KIND_NAME[kind]} dough`);
  const [timingOpen, setTimingOpen] = useStoredFlag('biga-open-timing', false);
  const save = useSavePlay();
  const create = useCreateRecipe();
  const { start, planned } = usePlanStart(kind, s);
  const d = useDough(kind, s, setS, start, !planned);
  const sub = doughSummary(s, d.c);

  const autosave = useDebouncedEffect(s, 400, (settings) => save.mutate({ kind, settings, updatedAt: Date.now() }));

  const reset = () => {
    const before = s;
    setS(normalise(kind, DEFAULTS[kind]));
    setMenu(null);
    toast(`${KIND_NAME[kind]} playground reset`, { label: 'Undo', run: () => setS(before) });
  };

  const saveAsRecipe = () => {
    autosave.flush();
    setMenu(null);
    create(kind, { name: recipeName, settings: s });
  };

  return (
    <Page
      title="Playground"
      className="editor"
      left={<BackHome />}
      right={
        <>
          <button type="button" className="nav-btn" aria-label="Show the ingredients full screen" onClick={() => setCook(true)}>
            <Icon name="expand" />
          </button>
          <button type="button" className="nav-btn" aria-label="Playground actions" onClick={() => setMenu('menu')}>
            <Icon name="more" />
          </button>
        </>
      }
      large={
        <div className="title-block">
          <h1>Playground</h1>
          <div className="segmented kind-switch" role="tablist" aria-label="Preferment">
            {KINDS.map((k) => (
              <button key={k} type="button" role="tab" aria-selected={kind === k} onClick={() => k !== kind && setKind(k)}>
                {KIND_NAME[k]}
              </button>
            ))}
          </div>
          <p className="title-sub">{sub}</p>
          <p className="editing-note">Play with the numbers freely. Everything saves as you go and never changes your recipes.</p>
          <button type="button" className="btn primary" onClick={() => setMenu('save')}>
            <Icon name="save" size={18} /> Save as recipe
          </button>
        </div>
      }
      below={<JumpNav sections={SECTIONS} onJump={(id) => id === 'timing' && setTimingOpen(true)} />}
    >
      <div className="cols">
        <div className="col">
          <YeastCard d={d} planner />
          <DoughCard d={d} />
        </div>
        <div className="col sticky">
          <RecipeCard d={d} onFull={() => setCook(true)} />
          <TempFold d={d} />
          <TimingFold d={d} open={timingOpen} onToggle={setTimingOpen} />
          <HowCard c={d.c} />
        </div>
      </div>

      <IngredientsView open={cook} onClose={() => setCook(false)} title={`${KIND_NAME[kind]} playground`} sub={sub} stages={d.stages} />

      <Sheet open={menu !== null} onClose={() => setMenu(null)} title={menu === 'save' ? 'Save as recipe' : undefined} label="Playground actions">
        {menu === 'save' ? (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              saveAsRecipe();
            }}
          >
            <label className="field">
              <span>Name</span>
              <input
                value={recipeName}
                maxLength={LIMITS.name}
                onChange={(e) => setRecipeName(e.target.value)}
                autoComplete="off"
                enterKeyHint="done"
              />
            </label>
            <p className="sheet-text">A new recipe with these settings. The playground stays as it is.</p>
            <div className="sheet-actions">
              <button type="submit" className="btn primary block">
                Save recipe
              </button>
              <button type="button" className="btn block" onClick={() => setMenu(null)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="sheet-actions">
            <button type="button" className="action" onClick={() => setMenu('save')}>
              <Icon name="save" /> Save as recipe
            </button>
            <button type="button" className="action" onClick={reset}>
              <Icon name="reset" /> Reset to the defaults
            </button>
            <button type="button" className="btn block" onClick={() => setMenu(null)}>
              Cancel
            </button>
          </div>
        )}
      </Sheet>
    </Page>
  );
}
