/* App-entry — landing en tool in één flow. React/ReactDOM als UMD-globals. */

import { Landing } from "./landing.jsx";
import { Tool } from "./tool.jsx";

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
  const [view, setView] = useState("landing"); // landing | tool
  useReveal();

  useEffect(() => {
    document.body.style.overflow = view === "tool" ? "hidden" : "";
  }, [view]);

  return (
    <React.Fragment>
      <Landing onOpenTool={() => setView("tool")} />
      {view === "tool" && <Tool onClose={() => setView("landing")} />}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
