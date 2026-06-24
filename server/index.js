/* Express-backend voor de AI-extractie. Deploybaar op Railway.
   Endpoints:
     GET  /health          → status
     POST /api/extract     → multipart 'document' (PDF/Word) OF JSON { text }
                             → gestructureerde functionele gegevens (JSON)

   Vereist de omgevingsvariabele ANTHROPIC_API_KEY (zet die op Railway).
   Optioneel: ALLOWED_ORIGIN (komma-gescheiden) voor CORS, PVA_MODEL, PORT. */

import express from "express";
import cors from "cors";
import multer from "multer";
import mammoth from "mammoth";
import { extractFields } from "./extract.js";
import { redactBSN } from "./redact.js";
import { requireAuth, authConfigured } from "./auth.js";
import { creditsConfigured, consumeCredit, refundCredit, addCredits, getBalance, BUNDLES, redeemPromo } from "./credits.js";
import { requireAdmin, isAdminEmail, adminUsers, adminAdjust, adminUserTransactions, adminStats, adminListPromos, adminCreatePromo, adminSetPromoActive, adminPromoRedemptions, isBlocked, adminSetBlocked, deleteUser } from "./admin.js";

const app = express();
app.set("trust proxy", 1); // achter de Railway-proxy: gebruik X-Forwarded-For voor req.ip
app.use(express.json({ limit: "2mb" }));

// CORS: fail-closed. Zonder ALLOWED_ORIGIN geldt de productie-origin (GitHub
// Pages), NIET "*". Zet ALLOWED_ORIGIN (komma-gescheiden) voor een eigen domein.
const DEFAULT_ORIGINS = ["https://chrisschepers.github.io"];
const allowedRaw = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
const allowed = allowedRaw.length ? allowedRaw : DEFAULT_ORIGINS;
const openCors = allowed.includes("*");
app.use(cors({ origin: openCors ? true : allowed }));
if (openCors) console.warn("LET OP: CORS staat open voor alle origins (ALLOWED_ORIGIN=*). Beperk dit in productie.");

// Eenvoudige in-memory rate-limiter per IP (één Railway-instance, geen externe
// dependency): beschermt /api/extract tegen kostenmisbruik. Instelbaar via env.
// In-memory rate-limiter per IP (één Railway-instance, geen externe dependency).
function makeRateLimit(max, windowMs) {
  const hits = new Map(); // ip -> timestamps[]
  return function (req, res, next) {
    const now = Date.now();
    const ip = req.ip || "onbekend";
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      res.set("Retry-After", String(Math.ceil(windowMs / 1000)));
      return res.status(429).json({ error: "Te veel verzoeken vanaf dit adres. Probeer het later opnieuw." });
    }
    recent.push(now);
    hits.set(ip, recent);
    // Opruimen: verwijder IP's zonder recente activiteit zodra de map groot wordt.
    if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    next();
  };
}
const rateLimit = makeRateLimit(parseInt(process.env.PVA_RATE_MAX || "20", 10), parseInt(process.env.PVA_RATE_WINDOW_MS || String(10 * 60 * 1000), 10));
const webhookLimit = makeRateLimit(120, 60 * 1000); // webhook: ruim, maar tegen misbruik/DoS
const WEBHOOK_SECRET = (process.env.PVA_WEBHOOK_SECRET || "").trim(); // optioneel geheim padsegment

// Geblokkeerd account? Tegenhouden. Faalt veilig OPEN: een check-fout legt niet
// de hele dienst plat. Draait na requireAuth (req.user gezet).
async function blockGuard(req, res, next) {
  try {
    if (req.user && req.user.id && await isBlocked(req.user.id)) {
      return res.status(403).json({ error: "Je account is geblokkeerd. Neem contact op via planvanaanpakinvuller@gmail.com." });
    }
  } catch { /* bij twijfel doorlaten */ }
  next();
}

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: process.env.PVA_MODEL || "claude-opus-4-8", keyConfigured: !!process.env.ANTHROPIC_API_KEY, authRequired: authConfigured(), credits: creditsConfigured() });
});

