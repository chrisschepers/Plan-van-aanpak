/* Backend-URL voor de AI-extractie. Leeg = alleen demo-modus (voorbeeldcasus).
   Zet je Railway-URL in index.html via:  window.__PVA_BACKEND__ = "https://...";
   (of vul hieronder een vaste URL in). */
export const BACKEND_URL =
  (typeof window !== "undefined" && window.__PVA_BACKEND__) || "";

export const hasBackend = () => !!BACKEND_URL;
