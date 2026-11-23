/* Browser-entry: neemt de vooraf gerenderde HTML over (hydrate), of rendert
   zelf als de pagina leeg is (zoals in de smoke-test). */

import { App } from "./app.jsx";

const root = document.getElementById("root");
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, <App />);
else ReactDOM.createRoot(root).render(<App />);
