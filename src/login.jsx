/* Inlogpagina — moderne kaart in huisstijl, inloggen met Google of Apple via
   Supabase. Werkt zodra window.__SUPABASE_URL__ / __SUPABASE_ANON_KEY__ gezet zijn. */

import { I } from "./data.jsx";
import { signIn, signOut, authConfigured } from "./supa.js";

const GoogleIcon = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

const AppleIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M16.37 12.78c.02 2.2 1.93 2.93 1.95 2.94-.02.05-.31 1.06-1.02 2.1-.61.9-1.25 1.79-2.26 1.81-.99.02-1.31-.59-2.44-.59-1.13 0-1.49.57-2.42.6-.97.04-1.71-.97-2.33-1.87-1.27-1.84-2.24-5.2-.94-7.47.65-1.13 1.8-1.84 3.06-1.86.96-.02 1.86.64 2.44.64.58 0 1.68-.79 2.83-.68.48.02 1.83.19 2.7 1.46-.07.04-1.61.94-1.6 2.81M14.6 5.1c.51-.62.86-1.49.77-2.35-.74.03-1.63.49-2.16 1.11-.47.55-.89 1.43-.78 2.27.82.07 1.66-.42 2.17-1.03" />
  </svg>
);

export function Login({ onClose, onOpenPrivacy, session }) {
  const configured = authConfigured();
  const email = session && session.user ? session.user.email : "";
  return (
    <div className="auth">
      <div className="auth-bar">
        <button className="tool-back" onClick={onClose}>{I.arrowLeft} Terug naar site</button>
      </div>
      <div className="auth-body">
        <div className="auth-card">
          <span className="auth-mark">{I.doc}</span>
          <h1>Inloggen</h1>
          <p className="auth-sub">
            Log in bij planvanaanpakinvuller.nl om echte terugkoppelingen te verwerken.
            Je accountgegevens blijven binnen de EER.
          </p>

          {!configured && (
            <div className="auth-note">
              {I.info}
              <span><strong>Inloggen is nog niet gekoppeld.</strong> Vul je Supabase Project URL en anon key in <code>index.html</code> in (<code>window.__SUPABASE_URL__</code> / <code>window.__SUPABASE_ANON_KEY__</code>).</span>
            </div>
          )}

          {session ? (
            <>
              <p className="auth-loggedin">Je bent ingelogd als <strong>{email || "gebruiker"}</strong>.</p>
              <button className="btn btn-primary btn-lg auth-cta" onClick={onClose}>Naar de site {I.arrowRight}</button>
              <button className="auth-social auth-signout" onClick={() => signOut()}>Uitloggen</button>
            </>
          ) : (
            <>
              <button className="auth-social" disabled={!configured} onClick={() => signIn("google")}>
                {GoogleIcon}<span>Inloggen met Google</span>
              </button>
              <button className="auth-social" disabled={!configured} onClick={() => signIn("apple")}>
                {AppleIcon}<span>Inloggen met Apple</span>
              </button>
            </>
          )}

          <p className="auth-fine">
            Door in te loggen ga je akkoord met de verwerking van je accountgegevens (e-mail, naam) zoals beschreven in de{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); if (onOpenPrivacy) onOpenPrivacy(); }}>privacyverklaring</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