app.post("/api/extract", rateLimit, requireAuth, blockGuard, upload.single("document"), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Server niet geconfigureerd: ANTHROPIC_API_KEY ontbreekt." });
    }

    let blocks;
    const file = req.file;
    const pastedText = (req.body && req.body.text ? String(req.body.text) : "").trim();

    if (file) {
      const name = (file.originalname || "").toLowerCase();
      const isPdf = file.mimetype === "application/pdf" || name.endsWith(".pdf");
      const isDocx = name.endsWith(".docx") || file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (isPdf) {
        // Claude leest PDF's native als document-block.
        blocks = [{
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.buffer.toString("base64") },
        }];
      } else if (isDocx) {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        if (!value || !value.trim()) return res.status(400).json({ error: "Geen tekst gevonden in het Word-bestand." });
        blocks = [{ type: "text", text: redactBSN(value) }];
      } else {
        // probeer als platte tekst
        const text = file.buffer.toString("utf8");
        if (!text.trim()) return res.status(400).json({ error: "Niet-ondersteund bestandstype. Gebruik PDF, .docx of platte tekst." });
        blocks = [{ type: "text", text: redactBSN(text) }];
      }
    } else if (pastedText) {
      blocks = [{ type: "text", text: redactBSN(pastedText) }];
    } else {
      return res.status(400).json({ error: "Lever een bestand (veld 'document') of { text } aan." });
    }

    const functieomschrijving = redactBSN((req.body && req.body.functieomschrijving ? String(req.body.functieomschrijving) : "").trim());

    // Credit reserveren vóór de (betaalde) AI-call. Bij fout of Stap 0-weigering
    // boeken we terug → netto kost alleen een geslaagde verwerking 1 credit, en
    // de atomaire consume voorkomt double-spend op de laatste credit.
    let reserved = false, balance = null;
    if (creditsConfigured() && req.user && req.user.id) {
      balance = await consumeCredit(req.user.id);
      if (balance === null) {
        return res.status(402).json({ error: "Je hebt geen credits meer. Koop credits om door te gaan.", code: "no_credits" });
      }
      reserved = true;
    }

    try {
      const data = await extractFields(blocks, functieomschrijving);
      // Stap 0-weigering = geen bruikbaar PvA → credit terugboeken (kost niets).
      if (reserved && data && data.inputvalidatie && data.inputvalidatie.geschikt === false) {
        try { balance = await refundCredit(req.user.id); } catch {}
        reserved = false;
      }
      res.json({ ok: true, data, balance });
    } catch (aiErr) {
      if (reserved) { try { await refundCredit(req.user.id); } catch {} reserved = false; }
      throw aiErr;
    }
  } catch (err) {
    const status = err && err.status ? err.status : 500;
    console.error("extract-fout:", err && err.message ? err.message : err);
    res.status(status).json({ error: "Extractie mislukt." });
  }
});

// ---- Credits: saldo opvragen ----
app.get("/api/credits", requireAuth, async (req, res) => {
  if (!creditsConfigured() || !req.user || !req.user.id) return res.json({ balance: null });
  try { res.json({ balance: await getBalance(req.user.id) }); }
  catch (e) { console.error("credits-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Saldo niet op te halen." }); }
});

// ---- Account verwijderen (recht op wissing) — ook voor geblokkeerde accounts ----
app.post("/api/account/delete", requireAuth, async (req, res) => {
  if (!req.user || !req.user.id) return res.status(401).json({ error: "Log in om je account te verwijderen." });
  try { await deleteUser(req.user.id); res.json({ ok: true }); }
  catch (e) { console.error("account-delete-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Account verwijderen mislukt. Probeer het later opnieuw." }); }
});

