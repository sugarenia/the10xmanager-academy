// Newsletter signups from the site's forms → beehiiv.
// Needs the BEEHIIV_API_KEY environment variable (Netlify → Site configuration → Environment variables).
const PUBLICATION = process.env.BEEHIIV_PUBLICATION_ID || "pub_bc30218a-27ac-43f4-b7d6-9d7c836275f5";

const go = (req, path) => Response.redirect(new URL(path, req.url), 303);

export default async (req) => {
  if (req.method !== "POST") return go(req, "/#newsletter");
  let form;
  try {
    form = await req.formData();
  } catch {
    return go(req, "/subscribe-error");
  }
  if (form.get("company-website")) return go(req, "/subscribed"); // spam trap: pretend it worked
  const email = String(form.get("email") || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return go(req, "/subscribe-error");
  const key = process.env.BEEHIIV_API_KEY;
  if (!key) {
    console.error("BEEHIIV_API_KEY is not set");
    return go(req, "/subscribe-error");
  }
  let page = "";
  try {
    page = new URL(req.headers.get("referer") || "").pathname;
  } catch {}
  const res = await fetch(`https://api.beehiiv.com/v2/publications/${PUBLICATION}/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email,
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: "the10xmanager.academy",
      utm_medium: "website",
      utm_content: page || undefined,
      referring_site: "https://the10xmanager.academy" + page,
    }),
  });
  if (!res.ok) {
    console.error("beehiiv subscribe failed", res.status, await res.text());
    return go(req, "/subscribe-error");
  }
  return go(req, "/subscribed");
};

export const config = { path: "/api/subscribe" };
