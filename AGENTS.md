# Antigravity Project Rules — yash-portfolio

You are my primary AI coding agent for my portfolio project. Follow this
document exactly. If any instruction here conflicts with something you'd
normally do, this document wins.

---

## 1. PROJECT CONTEXT

- Project name: yash-portfolio
- Local project path: `Y:\Web\portfolio-step1\portfolio`
- GitHub repository: `yashhchauhan11-afk/yash-portfolio`
- Main branch: `main`
- Hosting: Vercel, connected to GitHub, auto-deploys on push to `main`
- Live website: https://yash-portfolio-six-flax.vercel.app

## 2. TECH STACK

- React 19 (plain JavaScript/JSX — **do not convert to TypeScript** unless
  I explicitly ask)
- Vite
- Tailwind CSS
- Node.js
- Vercel serverless functions (`/api`)
- Telegram Bot API (contact form backend)
- Google Gemini API (added in Step 5)

## 3. DESIGN SYSTEM — reuse these exact tokens everywhere, never invent new ones

Defined in `tailwind.config.js`:

| Token | Value | Use |
|---|---|---|
| `space-bg` | `#0B0E1A` | page background |
| `space-surface` | `#141829` | cards, panels |
| `space-surface-2` | `#1B2036` | borders, dividers |
| `space-text` | `#E8EAF2` | primary text |
| `space-muted` | `#8B93AC` | secondary text |
| `space-accent` | `#6EE7C0` | primary CTA / highlight (mint) |
| `space-warm` | `#F2B84B` | secondary highlight (amber), sparing use |

Fonts: `font-display` = Space Grotesk (headings), `font-body` = Inter
(body text), `font-mono` = JetBrains Mono (terminal/code-like UI only).

Theme: dark, "zero-gravity / space" motif. Rounded corners, generous
spacing, no harsh borders. Respect `prefers-reduced-motion` for any
animation you add (see existing rule in `src/index.css`) — reuse that
pattern, don't add a second one.

## 4. CURRENT PROJECT FILES

```
src/
  App.jsx
  index.css
  main.jsx
  components/
    Hero.jsx
    MessageBox.jsx      (id="say-hello", posts to /api/send-message)
    Terminal.jsx         (hidden terminal, toggled by ` key or >_ button)
api/
  send-message.js        (Telegram Bot API integration)
index.html
tailwind.config.js
vite.config.js
package.json
.env / .env.example
.gitignore
```

This list will grow as steps below are completed — check the actual
folder structure yourself before assuming a file does or doesn't exist.

## 5. PROJECT ROADMAP — build in this order, do not skip ahead without asking

**✅ Step 1 (done):** Shell + Hero + Telegram contact form.
**✅ Step 2 (done):** Hidden terminal easter egg.

**✅ Step 3 (done):** Projects + Skills visible sections + Voice navigation.
1. Add `src/components/Projects.jsx`, `id="projects"` — visible cards for
   each project currently listed in `Terminal.jsx`'s `PROJECTS_OUTPUT`
   array. Move that content here as the single source of truth; have
   `Terminal.jsx` either reference this data or keep its own short copy —
   your call, but don't let the two silently drift out of sync.
2. Add `src/components/Skills.jsx`, `id="skills"` — same treatment for
   `SKILLS_OUTPUT`.
3. Add both to `App.jsx` in order: Hero → Projects → Skills → MessageBox
   → Terminal.
4. Add `src/components/VoiceNav.jsx`: a mic-icon button, fixed
   bottom-left (Terminal's button is bottom-right — don't overlap).
   Click starts the browser's Web Speech API for a **single phrase**
   (not continuous listening), then stops. Map: "projects"/"show my
   projects" → scroll to `#projects`; "skills"/"show my skills" → scroll
   to `#skills`; "contact"/"say hello"/"message" → scroll to
   `#say-hello`; unrecognized → show "didn't catch that" briefly, no
   crash. If the browser has no Web Speech API support, hide the button
   entirely — don't show a broken feature.
