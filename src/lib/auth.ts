import { createAuthClient } from 'better-auth/client';
import { useQuery } from '@tanstack/react-query';
import { queryClient, SESSION, RECIPES, BAKES, PLAYGROUND, TOPPINGS } from './query';
import { api } from './api';

export const authClient = createAuthClient({ basePath: '/api/auth' });

/** Only what the UI needs. The session token stays in its HttpOnly cookie, never in storage. */
export type SessionUser = { id: string; email: string; name: string };

async function fetchSession(): Promise<SessionUser | null> {
  const res = await authClient.getSession();
  if (res.error) throw new Error(res.error.message || 'Session check failed');
  const u = res.data?.user;
  return u ? { id: u.id, email: u.email, name: u.name } : null;
}

/**
 * The session lives in the query cache (persisted), so the app opens straight into your recipes,
 * even offline, and revalidates in the background.
 */
export function useSession() {
  return useQuery({ queryKey: SESSION, queryFn: fetchSession, staleTime: 5 * 60_000 });
}

export function setSignedIn(user: SessionUser) {
  const prev = queryClient.getQueryData<SessionUser | null>(SESSION);
  if (prev && prev.id !== user.id) for (const queryKey of [RECIPES, BAKES, PLAYGROUND, TOPPINGS]) queryClient.removeQueries({ queryKey });
  queryClient.setQueryData(SESSION, user);
  for (const queryKey of [RECIPES, BAKES, PLAYGROUND, TOPPINGS]) queryClient.invalidateQueries({ queryKey });
}

export async function signOut() {
  try {
    await authClient.signOut();
  } finally {
    queryClient.getMutationCache().clear();
    queryClient.clear();
    queryClient.setQueryData(SESSION, null);
  }
}

export type PublicConfig = { turnstileSiteKey: string | null };

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => api<PublicConfig>('/api/config'),
    staleTime: 60 * 60_000,
  });
}
