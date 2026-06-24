/* Frontend-helpers voor het creditsysteem. Praat met de backend via hetzelfde
   patroon als src/extract.js (BACKEND_URL + Bearer-token). De bundels hier zijn
   alleen voor weergave; de server bepaalt de echte prijs. */

import { BACKEND_URL } from "./config.js";

function api(path) { return BACKEND_URL.replace(/\/$/, "") + path; }

// Saldo ophalen. Geeft een getal terug, of null (geen backend/token/credits-config).
export async function fetchBalance(accessToken) {
  if (!BACKEND_URL || !accessToken) return null;
  try {
    const r = await fetch(api("/api/credits"), { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return null;
    const { balance } = await r.json();
    return typeof balance === "number" ? balance : null;
  } catch { return null; }
}

// Start een Mollie-checkout en geef de checkout-URL terug.
export async function startCheckout(accessToken, bundle) {
  if (!BACKEND_URL || !accessToken) throw new Error("Niet ingelogd.");
  const r = await fetch(api("/api/checkout"), {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ bundle }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `Serverfout (${r.status})`);
  }
  const { checkoutUrl } = await r.json();
  return checkoutUrl;
}

// Actiecode inwisselen → { ok, balance, credits } of gooit een Error met bericht.
export async function redeemCode(accessToken, code) {
  if (!BACKEND_URL || !accessToken) throw new Error("Niet ingelogd.");
  const r = await fetch(api("/api/redeem"), {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ code }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Serverfout (${r.status})`);
  return j;
}

// Weergave-bundels (server is autoriteit op prijs).
export const BUNDLES = [
  { key: "single",   credits: 1,  price: "€3,99" },
  { key: "bundle5",  credits: 5,  price: "€18,00", note: "€3,60 p.st." },
  { key: "bundle10", credits: 10, price: "€34,00", note: "€3,40 p.st." },
];
