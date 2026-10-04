import { MutationCache, QueryCache, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';
import type { Bake, Kind, Play, Playground, Recipe, Settings } from '../../shared/recipe';
import type { Topping } from '../../shared/topping';
import { api, ApiError, isAuthError } from './api';
import { toast } from './toast';

export const RECIPES = ['recipes'] as const;
export const BAKES = ['bakes'] as const;
export const PLAYGROUND = ['playground'] as const;
export const TOPPINGS = ['toppings'] as const;
export const SESSION = ['session'] as const;

// Mutation keys are [entity, operation]. The recipe ones predate bakes and must keep their names so
// saves queued offline by an older version of the app still replay.
type Entity = 'recipe' | 'bake' | 'playground' | 'topping';
const RECIPE_SAVE = ['recipe', 'save'] as const;
const RECIPE_DELETE = ['recipe', 'delete'] as const;
const BAKE_SAVE = ['bake', 'save'] as const;
const BAKE_DELETE = ['bake', 'delete'] as const;
const PLAY_SAVE = ['playground', 'save'] as const;
const TOPPING_SAVE = ['topping', 'save'] as const;
const TOPPING_DELETE = ['topping', 'delete'] as const;

/** Every write shares one queue, so they reach the server in order (a recipe before its first bake). */
const scope = { id: 'recipes' };

type DeleteVars = { id: string };
export type PlayVars = { kind: Kind; settings: Settings; updatedAt: number };

const retry = (count: number, err: unknown) => !(err instanceof ApiError && err.status < 500 && err.status !== 429) && count < 3;

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => {
      if (isAuthError(err)) queryClient.setQueryData(SESSION, null);
    },
  }),
  mutationCache: new MutationCache({
    onError: (err) => {
      if (isAuthError(err)) queryClient.setQueryData(SESSION, null);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24 * 30, // keep for the persisted cache
      retry,
    },
    mutations: { retry, retryDelay: (n) => Math.min(1000 * 2 ** n, 15_000) },
  },
});

/* ---------- optimistic helpers ---------- */

type Item = { id: string; updatedAt: number };

const byUpdated = (a: Item, b: Item) => b.updatedAt - a.updatedAt;

function upsert<T extends Item>(list: T[] | undefined, x: T): T[] {
  const rest = (list ?? []).filter((y) => y.id !== x.id);
  return [x, ...rest].sort(byUpdated);
}
const without = <T extends Item>(list: T[] | undefined, id: string) => (list ?? []).filter((x) => x.id !== id);
const withoutRecipe = (list: Bake[] | undefined, recipeId: string) => (list ?? []).filter((b) => b.recipeId !== recipeId);

/** Writes that haven't reached the server yet, oldest first. */
function unsent() {
  return queryClient
    .getMutationCache()
    .getAll()
    .filter((m) => m.state.status === 'pending' || m.state.isPaused)
    .sort((a, b) => a.state.submittedAt - b.state.submittedAt)
    .map((m) => ({ entity: m.options.mutationKey?.[0] as Entity, op: m.options.mutationKey?.[1], vars: m.state.variables }));
}

/** Re-apply saves/deletes that haven't reached the server yet on top of fresh server data. */
function applyPending<T extends Item>(entity: 'recipe' | 'bake' | 'topping', list: T[]): T[] {
  for (const m of unsent()) {
    if (m.entity === entity && m.op === 'save') list = upsert(list, m.vars as T);
    if (m.entity === entity && m.op === 'delete') list = without(list, (m.vars as DeleteVars).id);
    // Deleting a recipe deletes its bakes.
    if (entity === 'bake' && m.entity === 'recipe' && m.op === 'delete')
      list = withoutRecipe(list as unknown as Bake[], (m.vars as DeleteVars).id) as unknown as T[];
  }
  return list;
}

