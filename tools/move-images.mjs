// One-off: copy every Wix-hosted image used by the posts into static/assets/posts/
// (resized to at most 1600px) and point the posts at the copies.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIR = "content/posts";
const OUT = "static/assets/posts";
mkdirSync(OUT, { recursive: true });
const RE = /https:\/\/static\.wixstatic\.com\/media\/([A-Za-z0-9_~.-]+\.(?:jpe?g|png|gif|webp))/g;

const files = readdirSync(DIR).filter((f) => f.endsWith(".md"));
const ids = new Set();
for (const f of files) for (const m of readFileSync(join(DIR, f), "utf8").matchAll(RE)) ids.add(m[1]);

const local = {};
for (const id of ids) {
  const name = id.replace("~mv2", "").replace(/\.jpeg$/, ".jpg");
  const resized = `https://static.wixstatic.com/media/${id}/v1/fit/w_1600,h_1600,q_85/${id}`;
  let res = await fetch(resized);
  if (!res.ok) res = await fetch(`https://static.wixstatic.com/media/${id}`);
  const type = res.headers.get("content-type") || "";
  if (!res.ok || !type.startsWith("image/")) throw new Error(`${id}: ${res.status} ${type}`);
  writeFileSync(join(OUT, name), Buffer.from(await res.arrayBuffer()));
  if (statSync(join(OUT, name)).size < 1000) throw new Error(`${id}: suspiciously small`);
  local[id] = `/assets/posts/${name}`;
  console.log("saved", name, statSync(join(OUT, name)).size);
}
for (const f of files) {
  const p = join(DIR, f);
  const t = readFileSync(p, "utf8");
  const n = t.replace(RE, (_, id) => local[id]);
  if (n !== t) writeFileSync(p, n);
}
console.log(`moved ${ids.size} images`);
