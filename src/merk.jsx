/* Merknaam, contactadres en het woordmerk. */

export const MERK = "Poortwachtercheck";
export const CONTACT_MAIL = "contact@poortwachtercheck.nl";

export function mailto(onderwerp, tekst) {
  let url = "mailto:" + CONTACT_MAIL + "?subject=" + encodeURIComponent(onderwerp);
  if (tekst) url += "&body=" + encodeURIComponent(tekst);
  return url;
}

export function Merk({ href, style, onClick }) {
  return (
    <a className="brand" href={href || "#top"} style={style} onClick={onClick}>
      <span>{MERK}</span>
    </a>
  );
}
