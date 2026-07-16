/* Deterministische SVG-weergave van de verzuim-tijdlijn (computeTijdlijn-data),
   bedoeld om in de browser naar PNG te rasteren en op een liggende pagina in de
   .docx te zetten. Pure functie (geen DOM) → testbaar in Node. */

const C = {
  navy: "#1F3864", navy900: "#14264a", navy600: "#2c4a7e", navy100: "#e6ebf4", navy50: "#f2f5fa",
  green: "#157f5b", green700: "#0f6a4a", green50: "#f0f8f4",
  amber: "#f0b429", purple: "#6b4d9a",
  ink: "#18202f", muted: "#69748b", faint: "#97a0b2", line: "#e3e7ee", lineSoft: "#eef1f6",
};
const CAT = {
  poortwachter: { kleur: C.navy, label: "Poortwachter" },
  wazo: { kleur: C.green, label: "WAZO-verlof" },
  zud: { kleur: C.amber, label: "Einde dienstverband" },
  aow: { kleur: C.purple, label: "AOW" },
};

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Knip een titel op tot maximaal 2 regels van ~maxCh tekens.
function wrap2(text, maxCh) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxCh && line) { lines.push(line.trim()); line = w; }
    else line = (line + " " + w).trim();
    if (lines.length === 1 && (line + " ").length > maxCh) { /* laat 2e regel vollopen */ }
  }
  if (line) lines.push(line.trim());
  if (lines.length > 2) { lines[1] = lines.slice(1).join(" "); lines.length = 2; }
  if (lines[1] && lines[1].length > maxCh) lines[1] = lines[1].slice(0, maxCh - 1) + "…";
  return lines;
}

/**
 * @param {object} tijdlijn  resultaat van computeTijdlijn()
 * @returns {{svg:string, width:number, height:number}}
 */