/** Put a recipe or bake in the cache right now (e.g. before navigating to it). */
export const primeRecipe = (r: Recipe) => queryClient.setQueryData<Recipe[]>(RECIPES, (list) => upsert(list, r));
export const primeBake = (b: Bake) => queryClient.setQueryData<Bake[]>(BAKES, (list) => upsert(list, b));
export const primeTopping = (t: Topping) => queryClient.setQueryData<Topping[]>(TOPPINGS, (list) => upsert(list, t));

function failed(err: unknown, fallback: string, refetch: readonly string[]) {
  if (isAuthError(err)) return;
  toast(err instanceof ApiError ? err.message : fallback);
  queryClient.invalidateQueries({ queryKey: refetch });
}

/* ---------- mutation defaults (so paused mutations can resume after a reload) ---------- */

/** Saves and deletes for a list of items, applied to the cache straight away. */
function listMutations<T extends Item>(o: {
  entity: 'recipe' | 'bake' | 'topping';
  list: readonly [string];
  url: string;
  one: string;
  body: (x: T) => unknown;
  onDelete?: (id: string) => void;
}) {
  queryClient.setMutationDefaults([o.entity, 'save'], {
    mutationFn: (x: T) => api<Record<string, T>>(`${o.url}/${x.id}`, { method: 'PUT', json: o.body(x) }).then((r) => r[o.one]),
    onMutate: async (x: T) => {
      await queryClient.cancelQueries({ queryKey: o.list });
      queryClient.setQueryData<T[]>(o.list, (list) => upsert(list, x));
    },
    onSuccess: (saved: T) => {
      // Server copy wins only if nothing newer is queued locally.
      queryClient.setQueryData<T[]>(o.list, (list) => {
        const cur = list?.find((x) => x.id === saved.id);
        return cur && cur.updatedAt > saved.updatedAt ? list : upsert(list, saved);
      });
    },
    onError: (err: unknown) => failed(err, "Couldn't save your changes. They'll stay on this device.", o.list),
  });
  queryClient.setMutationDefaults([o.entity, 'delete'], {
    mutationFn: ({ id }: DeleteVars) => api<void>(`${o.url}/${id}`, { method: 'DELETE' }),
    onMutate: async ({ id }: DeleteVars) => {
      await queryClient.cancelQueries({ queryKey: o.list });
      queryClient.setQueryData<T[]>(o.list, (list) => without(list, id));
      o.onDelete?.(id);
    },
    onError: (err: unknown) => failed(err, `Couldn't delete that ${o.entity}.`, o.list),
  });
}

listMutations<Recipe>({
  entity: 'recipe',
  list: RECIPES,
  url: '/api/recipes',
  one: 'recipe',
  body: (r) => ({ kind: r.kind, name: r.name, settings: r.settings, notes: r.notes, createdAt: r.createdAt, updatedAt: r.updatedAt }),
  // The server deletes a recipe's bakes with it.
  onDelete: (id) => queryClient.setQueryData<Bake[]>(BAKES, (list) => withoutRecipe(list, id)),
});

listMutations<Bake>({
  entity: 'bake',
  list: BAKES,
  url: '/api/bakes',
  one: 'bake',
  body: (b) => ({
    recipeId: b.recipeId,
    kind: b.kind,
    name: b.name,
    settings: b.settings,
    start: b.start,
    notes: b.notes,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }),
});

listMutations<Topping>({
  entity: 'topping',
  list: TOPPINGS,
  url: '/api/toppings',
  one: 'topping',
  body: (t) => ({ name: t.name, data: t.data, createdAt: t.createdAt, updatedAt: t.updatedAt }),
});

const EMPTY_PLAYGROUND: Playground = { biga: null, poolish: null };

