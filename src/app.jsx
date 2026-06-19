/* App-entry — landing en tool in één flow. React/ReactDOM als UMD-globals. */

import { Landing } from "./landing.jsx";
import { Tool } from "./tool.jsx";
import { PrivacyVerklaring } from "./privacy.jsx";
import { Login } from "./login.jsx";
import { currentSession, onAuthChange, signOut } from "./supa.js";

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
  const [view, setView] = useState("landing"); // landing | tool | privacy | login
  const [session, setSession] = useState(null);
  useReveal();

  useEffect(() => {
    currentSession().then(setSession);
    return onAuthChange(setSession);
  }, []);

  useEffect(() => {
    document.body.style.overflow = view === "landing" ? "" : "hidden";
  }, [view]);

  const logout = async () => { await signOut(); setSession(null); setView("landing"); };

  return (
    <React.Fragment>
      <Landing
        onOpenTool={() => setView("tool")}
        onOpenPrivacy={() => setView("privacy")}
        session={session}
        onOpenLogin={() => setView("login")}
        onLogout={logout}
      />
      {view === "tool" && <Tool onClose={() => setView("landing")} session={session} onNeedLogin={() => setView("login")} />}
      {view === "privacy" && <PrivacyVerklaring onClose={() => setView("landing")} />}
      {view === "login" && <Login onClose={() => setView("landing")} onOpenPrivacy={() => setView("privacy")} session={session} />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
