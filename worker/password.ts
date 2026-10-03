// Password hashing that fits the Workers Free plan's 10 ms CPU budget.
//
// Better Auth's default (scrypt N=16384, r=16) costs ~90 ms of CPU per hash, which trips error 1102
// on the free plan. PBKDF2-SHA256 runs natively in WebCrypto; Cloudflare caps it at 100,000
// iterations. Below OWASP's 600k for PBKDF2, so the derived key is also HMAC'd with a pepper: a
// secret that lives in the Worker, never in D1, so a leaked database alone can't be cracked.
//
// Format: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>. The prefix lets us change algorithm
// (e.g. scrypt on a paid plan) later and re-hash on the next sign-in.

const MAX_ITERATIONS = 100_000; // production hard cap for PBKDF2 in Workers
const enc = new TextEncoder();

const b64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

async function derive(password: string, salt: Uint8Array, iterations: number, pepper: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256),
  );
  const hk = await crypto.subtle.importKey('raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', hk, bits));
}

export function passwordHasher(pepper: string, iterations = MAX_ITERATIONS) {
  const iter = Math.min(MAX_ITERATIONS, Math.max(10_000, Math.floor(iterations)));
  return {
    async hash(password: string) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      return `pbkdf2-sha256$${iter}$${b64(salt)}$${b64(await derive(password, salt, iter, pepper))}`;
    },
    async verify({ hash, password }: { hash: string; password: string }) {
      const [alg, it, s, h] = hash.split('$');
      const n = Number(it);
      if (alg !== 'pbkdf2-sha256' || !s || !h || !Number.isInteger(n) || n < 1 || n > MAX_ITERATIONS) return false;
      return timingSafeEqual(await derive(password, unb64(s), n, pepper), unb64(h));
    },
  };
}
