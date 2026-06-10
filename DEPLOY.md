# Deploying the Relay landing page

The site is a plain static site — three files in `landingpage/`:

```
landingpage/
├── Relay Landing Page.html   ← the page  (rename to index.html — see Fix 1)
├── relay-styles.css
└── relay-script.js
```

No build step, no backend. You just upload the `landingpage/` folder to any static
host. **Read "Fix before you deploy" first — two things will break on a live host.**

---

## Fix before you deploy

### Fix 1 — Rename the entry file to `index.html` (required)

The page is named `Relay Landing Page.html`. Two problems:

- Static hosts serve `/` from a file literally called **`index.html`**. With the
  current name, your root URL (`https://yoursite.com/`) shows a 404 or a file
  listing, not the page.
- The space in the name forces ugly, fragile URLs (`/Relay%20Landing%20Page.html`).

Fix it once (the CSS/JS are referenced relatively, so nothing else needs to change):

```bash
git mv "landingpage/Relay Landing Page.html" landingpage/index.html
```

> Prefer not to rename? Add a redirect instead by creating `landingpage/_redirects`
> with this single line — but renaming is cleaner and recommended:
> `/   /Relay%20Landing%20Page.html   200`

### Fix 2 — Replace the Cloudflare-obfuscated email links (required off Cloudflare)

The page was saved from behind Cloudflare, so every email/CTA link is obfuscated and
depends on a Cloudflare-only script that **404s anywhere else** (confirmed locally).
Affected: both "Book a demo" buttons, the demo-section email button, and the footer
email — all currently point to `/cdn-cgi/l/email-protection#…` and rely on
`/cdn-cgi/scripts/.../email-decode.min.js`.

The obfuscated address decodes to **`relayhandoff@gmail.com`**.

In `landingpage/index.html`, make these replacements:

1. Every `href="/cdn-cgi/l/email-protection#…"`  →  `href="mailto:relayhandoff@gmail.com"`
   (there are 3: the nav button, the hero button, and the demo-section button).
2. Both `<span class="__cf_email__" data-cfemail="…">[email&#160;protected]</span>`
   →  the literal text `relayhandoff@gmail.com`
   (one in the demo button, one in the footer).
3. Delete the Cloudflare script tag near the bottom:
   `<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>`

After this, the buttons open the user's mail client everywhere — including Cloudflare.

> If you instead host on Cloudflare with Scrape Shield → Email Obfuscation enabled,
> the existing markup works as-is. Plain `mailto:` links are the portable choice.

---

## What was added to help with hosting

| File | Purpose |
|------|---------|
| `.gitignore` | Stops `.DS_Store` / editor cruft from being committed |
| `netlify.toml` | Tells git-connected Netlify to publish the `landingpage/` folder |
| `landingpage/_headers` | Security + cache headers for Netlify **and** Cloudflare Pages |
| `landingpage/vercel.json` | Same headers + clean URLs for Vercel |
| `landingpage/robots.txt` | Lets crawlers index the site; placeholder for a sitemap |

`.DS_Store` is already committed. Remove it from git tracking once:

```bash
git rm --cached .DS_Store && git commit -m "Stop tracking .DS_Store"
```

---

## Deploy options (pick one)

### A. Netlify — drag & drop (fastest, no account wiring)
1. Go to <https://app.netlify.com/drop>.
2. Drag the **`landingpage/`** folder onto the page. Done — you get a live URL.
3. It reads `_headers` automatically. (Drag-drop ignores `netlify.toml`; that file
   is only for git-connected deploys.)

### B. Netlify — git-connected (auto-deploy on push)
1. Push this repo to GitHub.
2. Netlify → "Add new site" → "Import from Git" → pick the repo.
3. Leave build command empty; publish directory = `landingpage` (already set in
   `netlify.toml`). Deploy.

### C. Cloudflare Pages
1. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
2. Build command: **(leave empty)**. Build output directory: **`landingpage`**.
3. Deploy. It reads `landingpage/_headers`.

### D. Vercel
1. Import the repo at <https://vercel.com/new>.
2. Framework preset: **Other**. Set **Root Directory = `landingpage`**.
   (No build command.) Vercel then reads `landingpage/vercel.json`.
3. Deploy.

### E. GitHub Pages
GitHub Pages can't serve a subfolder directly. Either:
- Move the three site files (post-rename) into the repo root or a `/docs` folder and
  set Pages → Source → `/docs`, **or**
- Use a Pages Action that publishes the `landingpage/` directory.

### F. Any other static host (S3 + CloudFront, nginx, etc.)
Upload the **contents** of `landingpage/` to the web root. Make sure the server
serves `index.html` for `/`. Re-create the headers from `_headers` in that host's
own config.

---

## Custom domain (relayhandoff.com)

1. Add the domain in your host's dashboard (Netlify/Cloudflare/Vercel all have a
   "Custom domains" section).
2. Point DNS as instructed (usually a `CNAME` for `www` and an `A`/`ALIAS` for the
   apex). HTTPS is provisioned automatically on all three hosts.
3. Update `landingpage/robots.txt` with your real `Sitemap:` URL if you add one.

---

## Post-deploy checklist

- [ ] `https://yoursite.com/` loads the page (not a 404 / file listing) → Fix 1 done
- [ ] "Book a demo" + footer email open a mail client to `relayhandoff@gmail.com` → Fix 2 done
- [ ] No 404s in DevTools → Network (especially no `/cdn-cgi/...` requests)
- [ ] Mobile nav (hamburger) opens/closes; section links scroll correctly
- [ ] Fonts load (Inter) and scroll-reveal animations fire
- [ ] Response headers present (DevTools → Network → click the document → Headers)
