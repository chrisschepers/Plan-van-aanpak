/* App-entry — startpagina (dossiercheck) met de privacyverklaring als overlay.
   React/ReactDOM als UMD-globals. De PvA-invuller is van de site gehaald
   (geen kernactiviteit meer); de code staat nog in src/ maar wordt niet gebundeld. */

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

function App() {
  const [view, setView] = useState("landing"); // landing | privacy
  useReveal();

  useEffect(() => {
    document.body.style.overflow = view === "landing" ? "" : "hidden";
  }, [view]);

  return (
    <React.Fragment>
      <Landing onOpenPrivacy={() => setView("privacy")} />
      {view === "privacy" && <PrivacyVerklaring onClose={() => setView("landing")} />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
