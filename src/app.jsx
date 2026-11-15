/* App-entry — startpagina (dossiercheck) of invuller-pagina, plus de tool. React/ReactDOM als UMD-globals. */

import { Landing } from "./landing.jsx";
import { InvullerPagina } from "./invuller.jsx";
import { opInvuller, naarInvuller } from "./merk.jsx";
import { Tool } from "./tool.jsx";
import { PrivacyVerklaring } from "./privacy.jsx";
import { Login } from "./login.jsx";
import { Account } from "./account.jsx";
import { Admin } from "./admin.jsx";
import { currentSession, onAuthChange, signOut } from "./supa.js";
import { fetchBalance } from "./credits.js";
import { checkAdmin } from "./adminapi.js";

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

// Inloggen en betalen horen bij de invuller. Komt iemand daarvan terug op de
// startpagina (het oude terugkeeradres), stuur hem dan door naar de invuller.
const HIER = typeof window !== "undefined" ? window.location.hash + window.location.search : "";
const TERUG_VAN_LOGIN = /access_token=|[?&]code=/.test(HIER);
const TERUG_VAN_BETALEN = /[?&]betaling=terug/.test(HIER);

function App() {
  const [view, setView] = useState("landing"); // landing | tool | privacy | login | account | admin
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(null); // null = onbekend/niet-actief
  const [isAdmin, setIsAdmin] = useState(false);
  useReveal();

  useEffect(() => {
    currentSession().then(setSession);
    return onAuthChange(setSession);
  }, []);

  useEffect(() => {
    if (opInvuller()) return;
    if (TERUG_VAN_BETALEN) window.location.replace(naarInvuller() + "?betaling=terug");
    else if (TERUG_VAN_LOGIN && session) window.location.replace(naarInvuller());
  }, [session]);

  useEffect(() => {
    if (!session) { setCredits(null); return; }
    fetchBalance(session.access_token).then(setCredits);
  }, [session]);

  useEffect(() => {
    if (!session) { setIsAdmin(false); return; }
    checkAdmin(session.access_token).then(setIsAdmin);
  }, [session]);

  const refreshCredits = () => { if (session) fetchBalance(session.access_token).then(setCredits); };

  useEffect(() => {
    document.body.style.overflow = view === "landing" ? "" : "hidden";
  }, [view]);

  // Terug van Mollie → direct naar de account-pagina.
  useEffect(() => {
    if (opInvuller() && TERUG_VAN_BETALEN) setView("account");
  }, []);

  const logout = async () => { await signOut(); setSession(null); setView("landing"); };

  return (
    <React.Fragment>
      {opInvuller()
        ? <InvullerPagina
            onOpenTool={() => setView("tool")}
            onOpenPrivacy={() => setView("privacy")}
            session={session}
            onOpenLogin={() => setView("login")}
            onLogout={logout}
            onOpenAccount={() => setView("account")}
            isAdmin={isAdmin}
            onOpenAdmin={() => setView("admin")}
          />
        : <Landing onOpenPrivacy={() => setView("privacy")} />}
      {view === "tool" && <Tool onClose={() => setView("landing")} session={session} onNeedLogin={() => setView("login")} credits={credits} onNeedCredits={() => setView("account")} onCreditsChange={setCredits} />}
      {view === "privacy" && <PrivacyVerklaring onClose={() => setView("landing")} />}
      {view === "login" && <Login onClose={() => setView("landing")} onOpenPrivacy={() => setView("privacy")} session={session} />}
      {view === "account" && <Account onClose={() => setView("landing")} session={session} onLogout={logout} credits={credits} refreshCredits={refreshCredits} />}
      {view === "admin" && <Admin onClose={() => setView("landing")} session={session} />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
