/* App-entry — landing en tool in één flow. React/ReactDOM als UMD-globals. */

import { Landing } from "./landing.jsx";
import { Tool } from "./tool.jsx";
import { PrivacyVerklaring } from "./privacy.jsx";
import { Login } from "./login.jsx";
import { Account } from "./account.jsx";
import { currentSession, onAuthChange, signOut } from "./supa.js";
import { fetchBalance } from "./credits.js";

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
  });
}

function App() {
  const [view, setView] = useState("landing"); // landing | tool | privacy | login | account
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(null); // null = onbekend/niet-actief
  useReveal();

  useEffect(() => {
    currentSession().then(setSession);
    return onAuthChange(setSession);
  }, []);

  useEffect(() => {
    if (!session) { setCredits(null); return; }
    fetchBalance(session.access_token).then(setCredits);
  }, [session]);

  const refreshCredits = () => { if (session) fetchBalance(session.access_token).then(setCredits); };

  useEffect(() => {
    document.body.style.overflow = view === "landing" ? "" : "hidden";
  }, [view]);

  // Terug van Mollie → direct naar de account-pagina.
  useEffect(() => {
    if (typeof window !== "undefined" && /[?&]betaling=terug/.test(window.location.search)) setView("account");
  }, []);

  const logout = async () => { await signOut(); setSession(null); setView("landing"); };

  return (
    <React.Fragment>
      <Landing
        onOpenTool={() => setView("tool")}
        onOpenPrivacy={() => setView("privacy")}
        session={session}
        onOpenLogin={() => setView("login")}
        onLogout={logout}
        onOpenAccount={() => setView("account")}
      />
      {view === "tool" && <Tool onClose={() => setView("landing")} session={session} onNeedLogin={() => setView("login")} credits={credits} onNeedCredits={() => setView("account")} onCreditsChange={setCredits} />}
      {view === "privacy" && <PrivacyVerklaring onClose={() => setView("landing")} />}
      {view === "login" && <Login onClose={() => setView("landing")} onOpenPrivacy={() => setView("privacy")} session={session} />}
      {view === "account" && <Account onClose={() => setView("landing")} session={session} onLogout={logout} credits={credits} refreshCredits={refreshCredits} />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