export function renderTijdlijnSvg(tijdlijn) {
  const W = 1240, padX = 70;
  const plotL = padX, plotR = W - padX, plotW = plotR - plotL;
  const total = tijdlijn.eindeWachttijd.week || 1;
  const x = (w) => plotL + (w / total) * plotW;

  const mijlpalen = tijdlijn.events.filter((e) => e.type === "mijlpaal");
  const verloven = tijdlijn.events.filter((e) => e.type === "verlof");
  const eindpunten = tijdlijn.events.filter((e) => e.type === "eindpunt");
  const labelEvents = [...mijlpalen, ...eindpunten].sort((a, b) => a.week - b.week);

  // Label-layout: alternerend boven/onder, gestapeld in tiers tegen overlap.
  const BOXW = 150, HALF = BOXW / 2 + 6, TIER = 52, BOXH = 42;
  const sides = { boven: [], onder: [] };
  const lay = {};
  labelEvents.forEach((e, i) => {
    const px = x(e.week), side = i % 2 === 0 ? "boven" : "onder";
    const lo = px - HALF, hi = px + HALF;
    let tier = 0;
    while (sides[side].some((q) => q.tier === tier && !(hi < q.lo || lo > q.hi))) tier++;
    sides[side].push({ lo, hi, tier });
    lay[e.id] = { side, tier };
  });
  const maxBoven = sides.boven.reduce((m, q) => Math.max(m, q.tier), -1);
  const maxOnder = sides.onder.reduce((m, q) => Math.max(m, q.tier), -1);

  const headerH = 64;
  const bovenH = (maxBoven + 1) * TIER + 16;
  const axisY = headerH + bovenH;
  const onderH = (maxOnder + 1) * TIER + 16 + BOXH;
  const banenTop = axisY + onderH + 16;
  const H = banenTop + 92;

  const out = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI',Helvetica,Arial,sans-serif">`);
  out.push(`<defs><pattern id="hatch" width="14" height="14" patternTransform="rotate(45)" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${C.green50}"/><line x1="0" y1="0" x2="0" y2="14" stroke="${C.green}" stroke-opacity="0.22" stroke-width="7"/></pattern></defs>`);
  out.push(`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="#ffffff" stroke="${C.line}"/>`);

  // Kop
  out.push(`<text x="${padX}" y="30" font-size="20" font-weight="700" fill="${C.navy900}">Tijdlijn verzuim</text>`);
  out.push(`<text x="${padX}" y="52" font-size="13" fill="${C.muted}">${esc(tijdlijn.anker.datum)} t/m ${esc(tijdlijn.eindeWachttijd.datum)} · ${total} weken${tijdlijn.eindeWachttijd.verschovenDoorWazo ? " (verlengd door WAZO-verlof)" : ""}</text>`);

  // Legenda (rechtsboven)
  const cats = Array.from(new Set(tijdlijn.events.map((e) => e.categorie))).filter((c) => CAT[c]);
  let lx = W - padX;
  const legParts = [];
  for (let i = cats.length - 1; i >= 0; i--) {
    const c = cats[i], label = CAT[c].label, w = 14 + label.length * 6.7 + 18;
    lx -= w;
    legParts.push(`<rect x="${lx}" y="20" width="11" height="11" rx="3" fill="${CAT[c].kleur}"/><text x="${lx + 16}" y="29" font-size="12" fill="${C.ink}">${esc(label)}</text>`);
  }
  out.push(legParts.join(""));

  // Jaarraster
  for (let w = 0; w <= total; w += 52) {
    const gx = x(w);
    out.push(`<line x1="${gx}" y1="${headerH}" x2="${gx}" y2="${axisY + onderH}" stroke="${w === 0 ? C.line : C.lineSoft}"/>`);
    out.push(`<text x="${gx + 6}" y="${headerH + 12}" font-size="11" font-weight="600" fill="${C.faint}">${w === 0 ? "Start" : "Jaar " + Math.round(w / 52)}</text>`);
  }

  // WAZO-verlofblok
  for (const v of verloven) {
    const vx = x(v.week), vw = x(v.totWeek) - vx;
    out.push(`<rect x="${vx}" y="${axisY - 15}" width="${vw}" height="30" rx="8" fill="url(#hatch)" stroke="${C.green}" stroke-width="1.5" stroke-dasharray="4 3"/>`);
    out.push(`<text x="${vx + vw / 2}" y="${axisY + 4}" font-size="11" font-weight="700" fill="${C.green700}" text-anchor="middle">WAZO · ${esc(v.sub)}</text>`);
    if (v.split) {
      const sx = x(v.split.week);
      out.push(`<line x1="${sx}" y1="${axisY - 15}" x2="${sx}" y2="${axisY + 15}" stroke="${C.green700}" stroke-width="1.5"/>`);
      out.push(`<text x="${sx}" y="${axisY - 20}" font-size="10" font-weight="700" fill="${C.green700}" text-anchor="middle">${esc(v.split.label)} ${esc(v.split.datum)}</text>`);
    }
  }

  // As-lijn
  out.push(`<line x1="${plotL}" y1="${axisY}" x2="${plotR}" y2="${axisY}" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>`);

  // Labels + connectors + markers
  const labelBox = (e) => {
    const l = lay[e.id]; const px = x(e.week);
    const cat = CAT[e.categorie] || CAT.poortwachter;
    const lines = wrap2(e.titel, 22);
    const boxY = l.side === "boven"
      ? axisY - 16 - l.tier * TIER - BOXH
      : axisY + 16 + l.tier * TIER;
    const connFrom = l.side === "boven" ? axisY : axisY;
    const connTo = l.side === "boven" ? boxY + BOXH : boxY;
    let bx = px - BOXW / 2;
    bx = Math.max(plotL - 6, Math.min(plotR + 6 - BOXW, bx)); // klem binnen plot
    const parts = [];
    parts.push(`<line x1="${px}" y1="${connFrom}" x2="${px}" y2="${connTo}" stroke="${C.line}"/>`);
    parts.push(`<rect x="${bx}" y="${boxY}" width="${BOXW}" height="${BOXH}" rx="7" fill="#ffffff" stroke="${C.line}"/>`);
    parts.push(`<rect x="${bx}" y="${boxY}" width="3" height="${BOXH}" rx="1.5" fill="${cat.kleur}"/>`);
    const tx = bx + 11;
    let ty = boxY + 16;
    for (const ln of lines) { parts.push(`<text x="${tx}" y="${ty}" font-size="12" font-weight="600" fill="${C.navy900}">${esc(ln)}</text>`); ty += 13; }
    parts.push(`<text x="${tx}" y="${boxY + BOXH - 7}" font-size="10.5" fill="${C.muted}">${esc(e.datum)} · wk ${e.week}</text>`);
    return parts.join("");
  };
  for (const e of labelEvents) out.push(labelBox(e));

  // Markers op de as
  for (const e of mijlpalen) {
    const px = x(e.week), isEinde = e.week === total;
    out.push(`<circle cx="${px}" cy="${axisY}" r="${isEinde ? 9 : 7}" fill="${isEinde ? C.navy : "#ffffff"}" stroke="${isEinde ? C.green : C.navy}" stroke-width="3"/>`);
  }
  for (const e of eindpunten) {
    const px = x(e.week), cat = CAT[e.categorie] || CAT.zud, s = 7;
    out.push(`<rect x="${px - s}" y="${axisY - s}" width="${s * 2}" height="${s * 2}" fill="#ffffff" stroke="${cat.kleur}" stroke-width="3" transform="rotate(45 ${px} ${axisY})"/>`);
  }

  // Banen (loondoorbetaling met segmenten)
  for (const b of tijdlijn.banen) {
    const segs = (b.segmenten && b.segmenten.length) ? b.segmenten : [{ vanWeek: b.vanWeek, totWeek: b.totWeek, label: b.titel }];
    out.push(`<text x="${plotL}" y="${banenTop + 4}" font-size="11" font-weight="700" fill="${C.navy600}" letter-spacing="0.5">${esc(b.titel.toUpperCase())}</text>`);
    const barY = banenTop + 14, barH = 30;
    const bx0 = x(b.vanWeek), bx1 = x(b.totWeek);
    out.push(`<rect x="${bx0}" y="${barY}" width="${bx1 - bx0}" height="${barH}" rx="8" fill="${C.navy50}" stroke="${C.navy100}"/>`);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i], sx0 = x(s.vanWeek), sx1 = x(s.totWeek);
      if (i > 0) out.push(`<line x1="${sx0}" y1="${barY}" x2="${sx0}" y2="${barY + barH}" stroke="${C.navy100}" stroke-dasharray="3 3"/>`);
      out.push(`<text x="${sx0 + 12}" y="${barY + barH / 2 + 4}" font-size="11.5" font-weight="600" fill="${C.navy900}">${esc(s.label)}</text>`);
    }
    if (b.noot) out.push(`<text x="${plotL}" y="${barY + barH + 18}" font-size="11" font-style="italic" fill="${C.muted}">${esc(b.noot)}</text>`);
  }

  out.push(`</svg>`);
  return { svg: out.join(""), width: W, height: H };
}
