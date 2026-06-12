/* Voegt twee .docx-pakketten samen tot één document:
   sectie 1 = het begeleidend bericht (briefpapier-huisstijl), sectie 2 = het
   ingevulde UWV Plan van aanpak. Het formulier-gedeelte blijft byte-voor-byte
   ongewijzigd: we nemen het UWV-pakket als basis en zetten de brief er als
   eigen sectie (met eigen kop/voet) vóór, met een sectie-einde ertussen. */

import JSZip from "jszip";

const HEADER_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml";
const FOOTER_CT = "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml";
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/";

// Zoek in een document.xml.rels de eerste header/footer (id + doelbestand).
function findRef(relsXml, kind) {
  const rx = /<Relationship\b[^>]*>/g;
  let m;
  while ((m = rx.exec(relsXml))) {
    const tag = m[0];
    if (tag.includes(`/${kind}"`)) {
      const id = /Id="(rId\d+)"/.exec(tag);
      const tgt = /Target="([^"]*)"/.exec(tag);
      if (id && tgt) return { id: id[1], target: tgt[1].replace(/^\//, "") };
    }
  }
  return null;
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

  const lh = findRef(lRels, "header");
  const lf = findRef(lRels, "footer");
  const headerXml = lh ? await L.file(`word/${lh.target}`).async("string") : null;
  const footerXml = lf ? await L.file(`word/${lf.target}`).async("string") : null;

  // --- formulier (basis): nieuwe kop/voet-parts toevoegen met verse rIds ---
  let tDoc = await T.file("word/document.xml").async("string");
  let tRels = await T.file("word/_rels/document.xml.rels").async("string");
  let tCT = await T.file("[Content_Types].xml").async("string");

  const maxId = Math.max(0, ...[...tRels.matchAll(/Id="rId(\d+)"/g)].map((m) => +m[1]));
  const hId = "rId" + (maxId + 1);
  const fId = "rId" + (maxId + 2);

  let ctAdd = "", relAdd = "";
  if (headerXml) {
    T.file("word/headerLetter.xml", headerXml);
    ctAdd += `<Override PartName="/word/headerLetter.xml" ContentType="${HEADER_CT}"/>`;
    relAdd += `<Relationship Id="${hId}" Type="${REL}header" Target="headerLetter.xml"/>`;
    letterSect = letterSect.replace(`r:id="${lh.id}"`, `r:id="${hId}"`);
  }
  if (footerXml) {
    T.file("word/footerLetter.xml", footerXml);
    ctAdd += `<Override PartName="/word/footerLetter.xml" ContentType="${FOOTER_CT}"/>`;
    relAdd += `<Relationship Id="${fId}" Type="${REL}footer" Target="footerLetter.xml"/>`;
    letterSect = letterSect.replace(`r:id="${lf.id}"`, `r:id="${fId}"`);
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
