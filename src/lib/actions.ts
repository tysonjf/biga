import { useNavigate } from '@tanstack/react-router';
import { CATEGORY_NAME, defaultFormula, normaliseFormula, STARTER_NAME, type Category, type Formula } from '../../shared/formula';
import { DEFAULTS, KIND_NAME, LIMITS, newId, normalise, type Bake, type DoughKind, type DoughRecipe, type Kind, type Recipe, type Settings } from '../../shared/recipe';
import { fmtDate, parseStart, roundedNow, toLocalInput } from './dough';
import { markFresh } from './lock';
import { primeBake, primeRecipe, useSaveBake, useSaveRecipe } from './query';

/** A bake is called by the day its preferment was mixed, unless you've named it. */
export function bakeName(b: Pick<Bake, 'name' | 'start'>) {
  if (b.name) return b.name;
  const start = parseStart(b.start);
  return start ? fmtDate(start) : 'New bake';
}

type Init = { name?: string; settings?: Settings | Formula; notes?: string; category?: Category };

/** Makes a recipe and opens it, ready to edit. A general recipe starts from its category's usual ingredients. */
export function useCreateRecipe() {
  const save = useSaveRecipe();
  const navigate = useNavigate();
  return (kind: Kind, init: Init = {}) => {
    const now = Date.now();
    const base = { id: newId(), notes: init.notes ?? '', createdAt: now, updatedAt: now };
    let r: Recipe;
    if (kind === 'manual') {
      const settings = normaliseFormula(init.settings ?? defaultFormula(init.category ?? 'pizza'));
      const name = init.name?.trim() || STARTER_NAME[settings.category] || CATEGORY_NAME[settings.category];
      r = { ...base, kind, name: name.slice(0, LIMITS.name), settings };
    } else {
      const settings = normalise(kind, init.settings ?? DEFAULTS[kind]);
      r = { ...base, kind, name: (init.name?.trim() || `${KIND_NAME[kind]} dough`).slice(0, LIMITS.name), settings };
    }
    primeRecipe(r); // synchronously, so the page never renders "not found" for a frame
    markFresh(r.id);
    save.mutate(r);
    navigate({ to: '/r/$id', params: { id: r.id }, viewTransition: { types: ['push'] } });
    return r;
  };
}

/** Starts a bake of a dough recipe, mixed at `start` (default now), and opens it ready to tweak. */
export function useStartBake() {
  const save = useSaveBake();
  const navigate = useNavigate();
  return (recipe: Pick<DoughRecipe, 'id' | 'kind'>, settings: Settings, start?: string) => {
    const now = Date.now();
    const kind: DoughKind = recipe.kind;
    const b: Bake = {
      id: newId(),
      recipeId: recipe.id,
      kind,
      name: '',
      // A bake has its own start time, not the recipe's plan.
      settings: normalise(kind, { ...settings, plan: '' }),
      start: start || toLocalInput(roundedNow()),
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    primeBake(b);
    markFresh(b.id);
    save.mutate(b);
    navigate({ to: '/b/$id', params: { id: b.id }, viewTransition: { types: ['push'] } });
    return b;
  };
}
