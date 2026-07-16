import * as esbuild from "esbuild";

// React/ReactDOM komen als UMD-globals uit index.html; alleen JSX compileren en bundelen.
await esbuild.build({
  entryPoints: ["src/app.jsx"],
  bundle: true,
  outfile: "app.js",
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  format: "iife",
  target: ["es2019"],
  logLevel: "info",
});
