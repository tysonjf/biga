import { createRootRoute, createRoute, createRouter, lazyRouteComponent, Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router';
import { useSession } from './lib/auth';
import { useOnline, usePwaState, applyUpdate, dismissUpdate } from './lib/pwa';
import { useToast, dismiss } from './lib/toast';
import { RecipesPage } from './routes/Recipes';
import { EditorPage } from './routes/Editor';
import { SettingsPage } from './routes/Settings';
import { AuthPage } from './routes/Auth';
import { DoughBall } from './components/DoughBall';
import { Icon } from './components/Icon';

function Root() {
  const session = useSession();
  // The outlet keeps rendering the old matches until a navigation resolves, so guard on those.
  const path = useRouterState({ select: (s) => (s.resolvedLocation ?? s.location).pathname });
  const onAuth = path === '/signin';

  let body;
  if (session.data === undefined) {
    // First launch with nothing cached: brief splash while we ask the server.
    body = session.isError ? (
      <div className="splash">
        <DoughBall />
        <p>Can't reach the server.</p>
        <button type="button" className="btn" onClick={() => session.refetch()}>
          Try again
        </button>
      </div>
    ) : (
      <div className="splash" aria-busy="true">
        <DoughBall />
      </div>
    );
  } else if (session.data === null && !onAuth) {
    body = <Navigate to="/signin" replace />;
  } else if (session.data && onAuth) {
    body = <Navigate to="/" replace />;
  } else {
    body = <Outlet />;
  }

  return (
    <>
      {body}
      {session.data && TABS.some((t) => t.to === path) ? <TabBar path={path} /> : null}
      <OfflineBadge />
      <UpdateBanner />
      <Toaster />
    </>
  );
}

const TABS = [
  { to: '/', label: 'Doughs', icon: 'dough' },
  { to: '/toppings', label: 'Toppings', icon: 'pizza' },
] as const;

/** The two top-level sections. Only shown on their list pages; recipes open full screen above it. */
function TabBar({ path }: { path: string }) {
  return (
    <nav className="tabbar" aria-label="Sections">
      {TABS.map((t) => (
        <Link key={t.to} to={t.to} className="tab" aria-current={path === t.to ? 'page' : undefined}>
          <Icon name={t.icon} size={26} />
          <span>{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="offline" role="status">
      <Icon name="cloudOff" size={16} /> Offline · changes sync when you're back
    </div>
  );
}

function UpdateBanner() {
  const state = usePwaState();
  if (state !== 'update') return null;
  return (
    <div className="toast update" role="status">
      <span>A new version is ready.</span>
      <button type="button" onClick={applyUpdate}>
        Reload
      </button>
      <button type="button" className="toast-x" aria-label="Later" onClick={dismissUpdate}>
        ×
      </button>
    </div>
  );
}

function Toaster() {
  const t = useToast();
  if (!t) return null;
  return (
    <div className="toast" role="status" key={t.id}>
      <span>{t.text}</span>
      {t.action ? (
        <button
          type="button"
          onClick={() => {
            t.action!.run();
            dismiss();
          }}
        >
          {t.action.label}
        </button>
      ) : null}
    </div>
  );
}

const rootRoute = createRootRoute({ component: Root });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RecipesPage,
  validateSearch: (s: Record<string, unknown>): { new?: 'biga' | 'poolish' } =>
    s.new === 'biga' || s.new === 'poolish' ? { new: s.new } : {},
});

const recipeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/r/$id', component: EditorPage });

// The toppings pages carry the recipe collection, so they load on first visit (and are precached for offline).
const toppingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/toppings',
  component: lazyRouteComponent(() => import('./routes/Toppings'), 'ToppingsPage'),
});

const toppingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/toppings/$id',
  component: lazyRouteComponent(() => import('./routes/Topping'), 'ToppingPage'),
  validateSearch: (s: Record<string, unknown>): { edit?: true } => (s.edit === true || s.edit === 'true' ? { edit: true } : {}),
});

const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings', component: SettingsPage });

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signin',
  component: AuthPage,
  validateSearch: (s: Record<string, unknown>): { mode?: 'signin' | 'signup' } =>
    s.mode === 'signup' ? { mode: 'signup' } : {},
});

const routeTree = rootRoute.addChildren([indexRoute, recipeRoute, toppingsRoute, toppingRoute, settingsRoute, signInRoute]);

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  defaultPreload: false,
  defaultNotFoundComponent: () => <Navigate to="/" replace />,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
