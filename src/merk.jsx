/* Merknaam, contactadres en paden die beide pagina's delen. */

import { I } from "./data.jsx";

export const MERK = "Poortwachtercheck";
export const CONTACT_MAIL = "contact@poortwachtercheck.nl";

// De site heeft twee pagina's: de startpagina (dossiercheck) en de invuller in
// een submap. Relatieve paden, zodat het op elk adres en in elke map werkt.
export const opInvuller = () => typeof window !== "undefined" && window.__PVA_PAGINA__ === "invuller";
export const thuis = () => (opInvuller() ? "../" : "#top");
export const naarInvuller = () => (opInvuller() ? "#top" : "plan-van-aanpak-invullen/");

export function mailto(onderwerp, tekst) {
  let url = "mailto:" + CONTACT_MAIL + "?subject=" + encodeURIComponent(onderwerp);
  if (tekst) url += "&body=" + encodeURIComponent(tekst);
  return url;
}

export function Merk({ href, style }) {
  return (
    <a className="brand" href={href || "#top"} style={style}>
      <span className="mark">{I.shield}</span>
      <span>Poortwachter<span className="tld">check</span></span>
    </a>
  );
}
