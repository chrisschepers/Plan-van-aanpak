/* Browser-entry voor /termijnen-berekenen/: neemt alleen het rekenblok over. */
import { TermijnenTool } from "./termijnen.jsx";

const root = document.getElementById("termijnen-root");
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, <TermijnenTool />);
else ReactDOM.createRoot(root).render(<TermijnenTool />);
