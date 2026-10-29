// Share cards (1200×630 PNG) for each post: logo, #topic in its colour, title, read time and author.
// Rendered at build time with satori (layout → SVG) and resvg (SVG → PNG); no browser needed.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const require = createRequire(import.meta.url);
const font = (pkg, file) => readFileSync(require.resolve(`@fontsource/${pkg}/files/${file}`));
const FONTS = [
  { name: "DM Mono", data: font("dm-mono", "dm-mono-latin-500-normal.woff"), weight: 500, style: "normal" },
  { name: "DM Sans", data: font("dm-sans", "dm-sans-latin-500-normal.woff"), weight: 500, style: "normal" },
];
// Dot grid as an SVG pattern (satori doesn't tile CSS gradients).
const GRID = "data:image/svg+xml;base64," + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="13" cy="13" r="1.5" fill="#1E252F"/></pattern></defs><rect width="1200" height="630" fill="url(#d)"/></svg>',
).toString("base64");
const LOGO = "data:image/svg+xml;base64," + readFileSync(new URL("./static/assets/logo-dark-bg.svg", import.meta.url)).toString("base64");

// Minimal element helper for satori's React-like tree.
const h = (type, style, ...children) => ({ type, props: { style, children: children.flat().filter((c) => c !== null && c !== undefined) } });

export async function postCard({ title, tag, color, minutes, author = "Zaharenia Atzitzikaki" }) {
  const size = title.length > 70 ? 52 : title.length > 50 ? 58 : 62;
  const tree = h(
    "div",
    {
      position: "relative", width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between",
      boxSizing: "border-box", padding: "64px 72px", backgroundColor: "#0D1117", backgroundImage: `url(${GRID})`, backgroundSize: "1200px 630px",
      fontFamily: "DM Mono", color: "#F3F5F8",
    },
    h("div", { position: "absolute", top: -110, left: 990, width: 320, height: 320, borderRadius: 160, backgroundColor: color }),
    h("div", { position: "absolute", top: 570, left: 1010, width: 120, height: 120, borderRadius: 26, backgroundColor: "#1F2430", transform: "rotate(12deg)" }),
    { type: "img", props: { src: LOGO, width: 438, height: 45, style: { display: "flex" } } },
    h(
      "div",
      { display: "flex", flexDirection: "column", maxWidth: 920 },
      h("div", { display: "flex", fontSize: 26, color, marginBottom: 22 }, `#${tag}`),
      h("div", { display: "flex", fontSize: size, lineHeight: 1.18, letterSpacing: "-0.045em", color: "#F3F5F8" }, title),
    ),
    h("div", { display: "flex", fontFamily: "DM Sans", fontSize: 24, color: "#AEB5C1" }, `${minutes} min read  ·  ${author}`),
  );
  const svg = await satori(tree, { width: 1200, height: 630, fonts: FONTS });
  return new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
}