queryClient.setMutationDefaults(PLAY_SAVE, {
  mutationFn: (v: PlayVars) =>
    api<{ play: Play | null }>(`/api/playground/${v.kind}`, { method: 'PUT', json: { settings: v.settings, updatedAt: v.updatedAt } }),
  onMutate: async (v: PlayVars) => {
    await queryClient.cancelQueries({ queryKey: PLAYGROUND });
    queryClient.setQueryData<Playground>(PLAYGROUND, (p) => ({ ...EMPTY_PLAYGROUND, ...p, [v.kind]: { settings: v.settings, updatedAt: v.updatedAt } }));
  },
  onSuccess: (res: { play: Play | null }, v: PlayVars) => {
    const play = res.play;
    if (!play) return;
    queryClient.setQueryData<Playground>(PLAYGROUND, (p) => {
      const cur = p?.[v.kind];
      return cur && cur.updatedAt > play.updatedAt ? p : { ...EMPTY_PLAYGROUND, ...p, [v.kind]: play };
    });
  },
  onError: (err: unknown) => failed(err, "Couldn't save the playground. It'll stay on this device.", PLAYGROUND),
});

/* ---------- hooks ---------- */

export function useRecipes(enabled = true) {
  return useQuery({
    queryKey: RECIPES,
    queryFn: async () => applyPending('recipe', (await api<{ recipes: Recipe[] }>('/api/recipes')).recipes.sort(byUpdated)),
    enabled,
  });
}

export function useRecipe(id: string) {
  const q = useRecipes();
  return { ...q, recipe: q.data?.find((r) => r.id === id) };
}

export function useBakes() {
  return useQuery({
    queryKey: BAKES,
    queryFn: async () => applyPending('bake', (await api<{ bakes: Bake[] }>('/api/bakes')).bakes.sort(byUpdated)),
  });
}

export function useBake(id: string) {
  const q = useBakes();
  return { ...q, bake: q.data?.find((b) => b.id === id) };
}

export function useToppings(enabled = true) {
  return useQuery({
    queryKey: TOPPINGS,
    queryFn: async () => applyPending('topping', (await api<{ toppings: Topping[] }>('/api/toppings')).toppings.sort(byUpdated)),
    enabled,
  });
}

export function useTopping(id: string) {
  const q = useToppings();
  return { ...q, topping: q.data?.find((t) => t.id === id) };
}

export function usePlayground() {
  return useQuery({
    queryKey: PLAYGROUND,
    queryFn: async () => {
      let p = (await api<{ playground: Playground }>('/api/playground')).playground;
      for (const m of unsent()) {
        if (m.entity !== 'playground') continue;
        const v = m.vars as PlayVars;
        p = { ...p, [v.kind]: { settings: v.settings, updatedAt: v.updatedAt } };
      }
      return p;
    },
  });
}

/** Writes run one at a time, in order, across recipes, bakes, the playground and toppings. */
export const useSaveRecipe = () => useMutation<Recipe, unknown, Recipe>({ mutationKey: RECIPE_SAVE, scope });
export const useDeleteRecipe = () => useMutation<void, unknown, DeleteVars>({ mutationKey: RECIPE_DELETE, scope });
export const useSaveBake = () => useMutation<Bake, unknown, Bake>({ mutationKey: BAKE_SAVE, scope });
export const useDeleteBake = () => useMutation<void, unknown, DeleteVars>({ mutationKey: BAKE_DELETE, scope });
export const useSavePlay = () => useMutation<{ play: Play | null }, unknown, PlayVars>({ mutationKey: PLAY_SAVE, scope });
export const useSaveTopping = () => useMutation<Topping, unknown, Topping>({ mutationKey: TOPPING_SAVE, scope });
export const useDeleteTopping = () => useMutation<void, unknown, DeleteVars>({ mutationKey: TOPPING_DELETE, scope });

export function useQc() {
  return useQueryClient();
}

/* ---------- persistence ---------- */

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'biga-cache',
  throttleTime: 500,
});

const persistOptions = {
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 30,
  buster: 'v1',
};

/** Restore the cache synchronously-ish before first render so the app opens instantly, even offline. */
export async function restoreCache() {
  try {
    await persistQueryClientRestore(persistOptions);
  } catch {
    /* corrupt cache: start fresh */
  }
  persistQueryClientSubscribe(persistOptions);
  queryClient.resumePausedMutations();
}

export function hasPendingWrites() {
  return queryClient.isMutating() > 0 || queryClient.getMutationCache().getAll().some((m) => m.state.isPaused);
}
