import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { authClient, signOut, useSession } from '../lib/auth';
import { setTheme, useTheme, type Theme } from '../lib/theme';
import { useRecipes, hasPendingWrites } from '../lib/query';
import { toast } from '../lib/toast';
import { checkForUpdate, isStandalone } from '../lib/pwa';
import { Page } from '../components/Page';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';

export function SettingsPage() {
  const { data: user } = useSession();
  const { data: recipes } = useRecipes();
  const theme = useTheme();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<null | 'signout' | 'delete'>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doSignOut = async () => {
    setBusy(true);
    await signOut().catch(() => {});
    setBusy(false);
    navigate({ to: '/signin', replace: true });
  };

  const doDelete = async () => {
    setBusy(true);
    setErr(null);
    const res = await authClient.deleteUser({ password }).catch(() => null);
    setBusy(false);
    if (!res || res.error) {
      setErr(res?.error?.code === 'INVALID_PASSWORD' ? 'That password isn’t right.' : 'Couldn’t delete your account. Try again.');
      return;
    }
    await signOut().catch(() => {});
    toast('Your account and recipes have been deleted.');
    navigate({ to: '/signin', replace: true });
  };

  return (
    <Page
      title="Settings"
      large={<h1>Settings</h1>}
      left={
        <Link to="/" className="nav-btn back" aria-label="Back to recipes" viewTransition={{ types: ['pop'] }}>
          <Icon name="back" />
          <span>Recipes</span>
        </Link>
      }
    >
      <div className="group-label">Account</div>
      <ul className="group">
        <li className="cell">
          <span>Email</span>
          <span className="cell-val">{user?.email}</span>
        </li>
        <li className="cell">
          <span>Recipes</span>
          <span className="cell-val">{recipes?.length ?? '–'}</span>
        </li>
        <li>
          <button
            type="button"
            className="cell action"
            onClick={() => (hasPendingWrites() ? setConfirm('signout') : doSignOut())}
            disabled={busy}
          >
            Sign out
          </button>
        </li>
      </ul>

      <div className="group-label">Appearance</div>
      <div className="segmented" role="radiogroup" aria-label="Theme">
        {(['system', 'light', 'dark'] as Theme[]).map((t) => (
          <button key={t} type="button" role="radio" aria-checked={theme === t} onClick={() => setTheme(t)}>
            {t === 'system' ? 'Auto' : t === 'light' ? 'Light' : 'Dark'}
          </button>
        ))}
      </div>

      <div className="group-label">App</div>
      <ul className="group">
        <li>
          <button
            type="button"
            className="cell action plain"
            onClick={async () => {
              const found = await checkForUpdate();
              toast(found ? 'Updating…' : 'You’re on the latest version.');
            }}
          >
            Check for updates
          </button>
        </li>
        {!isStandalone() ? (
          <li className="cell wrap">
            <span>
              <b>Install the app.</b>{' '}
              {/iP(hone|ad|od)/.test(navigator.userAgent)
                ? 'In Safari, tap Share, then “Add to Home Screen”.'
                : 'Use your browser’s “Install app” or “Add to Home screen” menu item.'}{' '}
              It opens full screen and works offline.
            </span>
          </li>
        ) : null}
      </ul>

      <div className="group-label">Danger zone</div>
      <ul className="group">
        <li>
          <button type="button" className="cell action danger" onClick={() => setConfirm('delete')}>
            Delete account
          </button>
        </li>
      </ul>
      <p className="fine center">Biga · v{__APP_VERSION__}</p>

      <Sheet open={confirm === 'signout'} onClose={() => setConfirm(null)} title="Sign out with unsaved changes?">
        <p className="sheet-text">Some edits haven’t reached the server yet. Signing out now will lose them.</p>
        <div className="sheet-actions">
          <button type="button" className="btn danger block" onClick={doSignOut} disabled={busy}>
            Sign out anyway
          </button>
          <button type="button" className="btn block" onClick={() => setConfirm(null)}>
            Stay signed in
          </button>
        </div>
      </Sheet>

      <Sheet
        open={confirm === 'delete'}
        onClose={() => {
          setConfirm(null);
          setPassword('');
          setErr(null);
        }}
        title="Delete your account?"
      >
        <p className="sheet-text">This permanently deletes your account and all {recipes?.length ?? ''} recipes. It can’t be undone.</p>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            doDelete();
          }}
        >
          <label className="field">
            <span>Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {err ? (
            <p className="form-error" role="alert">
              {err}
            </p>
          ) : null}
          <div className="sheet-actions">
            <button type="submit" className="btn danger block" disabled={busy || !password}>
              Delete everything
            </button>
            <button type="button" className="btn block" onClick={() => setConfirm(null)}>
              Cancel
            </button>
          </div>
        </form>
      </Sheet>
    </Page>
  );
}
