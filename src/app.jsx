/* De startpagina (dossiercheck) met de privacyverklaring als overlay.
   React/ReactDOM komen als UMD-globals uit index.html; client.jsx hydrateert,
   build.mjs rendert dezelfde App vooraf naar index.html. */

import { Landing } from "./landing.jsx";
import { PrivacyVerklaring } from "./privacy.jsx";

const { useState, useEffect } = React;

// scroll-reveal (rect-gebaseerd — betrouwbaar in alle contexten)
function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add("js-reveal");
    const reveal = () => {
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add("in");
      });
    };
    reveal();
    requestAnimationFrame(reveal);
    window.addEventListener("scroll", reveal, { passive: true, capture: true });
    window.addEventListener("resize", reveal);
    return () => {
      window.removeEventListener("scroll", reveal, { capture: true });
      window.removeEventListener("resize", reveal);
    };
  }, []); // eenmalig: de listeners hoeven niet elke render opnieuw geregistreerd
}

export function App() {
  const [view, setView] = useState("landing"); // landing | privacy
  useReveal();

  useEffect(() => {
    document.body.style.overflow = view === "landing" ? "" : "hidden";
  }, [view]);

  // De losse pagina's linken naar /#privacyverklaring: open dan meteen de verklaring.
  useEffect(() => {
    if (window.location.hash === "#privacyverklaring") setView("privacy");
  }, []);

  return (
    <React.Fragment>
      <Landing onOpenPrivacy={() => setView("privacy")} />
      {view === "privacy" && <PrivacyVerklaring onClose={() => setView("landing")} />}
    </React.Fragment>
  );
}

