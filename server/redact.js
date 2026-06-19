/* Deterministische BSN-redactie als vangnet bovenop het medisch/BSN-filter in de
   prompt. Vervangt 9-cijferige getallen die de elfproef doorstaan door een
   markering, vóór de tekst naar de AI gaat. Hoge precisie: alleen getallen die
   echt een geldige BSN-structuur hebben worden geraakt — geen willekeurige
   nummers (bedragen, telefoonnummers). Werkt op tekst; PDF's (binair) gaan native
   naar het model, daar dekt de promptregel het BSN-verbod. */

// Elfproef: 9*d1 + 8*d2 + ... + 2*d8 - 1*d9 deelbaar door 11 (en niet enkel nullen).
export function isBSN(s) {
  if (!/^\d{9}$/.test(s) || s === "000000000") return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += (9 - i) * Number(s[i]);
  sum += -1 * Number(s[8]);
  return sum % 11 === 0;
}

export function redactBSN(text) {
  if (!text) return text;
  return String(text).replace(/\b\d{9}\b/g, (m) => (isBSN(m) ? "[BSN GEFILTERD]" : m));
}
