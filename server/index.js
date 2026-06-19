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
import { creditsConfigured, consumeCredit, refundCredit, addCredits, getBalance, BUNDLES } from "./credits.js";

const app = express();
app.set("trust proxy", 1); // achter de Railway-proxy: gebruik X-Forwarded-For voor req.ip
app.use(express.json({ limit: "2mb" }));

// CORS: standaard alles toestaan (demo). Beperk in productie met ALLOWED_ORIGIN.
const allowed = (process.env.ALLOWED_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: allowed.includes("*") ? true : allowed }));
if (allowed.includes("*")) console.warn("LET OP: CORS staat open voor alle origins. Zet ALLOWED_ORIGIN in productie (bv. https://chrisschepers.github.io).");

// Eenvoudige in-memory rate-limiter per IP (één Railway-instance, geen externe
// dependency): beschermt /api/extract tegen kostenmisbruik. Instelbaar via env.
const RATE_MAX = parseInt(process.env.PVA_RATE_MAX || "20", 10);
const RATE_WINDOW_MS = parseInt(process.env.PVA_RATE_WINDOW_MS || String(10 * 60 * 1000), 10);
const rateHits = new Map(); // ip -> timestamps[]
function rateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || "onbekend";
  const recent = (rateHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    res.set("Retry-After", String(Math.ceil(RATE_WINDOW_MS / 1000)));
    return res.status(429).json({ error: "Te veel verzoeken vanaf dit adres. Probeer het later opnieuw." });
  }
  recent.push(now);
  rateHits.set(ip, recent);
  // Opruimen: verwijder IP's zonder recente activiteit zodra de map groot wordt.
  if (rateHits.size > 5000) for (const [k, v] of rateHits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) rateHits.delete(k);
  next();
}

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: process.env.PVA_MODEL || "claude-opus-4-8", keyConfigured: !!process.env.ANTHROPIC_API_KEY, authRequired: authConfigured(), credits: creditsConfigured() });
});

app.post("/api/extract", rateLimit, requireAuth, upload.single("document"), async (req, res) => {
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
    res.status(status).json({ error: "Extractie mislukt", detail: err && err.message ? err.message : String(err) });
  }
});

// ---- Credits: saldo opvragen ----
app.get("/api/credits", requireAuth, async (req, res) => {
  if (!creditsConfigured() || !req.user || !req.user.id) return res.json({ balance: null });
  try { res.json({ balance: await getBalance(req.user.id) }); }
  catch (e) { console.error("credits-fout:", e && e.message ? e.message : e); res.status(502).json({ error: "Saldo niet op te halen.", detail: e && e.message ? e.message : String(e) }); }
});

// ---- Credits: Mollie-checkout starten ----
app.post("/api/checkout", requireAuth, async (req, res) => {
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
        webhookUrl: backend ? `${backend}/api/mollie-webhook` : undefined,
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
app.post("/api/mollie-webhook", express.urlencoded({ extended: false }), async (req, res) => {
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

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`PvA-backend luistert op poort ${port}`));