// ---- Credits: Mollie-checkout starten ----
app.post("/api/checkout", requireAuth, blockGuard, async (req, res) => {
  if (!creditsConfigured() || !process.env.MOLLIE_API_KEY) {
    return res.status(503).json({ error: "Betalen is nog niet beschikbaar." });
  }
  const bundle = BUNDLES[req.body && req.body.bundle];
  if (!bundle) return res.status(400).json({ error: "Onbekende bundel." });
  const siteUrl = process.env.PVA_SITE_URL || "https://chrisschepers.github.io/Plan-van-aanpak/";
  const backend = (process.env.PVA_PUBLIC_BACKEND || "").replace(/\/$/, "");
  try {
    const r = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        amount: { currency: "EUR", value: (bundle.cents / 100).toFixed(2) },
        description: `planvanaanpakinvuller.nl — ${bundle.label}`,
        redirectUrl: `${siteUrl}?betaling=terug`,
        webhookUrl: backend ? `${backend}/api/mollie-webhook${WEBHOOK_SECRET ? "/" + encodeURIComponent(WEBHOOK_SECRET) : ""}` : undefined,
        metadata: { userId: req.user.id, credits: bundle.credits, bundle: req.body.bundle, cents: bundle.cents },
      }),
    });
    if (!r.ok) return res.status(502).json({ error: "Kon de betaling niet starten." });
    const payment = await r.json();
    res.json({ checkoutUrl: payment._links.checkout.href });
  } catch (e) {
    console.error("checkout-fout:", e && e.message ? e.message : e);
    res.status(502).json({ error: "Kon de betaling niet starten." });
  }
});

// ---- Credits: Mollie-webhook (server-naar-server; status bij Mollie verifiëren) ----
app.post("/api/mollie-webhook/:secret?", webhookLimit, express.urlencoded({ extended: false }), async (req, res) => {
  if (WEBHOOK_SECRET && req.params.secret !== WEBHOOK_SECRET) return res.status(404).end();
  const id = req.body && req.body.id;
  if (!id) return res.status(400).end();
  if (!process.env.MOLLIE_API_KEY || !creditsConfigured()) return res.status(200).end();
  try {
    const r = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
    });
    if (!r.ok) return res.status(200).end();
    const p = await r.json();
    if (p.status === "paid") {
      const m = p.metadata || {};
      if (m.userId && m.credits) {
        await addCredits(m.userId, Number(m.credits), p.id, m.bundle || null, m.cents ? Number(m.cents) : null);
      }
    }
    res.status(200).end();
  } catch (e) {
    console.error("mollie-webhook-fout:", e && e.message ? e.message : e);
    res.status(500).end(); // Mollie retryt later
  }
});

// ---- Admin (superuser): gebruikersbeheer + credits + cijfers ----
// 'me' staat alleen achter requireAuth zodat de frontend de knop kan tonen;
// de echte data-endpoints staan achter requireAuth + requireAdmin.
app.get("/api/admin/me", requireAuth, (req, res) => {
  res.json({ admin: isAdminEmail(req.user && req.user.email) });
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
  try { res.json({ users: await adminUsers() }); }
  catch (e) { console.error("admin-users-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de gebruikers niet laden." }); }
});

app.post("/api/admin/credits", requireAuth, requireAdmin, async (req, res) => {
  const userId = req.body && req.body.userId;
  const amount = parseInt(req.body && req.body.amount, 10);
  const note = (req.body && req.body.note ? String(req.body.note) : "").slice(0, 200);
  if (!userId || !Number.isFinite(amount) || amount === 0) {
    return res.status(400).json({ error: "Geef een userId en een bedrag (≠ 0)." });
  }
  try { res.json({ balance: await adminAdjust(userId, amount, note) }); }
  catch (e) { console.error("admin-credits-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "De mutatie is mislukt." }); }
});

app.get("/api/admin/user/:id/transactions", requireAuth, requireAdmin, async (req, res) => {
  try { res.json({ transactions: await adminUserTransactions(req.params.id) }); }
  catch (e) { console.error("admin-tx-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de historie niet laden." }); }
});

app.post("/api/admin/user/:id/block", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id;
  if (id === (req.user && req.user.id)) return res.status(400).json({ error: "Je kunt jezelf niet blokkeren." });
  try { res.json({ flag: await adminSetBlocked(id, !!(req.body && req.body.blocked), (req.body && req.body.reason) || null) }); }
  catch (e) { console.error("block-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de blokkade niet wijzigen." }); }
});

