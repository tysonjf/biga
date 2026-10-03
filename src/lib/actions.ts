import { useNavigate } from '@tanstack/react-router';
import { DEFAULTS, KIND_NAME, LIMITS, newId, normalise, type Bake, type Kind, type Recipe, type Settings } from '../../shared/recipe';
import { fmtDate, parseStart, roundedNow, toLocalInput } from './dough';
import { markFresh } from './lock';
import { primeBake, primeRecipe, useSaveBake, useSaveRecipe } from './query';

/** A bake is called by the day its preferment was mixed, unless you've named it. */
export function bakeName(b: Pick<Bake, 'name' | 'start'>) {
  if (b.name) return b.name;
  const start = parseStart(b.start);
  return start ? fmtDate(start) : 'New bake';
}

/** Makes a recipe and opens it, ready to edit. */
export function useCreateRecipe() {
  const save = useSaveRecipe();
  const navigate = useNavigate();
  return (kind: Kind, init: { name?: string; settings?: Settings; notes?: string } = {}) => {
    const now = Date.now();
    const r: Recipe = {
      id: newId(),
      kind,
      name: (init.name?.trim() || `${KIND_NAME[kind]} dough`).slice(0, LIMITS.name),
      settings: normalise(kind, init.settings ?? DEFAULTS[kind]),
      notes: init.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };
    primeRecipe(r); // synchronously, so the page never renders "not found" for a frame
    markFresh(r.id);
    save.mutate(r);
    navigate({ to: '/r/$id', params: { id: r.id }, viewTransition: { types: ['push'] } });
    return r;
  };
}

/** Starts a bake of a recipe, mixed now, and opens it ready to tweak. */
export function useStartBake() {
  const save = useSaveBake();
  const navigate = useNavigate();
  return (recipe: Pick<Recipe, 'id' | 'kind'>, settings: Settings) => {
    const now = Date.now();
    const b: Bake = {
      id: newId(),
      recipeId: recipe.id,
      kind: recipe.kind,
      name: '',
      settings: normalise(recipe.kind, settings),
      start: toLocalInput(roundedNow()),
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
