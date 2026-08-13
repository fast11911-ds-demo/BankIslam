# Bank Islam — Retail Onboarding Demo (Mockup Site)

A static mockup site for the Bank Islam retail onboarding demo. Homepage styled
after bankislam.com's structure, plus a dedicated **Onboarding Retail Banking**
page that walks through the 4-step onboarding journey and a **Start Onboarding**
button intended to trigger a Docusign Workflow Builder workflow.

> This is a demo/mockup only — not the real Bank Islam website, and not
> affiliated with Bank Islam Malaysia Berhad. No copyrighted logo assets were
> used; the crescent mark is an original abstraction for demo purposes.

## Files

```
bank-islam-demo/
├── index.html          Homepage (nav, hero, quick links)
├── onboarding.html      Onboarding Retail Banking page (4-step journey + CTA)
├── css/style.css        All styling, design tokens at the top
├── js/main.js           Nav interactions + Start Onboarding trigger stub
└── README.md            This file
```

No build step, no dependencies to install — it's plain HTML/CSS/JS (with
Google Fonts loaded from a CDN). Just open `index.html` in a browser to
preview locally, or deploy with either option below.

## Deploy Option A — GitHub Pages (free, simplest)

1. Create a new repository on GitHub (e.g. `bank-islam-onboarding-demo`),
   public or private — Pages works for both on paid plans, public repos
   get it free.
2. Upload the contents of this folder to the repo root. Easiest way from
   your machine:
   ```bash
   cd bank-islam-demo
   git init
   git add .
   git commit -m "Bank Islam onboarding demo"
   git branch -M main
   git remote add origin https://github.com/<your-username>/bank-islam-onboarding-demo.git
   git push -u origin main
   ```
   Or just drag-and-drop the files into the GitHub web UI ("Add file" →
   "Upload files") if you'd rather not use git locally.
3. In the repo: **Settings → Pages**.
4. Under "Build and deployment", set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
5. GitHub will publish it at:
   `https://<your-username>.github.io/bank-islam-onboarding-demo/`
   (takes a minute or two on first deploy).

## Deploy Option B — Vercel (also free, slightly faster iteration)

**Via the Vercel dashboard (no CLI needed):**
1. Push the folder to a GitHub repo (steps 1–2 above).
2. Go to vercel.com → **Add New → Project** → import that GitHub repo.
3. Framework preset: choose **Other** (it's static HTML — no build command,
   no output directory override needed).
4. Click **Deploy**. Vercel gives you a URL like
   `https://bank-islam-onboarding-demo.vercel.app`.

**Via the Vercel CLI, if you prefer:**
```bash
npm i -g vercel
cd bank-islam-demo
vercel        # first deploy, follow the prompts
vercel --prod # promote to production URL
```

Either host works well for a presales demo link you can drop into an email
or a Teams/Zoom chat — both give you HTTPS automatically.

## Wiring up "Start Onboarding" to Docusign Workflow Builder

The button currently opens a modal that **simulates** the trigger and shows
the request shape (see `onboarding.html` and the `triggerOnboardingWorkflow()`
function in `js/main.js`). To make it real:

1. **Don't call Docusign's API directly from this static site.** The access
   token needs to stay server-side. Stand up a small backend (a serverless
   function works well if you're already on Vercel — e.g.
   `api/start-onboarding.js`) that:
   - Holds your Docusign OAuth credentials / access token.
   - Accepts a POST from the button.
   - Calls the Workflow Builder trigger endpoint
     (`POST /v1/workflows/{workflowId}/trigger`) with the applicant/context
     payload.
   - Returns the workflow instance ID/status to the page.
2. In `js/main.js`, replace the `console.log` inside
   `triggerOnboardingWorkflow()` with a `fetch()` call to that backend
   endpoint — the commented-out example is already sketched in that
   function.
3. Update the modal in `onboarding.html` to show the real workflow instance
   ID / status returned from your backend instead of the static example
   payload, if you'd like the demo to reflect a live call.

## Notes for the demo

- Copy, product names, and requirement lists are illustrative placeholders —
  swap in whatever matches the story you want to tell.
- The 4-step content in `onboarding.html` maps directly to the steps you
  specified: **1)** Web form, **2)** Data processing / info confirmation +
  signature + document submission, **3)** Internal bank review & approval,
  **4)** Retail Banking offer signature.
- Colors and layout are inspired by bankislam.com's public site (charcoal +
  red, utility bar, mega-menu style nav) but redrawn from scratch — no
  scraped assets or copyrighted graphics are included.
