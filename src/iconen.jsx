/* De twee inline SVG-iconen die de site gebruikt (24x24, stroke-based, decoratief). */
const svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", focusable: "false" };

export const I = {
  arrowLeft: <svg {...svg} aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>,
  chevDown: <svg {...svg} aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>,
};
