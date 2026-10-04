import { MutationCache, QueryCache, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';
import type { Recipe } from '../../shared/recipe';
import type { Topping } from '../../shared/topping';
import { api, ApiError, isAuthError } from './api';
import { toast } from './toast';

export const SESSION = ['session'] as const;

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

/* ---------- synced collections (recipes, toppings) ---------- */

type Doc = { id: string; updatedAt: number };
type DeleteVars = { id: string };

/**
 * A per-user list kept in the query cache and synced to `/api/<plural>`, with optimistic saves and
 * deletes that survive going offline and reloading.
 */
function collection<T extends Doc>(c: { noun: 'recipe' | 'topping'; body: (d: T) => unknown }) {
  const plural = `${c.noun}s`;
  const LIST = [plural] as const;
  const SAVE = [c.noun, 'save'] as const;
  const DELETE = [c.noun, 'delete'] as const;
  const scope = { id: plural };

  const byUpdated = (a: T, b: T) => b.updatedAt - a.updatedAt;
  const upsert = (list: T[] | undefined, d: T): T[] => [d, ...(list ?? []).filter((x) => x.id !== d.id)].sort(byUpdated);
  const remove = (list: T[] | undefined, id: string) => (list ?? []).filter((x) => x.id !== id);

  /** Re-apply saves/deletes that haven't reached the server yet on top of fresh server data. */
  function applyPending(list: T[]): T[] {
    const pending = queryClient
      .getMutationCache()
      .getAll()
      .filter((m) => m.options.mutationKey?.[0] === c.noun && (m.state.status === 'pending' || m.state.isPaused))
      .sort((a, b) => a.state.submittedAt - b.state.submittedAt);
    for (const m of pending) {
      const key = m.options.mutationKey?.[1];
      if (key === 'save') list = upsert(list, m.state.variables as T);
      if (key === 'delete') list = remove(list, (m.state.variables as DeleteVars).id);
    }
    return list;
  }

  // Mutation defaults, so paused mutations can resume after a reload.
  queryClient.setMutationDefaults(SAVE, {
    mutationFn: (d: T) => api<Record<string, T>>(`/api/${plural}/${d.id}`, { method: 'PUT', json: c.body(d) }),
    onMutate: async (d: T) => {
      await queryClient.cancelQueries({ queryKey: LIST });
      queryClient.setQueryData<T[]>(LIST, (list) => upsert(list, d));
    },
    onSuccess: (res: Record<string, T>) => {
      const saved = res[c.noun];
      // Server copy wins only if nothing newer is queued locally.
      queryClient.setQueryData<T[]>(LIST, (list) => {
        const cur = list?.find((x) => x.id === saved.id);
        return cur && cur.updatedAt > saved.updatedAt ? list : upsert(list, saved);
      });
    },
    onError: (err: unknown) => {
      if (isAuthError(err)) return;
      toast(err instanceof ApiError ? err.message : "Couldn't save your changes. They'll stay on this device.");
      queryClient.invalidateQueries({ queryKey: LIST });
    },
  });

  queryClient.setMutationDefaults(DELETE, {
    mutationFn: ({ id }: DeleteVars) => api<void>(`/api/${plural}/${id}`, { method: 'DELETE' }),
    onMutate: async ({ id }: DeleteVars) => {
      await queryClient.cancelQueries({ queryKey: LIST });
      queryClient.setQueryData<T[]>(LIST, (list) => remove(list, id));
    },
    onError: (err: unknown) => {
      if (isAuthError(err)) return;
      toast(`Couldn't delete that ${c.noun}.`);
      queryClient.invalidateQueries({ queryKey: LIST });
    },
  });

  const useList = (enabled = true) =>
    useQuery({
      queryKey: LIST,
      queryFn: async () => applyPending((await api<Record<string, T[]>>(`/api/${plural}`))[plural].sort(byUpdated)),
      enabled,
    });

  return {
    LIST,
    useList,
    useOne(id: string) {
      const q = useList();
      return { ...q, item: q.data?.find((d) => d.id === id) };
    },
    /** Put a document in the cache right now (e.g. before navigating to it). */
    prime: (d: T) => queryClient.setQueryData<T[]>(LIST, (list) => upsert(list, d)),
    /** Saves run one at a time, in order. */
    useSave: () => useMutation<Record<string, T>, unknown, T>({ mutationKey: SAVE, scope }),
    useDelete: () => useMutation<void, unknown, DeleteVars>({ mutationKey: DELETE, scope }),
  };
}

const recipes = collection<Recipe>({
  noun: 'recipe',
  body: (r) => ({ kind: r.kind, name: r.name, settings: r.settings, createdAt: r.createdAt, updatedAt: r.updatedAt }),
});

const toppings = collection<Topping>({
  noun: 'topping',
  body: (t) => ({ name: t.name, data: t.data, createdAt: t.createdAt, updatedAt: t.updatedAt }),
});

export const RECIPES = recipes.LIST;
export const TOPPINGS = toppings.LIST;

export const useRecipes = recipes.useList;
export const primeRecipe = recipes.prime;
export const useSaveRecipe = recipes.useSave;
export const useDeleteRecipe = recipes.useDelete;
export function useRecipe(id: string) {
  const { item, ...q } = recipes.useOne(id);
  return { ...q, recipe: item };
}

export const useToppings = toppings.useList;
export const primeTopping = toppings.prime;
export const useSaveTopping = toppings.useSave;
export const useDeleteTopping = toppings.useDelete;
export function useTopping(id: string) {
  const { item, ...q } = toppings.useOne(id);
  return { ...q, topping: item };
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
