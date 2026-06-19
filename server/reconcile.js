/* Self-consistency voor de AI-extractie: combineert meerdere onafhankelijke
   extracties van dezelfde terugkoppeling tot één stabiele uitkomst.

   - signalen: meerderheidsstem per sleutel (de flip-gevoelige booleans);
   - reken-getallen: modus, anders mediaan;
   - tekstvelden: modus, met de eerste sample als terugval bij gelijkspel.

   Pure, deterministische functie — testbaar zonder modelaanroepen. */

// Meest voorkomende waarde; bij gelijkspel wint de eerste in volgorde van
// voorkomen (iteratie over de oorspronkelijke lijst).
function mode(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  let best = values[0];
  let bestN = -1;
  for (const v of values) {
    const n = counts.get(v);
    if (n > bestN) { best = v; bestN = n; }
  }
  return best;
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

const TEXT_KEYS = [
  "naam", "naamBedrijfsarts", "functie", "contracturen", "eersteZiektedag",
  "geboortedatum", "einddatumDienstverband", "belastbaarheid", "opbouwtempo",
  "startdatumOpbouw", "werkaanpassing", "aanpassingWerkplek", "aanpassingWerktijden",
  "prognose", "spreekuurdatum", "taaksuggestie",
];

export function reconcile(samples) {
  const ok = (samples || []).filter(Boolean);
  if (!ok.length) throw new Error("Geen samples om te combineren");
  if (ok.length === 1) return ok[0];
  const N = ok.length;
  const base = { ...ok[0] };

  // Tekstvelden: alleen de modus overnemen als die een meerderheid heeft;
  // anders de eerste sample (voorkomt dat een uitschieter wint).
  for (const k of TEXT_KEYS) {
    const vals = ok.map((s) => (s[k] == null ? "" : s[k]));
    const m = mode(vals);
    const cnt = vals.filter((v) => v === m).length;
    base[k] = cnt > N / 2 ? m : (ok[0][k] == null ? "" : ok[0][k]);
  }

  // Signalen: meerderheidsstem per sleutel (unie van alle voorkomende keys).
  const sigKeys = new Set();
  for (const s of ok) for (const k of Object.keys(s.signalen || {})) sigKeys.add(k);
  const signalen = {};
  for (const k of sigKeys) {
    const trueCount = ok.filter((s) => s.signalen && s.signalen[k]).length;
    signalen[k] = trueCount > N / 2;
  }
  base.signalen = signalen;

  // Reken: modus per getal (anders mediaan), startdatum via modus van niet-lege.
  const reken = { ...(ok[0].reken || {}) };
  for (const k of ["contractHours", "startHours", "weeklyIncrease"]) {
    const nums = ok.map((s) => (s.reken && Number.isFinite(s.reken[k]) ? s.reken[k] : 0));
    const m = mode(nums);
    const cnt = nums.filter((v) => v === m).length;
    reken[k] = cnt > N / 2 ? m : median(nums);
  }
  const dates = ok.map((s) => (s.reken && s.reken.startDateISO) || "").filter(Boolean);
  reken.startDateISO = dates.length ? mode(dates) : "";
  base.reken = reken;

  // Inputvalidatie (Stap 0): geschikt via meerderheidsstem (flip-gevoelige boolean);
  // documenttype/toelichting via modus; meest recente spreekuur via modus van niet-lege;
  // tegenstrijdigheden als unie over alle samples.
  const ivs = ok.map((s) => s.inputvalidatie).filter(Boolean);
  if (ivs.length) {
    const geschiktTrue = ivs.filter((iv) => iv.geschikt !== false).length;
    const tegen = [];
    for (const iv of ivs) for (const t of (iv.tegenstrijdigheden || [])) if (t && !tegen.includes(t)) tegen.push(t);
    const sprek = ivs.map((iv) => iv.meestRecenteSpreekuur || "").filter(Boolean);
    base.inputvalidatie = {
      documenttype: mode(ivs.map((iv) => iv.documenttype || "")),
      geschikt: geschiktTrue > N / 2,
      toelichting: mode(ivs.map((iv) => iv.toelichting || "")),
      meestRecenteSpreekuur: sprek.length ? mode(sprek) : "",
      tegenstrijdigheden: tegen,
    };
  }

  return base;
}