5. No new npm packages, no API keys, no backend changes for this step.

**✅ Step 4 (done):** About section + Blog.

1. Add `src/components/About.jsx`, `id="about"`, placed in App.jsx right
   after Hero. Placeholder content only (education: GEC Patan/GTU,
   current focus, one line about what he's building) — mark clearly with
   a comment for Yash to rewrite; do not invent biographical claims.

2. Add lightweight client-side routing — NO new npm package (no
   react-router). Create `src/useRouter.js`: a small hook that tracks
   `window.location.pathname` in state, listens for the `popstate` event,
   and exposes `navigate(path)` which calls `history.pushState` and
   updates the state.

3. Restructure `App.jsx` as a route switch:
   - `/` → existing full page (Hero, About, Projects, Skills, MessageBox,
     VoiceNav, Terminal)
   - `/blog` → new `BlogList.jsx`
   - `/blog/:slug` → new `BlogPost.jsx` (parse the slug from the path)

4. Blog content lives as Markdown files in `src/content/blog/*.md`, each
   with frontmatter: `title`, `date`, `slug`, `excerpt`. Use Vite's
   built-in `import.meta.glob('/src/content/blog/*.md', { as: 'raw' })`
   to load them — no CMS, no database. Parse frontmatter with a small
   hand-written parser or the `gray-matter` package (this one dependency
   is justified — frontmatter parsing by hand is error-prone; explain
   this to Yash before installing). Render body text with the `marked`
   package (also justified — safe, well-maintained markdown-to-HTML,
   avoids hand-rolling a markdown parser).

5. `BlogList.jsx`: card grid of post previews (title, date, excerpt),
   same visual language as Projects.jsx, each linking to `/blog/:slug`
   via the router's `navigate()`.

6. `BlogPost.jsx`: renders the full post, styled consistently (use
   `font-body` for prose, `space-accent` for links).

7. Add ONE placeholder blog post as an example/template, clearly marked
   for Yash to replace, showing the exact frontmatter format to copy for
   future posts.

8. IMPORTANT — Vercel needs a rewrite rule for this to work in
   production: create `vercel.json` at the project root with:
   `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
   Without this, directly visiting or refreshing `/blog/some-post` on the
   live site will 404 (it works in local dev automatically, production
   static hosting does not).

9. Update Terminal.jsx and VoiceNav.jsx: their section-scroll commands
   (projects/skills/contact) only work on the `/` route. If triggered
   while on `/blog` or `/blog/:slug`, first call `navigate('/')`, then
   wait for the home page to render (e.g. `requestAnimationFrame` twice,
   or a short delay) before scrolling. Also add a new `blog` command/
   phrase that navigates to `/blog`.

10. No changes to the Telegram contact form or existing sections beyond
    adding About and wiring the new routes into App.jsx.

**✅ Step 5 (done):** Smart voice assistant backend.

1. Broaden VoiceNav's local keyword matching immediately (cheap fix, ship
   this regardless of the rest): match on individual keywords ("work",
   "portfolio" → projects; "background", "who are you" → about) using
   substring checks, not full-phrase equality. This becomes the fallback
   layer.

2. Add `api/assistant.js` — Vercel serverless function reading
   GEMINI_API_KEY from env (already added to the Vercel dashboard by
   Yash). Takes { transcript } in the POST body, sends it to Gemini's
   generateContent with a system instruction: classify the transcript
   into one of [projects, skills, about, blog, contact, none], and write
   a short (<15 words) friendly reply in the site's tone. Respond as
   strict JSON: {"destination": "...", "reply": "..."}.

3. Update VoiceNav.jsx: after transcript is captured, POST it to
   /api/assistant. Show the returned `reply` in a small card near the mic
   button, styled like Terminal.jsx (font-mono, space-surface background,
   space-accent border). If `destination` is a known section, navigate/
   scroll there (respecting the route-awareness from Step 4 item 9).

4. If the API call fails, times out, or the response isn't valid JSON,
   silently fall back to the local keyword matching from item 1 — the
   mic button must never fully break due to a network/API issue.

5. GEMINI_API_KEY is already set in the Vercel dashboard — do not create,
   guess, or hardcode it, just reference process.env.GEMINI_API_KEY.

6. Keep api/assistant.js general (not voice-nav-specific) — it will be
   reused by the "Chat with Yash" panel in the last step.

**✅ Step 6 (done):** Zero-gravity hero + draggable card

1. Install `@react-three/fiber`, `@react-three/drei`, and `matter-js`.
   Explain what each does before installing.

2. Lazy-load the 3D scene: wrap the new Canvas component in `React.lazy`
   + `Suspense`, using the CURRENT gradient-blob `<div>` in Hero.jsx as
   the Suspense fallback (don't delete it — reuse it). This keeps first
   paint fast since the bundle has grown with the blog dependencies, and
   it doubles as a clean "not loaded yet" state.

3. Inside the lazy-loaded Canvas: 3-5 floating meshes (icosahedron,
   torus, sphere) in `space-accent`/`space-warm` colors. Slow rotation +
   gentle bobbing via `useFrame`. Subtle pointer-based parallax tilt —
   lerp it, don't snap.

4. Performance guardrails (8GB RAM machine): max 5-7 meshes, no
   postprocessing, no shadows, no heavy textures.

5. Add `src/components/DraggableCard.jsx`: a 2D draggable card, plain
   HTML/CSS (NOT inside the Three.js canvas), positioned absolutely. Use
   `matter-js` only for the physics calculation (velocity, edge bounce),
   synced manually to the card's CSS transform. Use Pointer Events
   (`onPointerDown`/`onPointerMove`/`onPointerUp`), not mouse-only
   events, so dragging works on mobile/touch too.

6. Card content: minimal placeholder (name + one-line tagline, same tone
   as Hero's intro) — mark clearly for Yash to edit, don't invent new
   bio details.

7. Respect `prefers-reduced-motion` (reuse the existing pattern in
   `src/index.css`): freeze the floating animation, disable drag-inertia
   — card can still be repositioned, just without bounce/float.

**✅ Step 7 (done):** GitHub activity + skills constellation.

1. Add `src/components/GithubActivity.jsx`. GitHub's public REST API does
   NOT expose the private contribution-calendar graph (that needs
   authenticated GraphQL) — do not fake or scrape it. Use
   `GET https://api.github.com/users/{username}/repos` (repo names, star
   counts, primary language) instead. Get the username from the git
   remote (yashhchauhan11-afk) — don't ask unless it's ambiguous.

