// Dark (default) and light themes. The templates are written in the dark palette; at build time
// every colour that differs between themes becomes a CSS variable, with the light values set
// under html[data-theme="light"]. Text colours and surface colours map separately, so pastel
// accents stay as fills but get darker ink when used as text.

// Used as text (color, fill, stroke, outline)
export const TEXT = {
  "#F3F5F8": "#15171C", "#E6E9EE": "#23262D", "#D9DDE4": "#2B2F37", "#C9CED7": "#383D47",
  "#AEB5C1": "#4B5260", "#8B93A1": "#5A6170", "#6E7684": "#666C7A", "#B7D26C": "#4A6510",
  "#D6E7A2": "#33470A", "#BB99F6": "#6A43C9", "#84D2CE": "#1C6F6A", "#F4B8A7": "#A3462C",
  "#F1E27B": "#755E00", "#D6E3B4": "#46561F", "#C9C2E0": "#4B3E72",
};
// Used as background, border, shadow
export const SURF = {
  "#0D1117": "#F5F7FA", "#0D1014": "#ECEFF4", "#0B0E14": "#F5F7FA", "#161A20": "#FFFFFF",
  "#12161C": "#EEF1F5", "#1F242C": "#DFE3EA", "#222731": "#D9DEE6", "#2E343E": "#C3C9D3",
  "#2A303A": "#D2D7DF", "#2A313B": "#D2D7DF", "#3A414D": "#B3BAC5", "#262B34": "#E3E7ED",
  "#1E252F": "#E2E6EC", "#1F2430": "#E3E7ED", "#1A1F27": "#E3E7ED", "#1A2213": "#EEF3DD",
  "#3A4A22": "#C6D59B", "#4E6230": "#B7C886", "#231E36": "#EFE9FB", "#19162A": "#F3EEFC",
  "#3A3157": "#D3C6F1",
};
const TEXT_PROPS = new Set(["color", "fill", "stroke", "caret-color", "text-decoration-color", "outline", "outline-color"]);
const HEX = /#[0-9A-Fa-f]{6}\b/g;

export function themed(html) {
  const used = new Map(); // var name -> [dark, light]
  const v = (hex, table, kind) => {
    const h = hex.toUpperCase();
    const light = table[h];
    if (!light) return hex;
    const name = `--${kind}-${h.slice(1)}`;
    used.set(name, [h, light]);
    return `var(${name})`;
  };
  // Tag pills: their own accent as a fill in light mode (set by class rules below).
  html = html.replace(/(<span )style="display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; background: #1F2430; ([^"]*?)color: (#[0-9A-Fa-f]{6})"/g,
    (_, open, rest, accent) => `${open}class="tag-pill" style="--pill: ${accent}; display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; ${rest.trim()}"`);
  // SVG colour attributes → style, so they can use variables.
  html = html.replace(/<(svg|path|rect|circle|g)\b([^>]*?)\s(fill|stroke)="(#[0-9A-Fa-f]{6})"([^>]*)>/g, (m, tag, a, attr, hex, b) => {
    const table = TEXT;
    if (!table[hex.toUpperCase()]) return m;
    const decl = `${attr}: ${v(hex, table, "t")}`;
    let attrs = `${a}${b}`;
    if (/\sstyle="/.test(attrs)) attrs = attrs.replace(/\sstyle="/, ` style="${decl}; `);
    else attrs = `${attrs} style="${decl}"`;
    return `<${tag}${attrs}>`;
  });
  // CSS declarations, in style attributes and <style> blocks.
  html = html.replace(/([a-zA-Z-]+)(\s*:\s*)([^;"{}<]*?#[0-9A-Fa-f]{6}[^;"{}<]*)/g, (m, prop, sep, val) => {
    if (prop.startsWith("--")) return m;
    const isText = TEXT_PROPS.has(prop.toLowerCase());
    return prop + sep + val.replace(HEX, (hex) => (isText ? v(hex, TEXT, "t") : v(hex, SURF, "s")));
  });
  const dark = [...used].map(([n, [d]]) => `${n}:${d}`).join(";");
  const light = [...used].map(([n, [, l]]) => `${n}:${l}`).join(";");
  const css = `<style>:root{${dark}}html[data-theme="light"]{${light};color-scheme:light}
.tag-pill{background:#1F2430;color:var(--pill)}html[data-theme="light"] .tag-pill{background:var(--pill);color:#0D1117}</style>\n`;
  // Cloudflare Web Analytics: cookie-free page views, on every page.
  const beacon = `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "af10d0dfdc1e4b45947a60502c18cde3"}'></script>`;
  return html.replace("</head>", css + "</head>").replace("</body>", beacon + "\n</body>");
}
