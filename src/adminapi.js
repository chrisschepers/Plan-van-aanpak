/* Frontend-helpers voor de adminendpoints. Bearer-token + BACKEND_URL, zoals
   src/credits.js. De backend bepaalt of je admin bent (server-side gate). */

import { BACKEND_URL } from "./config.js";

function api(p) { return BACKEND_URL.replace(/\/$/, "") + p; }
function auth(token) { return { Authorization: `Bearer ${token}` }; }

// Is de ingelogde gebruiker admin? Bepaalt of de "Beheer"-knop verschijnt.
export async function checkAdmin(token) {
  if (!BACKEND_URL || !token) return false;
  try {
    const r = await fetch(api("/api/admin/me"), { headers: auth(token) });
    if (!r.ok) return false;
    return !!(await r.json()).admin;
  } catch { return false; }
}

export async function adminListUsers(token) {
  const r = await fetch(api("/api/admin/users"), { headers: auth(token) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Serverfout (${r.status})`);
  return (await r.json()).users || [];
}

export async function adminStats(token) {
  const r = await fetch(api("/api/admin/stats"), { headers: auth(token) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Serverfout (${r.status})`);
  return r.json();
}

export async function adminAdjust(token, userId, amount, note) {
  const r = await fetch(api("/api/admin/credits"), {
    method: "POST",
    headers: { ...auth(token), "content-type": "application/json" },
    body: JSON.stringify({ userId, amount, note }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Serverfout (${r.status})`);
  return (await r.json()).balance;
}

export async function adminUserTransactions(token, userId) {
  const r = await fetch(api(`/api/admin/user/${userId}/transactions`), { headers: auth(token) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Serverfout (${r.status})`);
  return (await r.json()).transactions || [];
}
