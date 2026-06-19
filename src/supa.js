/* Supabase-auth-client. Config via window-globals (runtime instelbaar, net als
   window.__PVA_BACKEND__) zodat er geen rebuild nodig is om de sleutels te zetten.
   De anon public key mag in de frontend staan. Geen config (of supabase-lib niet
   geladen) → client is null en de app draait in demo-modus zonder login. */

const URL_ = (typeof window !== "undefined" && window.__SUPABASE_URL__) || "";
const KEY_ = (typeof window !== "undefined" && window.__SUPABASE_ANON_KEY__) || "";
const lib = (typeof window !== "undefined" && window.supabase) || null;

export const supa = (URL_ && KEY_ && lib)
  ? lib.createClient(URL_, KEY_, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export function authConfigured() { return !!supa; }

export async function currentSession() {
  if (!supa) return null;
  const { data } = await supa.auth.getSession();
  return data.session || null;
}

export function onAuthChange(cb) {
  if (!supa) return () => {};
  const { data } = supa.auth.onAuthStateChange((_event, session) => cb(session || null));
  return () => data.subscription.unsubscribe();
}

// Terug naar de huidige pagina na de OAuth-redirect.
const REDIRECT = typeof window !== "undefined"
  ? window.location.origin + window.location.pathname
  : undefined;

export function signIn(provider) {
  if (!supa) return Promise.resolve();
  return supa.auth.signInWithOAuth({ provider, options: { redirectTo: REDIRECT } });
}

export async function signOut() { if (supa) await supa.auth.signOut(); }
