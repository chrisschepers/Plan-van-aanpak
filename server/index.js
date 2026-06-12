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

const app = express();
app.use(express.json({ limit: "2mb" }));

// CORS: standaard alles toestaan (demo). Beperk in productie met ALLOWED_ORIGIN.
const allowed = (process.env.ALLOWED_ORIGIN || "*").split(",").map((s) => s.trim());
app.use(cors({ origin: allowed.includes("*") ? true : allowed }));

const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB

app.get("/health", (_req, res) => {
  res.json({ ok: true, model: process.env.PVA_MODEL || "claude-opus-4-8", keyConfigured: !!process.env.ANTHROPIC_API_KEY });
});

app.post("/api/extract", upload.single("document"), async (req, res) => {
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
        blocks = [{ type: "text", text: value }];
      } else {
        // probeer als platte tekst
        const text = file.buffer.toString("utf8");
        if (!text.trim()) return res.status(400).json({ error: "Niet-ondersteund bestandstype. Gebruik PDF, .docx of platte tekst." });
        blocks = [{ type: "text", text }];
      }
    } else if (pastedText) {
      blocks = [{ type: "text", text: pastedText }];
    } else {
      return res.status(400).json({ error: "Lever een bestand (veld 'document') of { text } aan." });
    }

    const data = await extractFields(blocks);
    res.json({ ok: true, data });
  } catch (err) {
    const status = err && err.status ? err.status : 500;
    console.error("extract-fout:", err && err.message ? err.message : err);
    res.status(status).json({ error: "Extractie mislukt", detail: err && err.message ? err.message : String(err) });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`PvA-backend luistert op poort ${port}`));