app.get("/api/admin/stats", requireAuth, requireAdmin, async (_req, res) => {
  try { res.json(await adminStats()); }
  catch (e) { console.error("admin-stats-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de cijfers niet laden." }); }
});

// ---- Actiecode inwisselen (ingelogde gebruiker) ----
const REDEEM_MSG = {
  onbekend: "Deze code bestaat niet.",
  inactief: "Deze code is niet meer actief.",
  verlopen: "Deze code is verlopen.",
  uitgeput: "Deze code is al maximaal gebruikt.",
  al_gebruikt: "Je hebt deze code al ingewisseld.",
};
app.post("/api/redeem", rateLimit, requireAuth, blockGuard, async (req, res) => {
  if (!creditsConfigured()) return res.status(503).json({ error: "Actiecodes zijn nog niet beschikbaar." });
  if (!req.user || !req.user.id) return res.status(401).json({ error: "Log in om een code in te wisselen." });
  const code = (req.body && req.body.code ? String(req.body.code) : "").trim();
  if (!code) return res.status(400).json({ error: "Geef een actiecode op." });
  try {
    const result = await redeemPromo(req.user.id, code);
    if (result && result.ok) return res.json({ ok: true, balance: result.balance, credits: result.credits });
    return res.status(409).json({ error: REDEEM_MSG[result && result.reason] || "Deze code kon niet worden ingewisseld." });
  } catch (e) {
    console.error("redeem-fout:", e && e.message ? e.message : e);
    res.status(502).json({ error: "Inwisselen mislukt. Probeer het later opnieuw." });
  }
});

// ---- Admin: actiecodes beheren ----
app.get("/api/admin/promos", requireAuth, requireAdmin, async (_req, res) => {
  try { res.json({ promos: await adminListPromos() }); }
  catch (e) { console.error("promos-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de codes niet laden." }); }
});
app.post("/api/admin/promos", requireAuth, requireAdmin, async (req, res) => {
  const b = req.body || {};
  const code = String(b.code || "").trim();
  const credits = parseInt(b.credits, 10);
  if (!code || !Number.isFinite(credits) || credits <= 0) return res.status(400).json({ error: "Geef een code en een positief aantal credits." });
  try { res.json({ promo: await adminCreatePromo(b) }); }
  catch (e) { console.error("promo-create-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de code niet aanmaken (bestaat 'ie al?)." }); }
});
app.post("/api/admin/promos/:code/active", requireAuth, requireAdmin, async (req, res) => {
  try { res.json({ promo: await adminSetPromoActive(req.params.code, !!(req.body && req.body.active)) }); }
  catch (e) { console.error("promo-active-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de status niet wijzigen." }); }
});
app.get("/api/admin/promos/:code/redemptions", requireAuth, requireAdmin, async (req, res) => {
  try { res.json({ redemptions: await adminPromoRedemptions(req.params.code) }); }
  catch (e) { console.error("promo-redemptions-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Kon de inwisselingen niet laden." }); }
});

// ---- Admin: systeemstatus ----
app.get("/api/admin/system", requireAuth, requireAdmin, (_req, res) => {
  res.json({
    model: process.env.PVA_MODEL || "claude-opus-4-8",
    aiKey: !!process.env.ANTHROPIC_API_KEY,
    auth: authConfigured(),
    credits: creditsConfigured(),
    mollie: !!process.env.MOLLIE_API_KEY,
    rateMax: parseInt(process.env.PVA_RATE_MAX || "20", 10),
    rateWindowMin: Math.round(parseInt(process.env.PVA_RATE_WINDOW_MS || String(10 * 60 * 1000), 10) / 60000),
    allowedOrigin: process.env.ALLOWED_ORIGIN || "*",
  });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`PvA-backend luistert op poort ${port}`));