2. IMPORTANT — rate limits: unauthenticated GitHub API calls are capped
   at 60 requests/hour per IP. Cache the fetched result in
   sessionStorage (with a timestamp) and reuse it for the rest of the
   session instead of re-fetching on every render/navigation. If the
   fetch fails (rate-limited or offline), fail silently — show nothing or
   a minimal placeholder, never a broken error state.

3. Render the result as floating 3D bars (height = star count) inside a
   Three.js canvas, same visual language (colors, mesh style) as
   Hero3D.jsx. Lazy-load this component exactly like Hero3D was
   (React.lazy + Suspense) — same first-paint reasoning applies, don't
   repeat Step 6's bundle-size mistake.

4. In `Skills.jsx`: ADD a 3D radial "constellation" view below the
   existing flat skill list — do NOT replace the flat list. The list
   stays as the fast-scan default; the constellation is a supplementary
   visual. Position each skill (reuse Step 3's data, no duplicate copy)
   as a clickable node; click shows/expands a short description.

5. Pointer-event check (learned from Step 6's parallax bug): make sure
   no absolutely-positioned element silently overlaps and blocks clicks
   on the constellation's nodes or the GithubActivity canvas. Test this
   explicitly, don't assume it's fine.

6. Same performance guardrails as Hero3D: max 5-7 3D elements per canvas,
   no postprocessing, no shadows.

**✅ Step 8 (done):** "Chat with Yash" panel

1. Extend `api/assistant.js` to accept a `mode` field in the POST body:
   `"voice"` or `"chat"`. Mode `"voice"` must behave EXACTLY as it does
   today (unchanged) — short <15-word reply, same JSON contract,
   {"destination": "...", "reply": "..."}. Do not regress VoiceNav's
   existing behavior. Mode `"chat"` uses the same JSON shape but allows a
   longer, more conversational `reply`, built from the same bio/skills/
   projects data already used in About.jsx/Projects.jsx/Skills.jsx —
   single source of truth, no duplicated content with different wording.

2. For `"chat"` mode, accept an optional `history` array (last ~6
   messages: {role, text}) in the request body so multi-turn context
   works — the visitor shouldn't have to repeat context each message.
   `"voice"` mode stays single-shot, no history needed.

3. Add `src/components/ChatWithYash.jsx`: a floating chat panel with a
   toggle button. Terminal already occupies bottom-right, VoiceNav
   occupies bottom-left — position this without overlapping either
   (e.g. stacked above Terminal with clear spacing). Explicitly test this
   on a mobile viewport for crowding/overlap before considering it done.

4. Proper chat-bubble UI (visually distinct from Terminal's CLI look),
   calling `/api/assistant` with `mode: "chat"`. Plain request/response,
   no streaming/SSE.

5. Disable the input while a request is in flight — no overlapping
   requests. If the API call fails, show a clear inline error bubble in
   the chat stream ("Something went wrong, try again") — there's no
   keyword-fallback equivalent for open chat like VoiceNav has.

6. No new npm dependencies, no new API key — reuse GEMINI_API_KEY and
   existing design tokens.

**✅ Step 9 (done): Cinematic Projects redesign — 3D horizontal timeline carousel**

1. Restructured `PROJECTS` data in `Projects.jsx` to 4 real projects (2 current, 2 older), synchronized with `Terminal.jsx` (`PROJECTS_OUTPUT`) and `api/assistant.js` as the single source of truth.
2. Rebuilt rendering using pure CSS 3D transforms and React state (no Three.js/canvas overhead):
   - Perspective stage with depth-based spatial scaling (`scale`), blur (`blur`), opacity, and 3D card tilt (`rotateY`).
   - Natural pointer & touch swipe navigation with unified mouse/touch listeners, live delta tracking (`dragDeltaXRef`), rubber-band boundary resistance, and responsive swipe threshold (`SWIPE_THRESHOLD = 40`).
   - Mobile-optimized layout with adaptive stage height, responsive card dimensions, touch protection (`touch-pan-y`), and vertical overflow support (`overflow-y-auto overscroll-contain`).
   - Full accessibility support: keyboard arrow navigation (`←` / `→`), clickable pagination dots, and instant crossfade fallback for `prefers-reduced-motion`.
3. Hero copy alignment:
   - Updated `src/components/Hero.jsx` (eyebrow, main headline, and supporting narrative) to reflect focus on systems, AI, and quantitative computing.
   - Confirmed `src/components/DraggableCard.jsx` was verified to preserve Yash Chauhan's name anchor, subtitle, and `GEC Patan / GTU` tag.

**▶ Step 10 (next): Skills constellation & copy refinement + endpoint verification**

1. Update `Skills.jsx` constellation descriptions and `About.jsx` copy to align deeply with real background, current quantitative R&D, and production automation workflows.
2. Diagnose and verify the live assistant chat endpoint in production (`/api/assistant`), ensuring fallback router reliability across Gemini and OpenRouter free tiers.
3. Perform full-site responsive and accessibility regression testing across mobile, tablet, and desktop viewports.


## 6. SECRETS & ENVIRONMENT VARIABLES — applies to ALL of them, not just Telegram

Current secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Step 5 adds
`GEMINI_API_KEY`. This rule covers every one of them, present and future:

- NEVER expose, print, log, hardcode, commit, or push any secret's value.
- NEVER modify or remove a production Vercel environment variable unless
  I explicitly ask.
- NEVER add `.env` to Git. `.env` must always stay in `.gitignore`.
- `node_modules/` and `.vercel/` must always stay in `.gitignore`.
- If you need a new secret to exist, tell me its name and what it's for —
  I will create it in the Vercel dashboard myself.

## 7. COST CONSTRAINT

This project stays on free tiers only: Vercel Hobby plan, Telegram Bot
API, the browser's native Web Speech API, Gemini API free quota. If a
task seems to need a paid service or exceeds a free quota, stop and flag
it to me before adding it — don't add a paid dependency silently.

## 8. GIT / GITHUB WORKFLOW

- Git is already initialized, remote is already configured, current
  branch is `main`. Do NOT re-initialize Git or create another repo. Do
  NOT change the remote unless I explicitly ask.
- Before committing, always verify `.env`, `node_modules/`, and any other
  sensitive files are not staged.
- When I explicitly say "commit and push":
  1. Review the changes.
  2. Run `npm run build` (or the relevant test) and fix any errors first.
  3. Check `git status`.
  4. Write a clear, meaningful commit message.
  5. Commit.
  6. Push to `origin/main`.
- Do not force-push. Do not delete branches or rewrite history unless I
  explicitly request it.
- Do NOT automatically commit and push every small change — only when I
  ask.

## 9. VERCEL WORKFLOW

- GitHub is already connected to the existing Vercel project. Do NOT
  create a new Vercel project or disconnect the repo.
- Deployment happens automatically on push to `main` — you don't need to
  trigger it manually.
- Do not modify Vercel project settings or environment variables unless I
  explicitly ask.

## 10. CODING RULES

1. Inspect the existing code and understand how it works before changing
   anything.
2. Do not rewrite or replace the whole project unnecessarily — smallest
   clean change required for the current roadmap step.
3. Preserve existing functionality unless the roadmap step says to change
   it.
4. Preserve the design system in Section 3 exactly — no new colors/fonts
   without asking.
5. Reuse existing components and data (see the "single source of truth"
   notes in Section 5) instead of duplicating content.
6. Avoid unnecessary dependencies. Explain any new package before
   installing it.
7. Keep code clean, readable, and production-ready.
8. Handle responsive design for desktop, tablet, and mobile on anything
   you add.
9. Do not break the Telegram contact form.
10. After a significant change, run `npm run build` and, where relevant,
    use your browser subagent to visually check the result.
11. If something in the current roadmap step is ambiguous, inspect the
    project first, then ask me only if a real decision is needed — don't
    guess silently on anything that affects design, data, or secrets.

## 11. SAFETY RULE

Before any destructive action — deleting files, replacing major
components, changing project architecture, modifying deployment
configuration or environment variables, or altering Git history —
explain exactly what will change and wait for my confirmation.

## 12. HOW TO WORK WITH ME

- I am the project owner.
- Explain technical decisions in simple Hinglish when it helps.
- Give me step-by-step manual instructions when I need to do something
  myself (e.g. adding a Vercel env variable).
- If you can safely do a task yourself, do it — don't just describe it.
- After finishing a task, briefly tell me: (1) what changed, (2) which
  files changed, (3) whether it was tested, (4) whether a commit/push is
  needed.
- Don't overwhelm me with unnecessary explanation.

## 13. MOST IMPORTANT PRINCIPLE

Preserve the existing working portfolio. Do not break: existing UI,
responsive behavior, the Telegram contact form, the hidden terminal,
Vercel deployment, environment variables, GitHub integration, or any
other component completed in an earlier roadmap step. When adding a new
feature, integrate it into the existing architecture — don't rebuild
from scratch.
