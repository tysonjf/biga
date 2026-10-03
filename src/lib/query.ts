import { MutationCache, QueryCache, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';
import type { Recipe } from '../../shared/recipe';
import { api, ApiError, isAuthError } from './api';
import { toast } from './toast';

export const RECIPES = ['recipes'] as const;
export const SESSION = ['session'] as const;

const SAVE = ['recipe', 'save'] as const;
const DELETE = ['recipe', 'delete'] as const;

type DeleteVars = { id: string };

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

const byUpdated = (a: Recipe, b: Recipe) => b.updatedAt - a.updatedAt;

function upsert(list: Recipe[] | undefined, r: Recipe): Recipe[] {
  const rest = (list ?? []).filter((x) => x.id !== r.id);
  return [r, ...rest].sort(byUpdated);
}
const remove = (list: Recipe[] | undefined, id: string) => (list ?? []).filter((x) => x.id !== id);

/** Re-apply saves/deletes that haven't reached the server yet on top of fresh server data. */
function applyPending(list: Recipe[]): Recipe[] {
  const pending = queryClient
    .getMutationCache()
    .getAll()
    .filter((m) => m.state.status === 'pending' || m.state.isPaused)
    .sort((a, b) => a.state.submittedAt - b.state.submittedAt);
  for (const m of pending) {
    const key = m.options.mutationKey?.[1];
    if (key === 'save') list = upsert(list, m.state.variables as Recipe);
    if (key === 'delete') list = remove(list, (m.state.variables as DeleteVars).id);
  }
  return list;
}

/** Put a recipe in the cache right now (e.g. before navigating to it). */
export function primeRecipe(r: Recipe) {
  queryClient.setQueryData<Recipe[]>(RECIPES, (list) => upsert(list, r));
}

/* ---------- mutation defaults (so paused mutations can resume after a reload) ---------- */

queryClient.setMutationDefaults(SAVE, {
  mutationFn: (r: Recipe) =>
    api<{ recipe: Recipe }>(`/api/recipes/${r.id}`, {
      method: 'PUT',
      json: { kind: r.kind, name: r.name, settings: r.settings, createdAt: r.createdAt, updatedAt: r.updatedAt },
    }),
  onMutate: async (r: Recipe) => {
    await queryClient.cancelQueries({ queryKey: RECIPES });
    queryClient.setQueryData<Recipe[]>(RECIPES, (list) => upsert(list, r));
  },
  onSuccess: (res: { recipe: Recipe }) => {
    // Server copy wins only if nothing newer is queued locally.
    queryClient.setQueryData<Recipe[]>(RECIPES, (list) => {
      const cur = list?.find((x) => x.id === res.recipe.id);
      return cur && cur.updatedAt > res.recipe.updatedAt ? list : upsert(list, res.recipe);
    });
  },
  onError: (err: unknown) => {
    if (isAuthError(err)) return;
    toast(err instanceof ApiError ? err.message : "Couldn't save your changes. They'll stay on this device.");
    queryClient.invalidateQueries({ queryKey: RECIPES });
  },
});

queryClient.setMutationDefaults(DELETE, {
  mutationFn: ({ id }: DeleteVars) => api<void>(`/api/recipes/${id}`, { method: 'DELETE' }),
  onMutate: async ({ id }: DeleteVars) => {
    await queryClient.cancelQueries({ queryKey: RECIPES });
    queryClient.setQueryData<Recipe[]>(RECIPES, (list) => remove(list, id));
  },
  onError: (err: unknown) => {
    if (isAuthError(err)) return;
    toast("Couldn't delete that recipe.");
    queryClient.invalidateQueries({ queryKey: RECIPES });
  },
});

/* ---------- hooks ---------- */

export function useRecipes(enabled = true) {
  return useQuery({
    queryKey: RECIPES,
    queryFn: async () => applyPending((await api<{ recipes: Recipe[] }>('/api/recipes')).recipes.sort(byUpdated)),
    enabled,
  });
}

export function useRecipe(id: string) {
  const q = useRecipes();
  return { ...q, recipe: q.data?.find((r) => r.id === id) };
}

/** Saves for the same recipe run one at a time, in order. */
export function useSaveRecipe() {
  return useMutation<{ recipe: Recipe }, unknown, Recipe>({ mutationKey: SAVE, scope: { id: 'recipes' } });
}

export function useDeleteRecipe() {
  return useMutation<void, unknown, DeleteVars>({ mutationKey: DELETE, scope: { id: 'recipes' } });
}

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
