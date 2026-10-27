# The 10x Manager Academy

The site at the10xmanager.academy, built by `build.mjs` and hosted on Netlify. Every push to `main` publishes.

## Writing a post

Add a Markdown file to `content/posts/`. The file name is the address: `my-post.md` → `/post/my-post`.

```markdown
---
title: "Your title"
date: "2026-11-02"
topic: "new-managers"
excerpt: "One or two sentences shown under the title and in previews."
cover: "https://…/image.jpg"
---

Your post, in Markdown. ## for section headings, **bold**, *italic*, [links](https://…),
![alt text](image-url "optional caption").
```

- `topic` is one of: new-managers, managing-up, feedback, communication, careers, hiring, org-design, remote, inclusion
- Optional: `seoTitle`, `seoDescription` (for search results), `draft: "true"` (keeps it off the site)
- Images can go in `static/assets/` and be linked as `/assets/name.jpg`

## Other files

- `templates/` — the page designs, written in the dark palette (homepage is `templates/home.html`)
- `theme.mjs` — the light theme: each dark colour and its light counterpart
- `static/_redirects` — old addresses → new ones
- Contact form messages arrive in Netlify → Forms
- Newsletter signups go to beehiiv through `netlify/functions/subscribe.mjs` (needs the `BEEHIIV_API_KEY` environment variable in Netlify)

Preview locally: `npm install && npm run build`, then open `dist/`.
