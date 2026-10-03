import { useRef, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { authClient, setSignedIn, useConfig } from '../lib/auth';
import { Turnstile, type TurnstileHandle } from '../components/Turnstile';
import { DoughBall } from '../components/DoughBall';
import { Icon } from '../components/Icon';

export const MIN_PASSWORD = 12;

type Mode = 'signin' | 'signup';

function message(err: { status?: number; code?: string; message?: string } | null | undefined, mode: Mode): string {
  if (!err) return 'Something went wrong. Try again.';
  if (err.status === 429) return 'Too many attempts. Wait a minute and try again.';
  switch (err.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'That email and password don’t match an account.';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'There’s already an account with that email. Sign in instead.';
    case 'PASSWORD_TOO_SHORT':
      return `Use at least ${MIN_PASSWORD} characters.`;
    case 'PASSWORD_COMPROMISED':
      return 'That password has shown up in a data breach. Pick a different one.';
    case 'INVALID_EMAIL':
      return 'That doesn’t look like an email address.';
    case 'MISSING_RESPONSE':
    case 'VERIFICATION_FAILED':
    case 'CAPTCHA_VERIFICATION_FAILED':
      return 'We couldn’t confirm you’re human. Try again.';
  }
  if (err.status === 403) return 'We couldn’t confirm you’re human. Try again.';
  return err.message || (mode === 'signin' ? 'Couldn’t sign in. Try again.' : 'Couldn’t create your account. Try again.');
}

export function AuthPage() {
  const search = useSearch({ from: '/signin' });
  const [mode, setMode] = useState<Mode>(search.mode === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ts = useRef<TurnstileHandle>(null);
  const config = useConfig();
  const navigate = useNavigate();
  const siteKey = config.data?.turnstileSiteKey ?? null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (mode === 'signup' && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    setBusy(true);
    try {
      const headers: Record<string, string> = {};
      if (siteKey) headers['x-captcha-response'] = await ts.current!.token();
      const res =
        mode === 'signin'
          ? await authClient.signIn.email({ email: email.trim(), password }, { headers })
          : await authClient.signUp.email(
              { email: email.trim(), password, name: name.trim() || email.trim().split('@')[0] },
              { headers },
            );
      if (res.error) {
        setError(message(res.error, mode));
        return;
      }
      const u = res.data.user;
      setSignedIn({ id: u.id, email: u.email, name: u.name });
      navigate({ to: '/', replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      // Turnstile tokens are single use.
      ts.current?.reset();
      setBusy(false);
    }
  };

  const swap = (m: Mode) => {
    setMode(m);
    setError(null);
    navigate({ to: '/signin', search: { mode: m }, replace: true });
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-hero">
          <DoughBall size={88} />
          <h1>Biga</h1>
          <p>Preferment recipes for pizza that's planned to the hour.</p>
        </div>

        <div className="segmented" role="tablist" aria-label="Account">
          <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => swap('signin')}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => swap('signup')}>
            Create account
          </button>
        </div>

        <form className="form" onSubmit={submit} noValidate>
          {mode === 'signup' ? (
            <label className="field">
              <span>Name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                placeholder="Optional"
              />
            </label>
          ) : null}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
            />
          </label>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <span className="pw">
              <input
                id="pw"
                type={show ? 'text' : 'password'}
                name="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                required
                minLength={mode === 'signup' ? MIN_PASSWORD : undefined}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={mode === 'signup' ? 'pw-hint' : undefined}
              />
              <button type="button" className="pw-toggle" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((v) => !v)}>
                <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
              </button>
            </span>
            {mode === 'signup' ? (
              <small id="pw-hint">At least {MIN_PASSWORD} characters. A short phrase works well; a password manager works better.</small>
            ) : null}
          </div>

          {siteKey ? <Turnstile ref={ts} siteKey={siteKey} action="auth" /> : null}

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn primary block lg" disabled={busy || !email || !password || config.isPending}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="fine">Protected by Cloudflare Turnstile. Your recipes sync to every device you sign in on.</p>
      </div>
    </div>
  );
}
