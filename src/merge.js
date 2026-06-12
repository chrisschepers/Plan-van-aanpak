/* Voegt twee .docx-pakketten samen tot één document:
   sectie 1 = het begeleidend bericht (briefpapier-huisstijl), sectie 2 = het
   ingevulde UWV Plan van aanpak. Het formulier-gedeelte blijft byte-voor-byte
   ongewijzigd: we nemen het UWV-pakket als basis en zetten de brief er als
   eigen sectie (met eigen kop/voet) vóór, met een sectie-einde ertussen. */

import JSZip from "jszip";

const HEADER_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml";
const FOOTER_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";

// Zoek in een document.xml.rels alle headers/footers (id + doelbestand).
function findRefs(relsXml, kind) {
  const out = [];
  const rx = /<Relationship\b[^>]*>/g;
  let m;
  while ((m = rx.exec(relsXml))) {
    const tag = m[0];
    if (tag.includes(`/${kind}"`)) {
      const id = /Id="(rId\d+)"/.exec(tag);
      const tgt = /Target="([^"]*)"/.exec(tag);
      if (id && tgt) out.push({ id: id[1], target: tgt[1].replace(/^\//, "") });
    }
  }
  return out;
}

export async function mergeLetterAndForm(letterData, formData) {
  const L = await JSZip.loadAsync(letterData);
  const T = await JSZip.loadAsync(formData);

  // --- brief: body opsplitsen in inhoud + (body-)sectPr ---
  const lDoc = await L.file("word/document.xml").async("string");
  const lRels = await L.file("word/_rels/document.xml.rels").async("string");
  const bodyInner = lDoc.slice(lDoc.indexOf("<w:body>") + 8, lDoc.lastIndexOf("</w:body>"));
  const sectStart = bodyInner.lastIndexOf("<w:sectPr");
  if (sectStart < 0) throw new Error("Brief mist sectie-eigenschappen");
  const letterContent = bodyInner.slice(0, sectStart);
  let letterSect = bodyInner.slice(sectStart); // <w:sectPr ...>...</w:sectPr>

  if (/r:embed=|r:link=|r:id="rId/.test(letterContent)) {
    throw new Error("Brief-inhoud bevat onverwachte relaties (afbeelding/koppeling)");
  }

  // Alle kop-/voet-parts van de brief (eerste pagina + vervolg + voet).
  const parts = [
    ...findRefs(lRels, "header").map((r) => ({ ...r, kind: "header", ct: HEADER_CT })),
    ...findRefs(lRels, "footer").map((r) => ({ ...r, kind: "footer", ct: FOOTER_CT })),
  ];

  // --- formulier (basis): nieuwe kop/voet-parts toevoegen met verse rIds ---
  let tDoc = await T.file("word/document.xml").async("string");
  let tRels = await T.file("word/_rels/document.xml.rels").async("string");
  let tCT = await T.file("[Content_Types].xml").async("string");

  const maxId = Math.max(0, ...[...tRels.matchAll(/Id="rId(\d+)"/g)].map((m) => +m[1]));

  let ctAdd = "", relAdd = "";
  let n = 0;
  for (const part of parts) {
    n++;
    const name = `${part.kind}Letter${n}.xml`;
    T.file(`word/${name}`, await L.file(`word/${part.target}`).async("string"));

    // Part-relaties (briefpapier-afbeeldingen): media meenemen onder een
    // 'letter-'-naam zodat ze niet botsen met de media van het UWV-formulier.
    const prl = L.file(`word/_rels/${part.target}.rels`);
    if (prl) {
      let prels = await prl.async("string");
      const mediaRefs = [...new Set([...prels.matchAll(/Target="(media\/[^"]+)"/g)].map((m) => m[1]))];
      for (const mt of mediaRefs) {
        const newTarget = `media/letter-${mt.split("/").pop()}`;
        T.file(`word/${newTarget}`, await L.file(`word/${mt}`).async("uint8array"));
        prels = prels.split(`Target="${mt}"`).join(`Target="${newTarget}"`);
      }
      T.file(`word/_rels/${name}.rels`, prels);
    }

    const newId = "rId" + (maxId + n);
    ctAdd += `<Override PartName="/word/${name}" ContentType="${part.ct}"/>`;
    relAdd += `<Relationship Id="${newId}" Type="${REL}${part.kind}" Target="${name}"/>`;
    letterSect = letterSect.split(`r:id="${part.id}"`).join(`r:id="${newId}"`);
  }

  // PNG-extensie registreren als het formulier die nog niet kent.
  if (!/Extension="png"/.test(tCT)) {
    tCT = tCT.replace("<Default", '<Default Extension="png" ContentType="image/png"/><Default');
  }

  // De formuliersectie (sectie 2) heeft 'titlePg' aan maar definieert geen eigen
  // EERSTE-pagina-header. Zonder die referentie erft de eerste formulierpagina de
  // header van de vorige sectie — het briefhoofd. We geven de formuliersectie een
  // eigen lege eerste-pagina-header zodat het formulier zijn eigen opmaak houdt.
  const formSectRe = /<w:sectPr\b[^>]*>([\s\S]*?)<\/w:sectPr>/g;
  const formSects = [...tDoc.matchAll(formSectRe)];
  const lastSect = formSects[formSects.length - 1]; // body-sectPr van het formulier
  if (lastSect && !/w:headerReference[^>]*w:type="first"/.test(lastSect[1])) {
    const blankId = "rId" + (maxId + parts.length + 1);
    T.file("word/headerBlank.xml",
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p/></w:hdr>');
    ctAdd += `<Override PartName="/word/headerBlank.xml" ContentType="${HEADER_CT}"/>`;
    relAdd += `<Relationship Id="${blankId}" Type="${REL}header" Target="headerBlank.xml"/>`;
    const patched = lastSect[0].replace(/^(<w:sectPr\b[^>]*>)/,
      `$1<w:headerReference w:type="first" r:id="${blankId}"/>`);
    tDoc = tDoc.slice(0, lastSect.index) + patched + tDoc.slice(lastSect.index + lastSect[0].length);
  }

  T.file("[Content_Types].xml", tCT.replace("</Types>", ctAdd + "</Types>"));
  T.file("word/_rels/document.xml.rels", tRels.replace("</Relationships>", relAdd + "</Relationships>"));

  // --- brief vóór het formulier zetten; sectie 1 afsluiten met haar sectPr ---
  const sect1Para = `<w:p><w:pPr>${letterSect}</w:pPr></w:p>`;
  const at = tDoc.indexOf("<w:body>") + 8;
  tDoc = tDoc.slice(0, at) + letterContent + sect1Para + tDoc.slice(at);
  T.file("word/document.xml", tDoc);

  const isNode = typeof window === "undefined";
  return T.generateAsync({
    type: isNode ? "nodebuffer" : "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
}
