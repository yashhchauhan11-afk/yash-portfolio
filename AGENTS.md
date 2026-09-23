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
- Google Gemini API (arriving in Step 7, not yet added)

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

**▶ Step 4 (current — do this now): About section + Blog**

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

**Step 5 (next, after Step 4 is confirmed working):**
1. Install `@react-three/fiber` and `@react-three/drei` (Three.js React
   renderer) and `matter-js` (2D physics). Tell me what you're installing
   and why before running the install.
2. In `Hero.jsx`, replace the placeholder gradient-blob `<div>` with a
   `<Canvas>` containing 3–5 simple floating meshes (icosahedron, torus,
   sphere) in `space-accent`/`space-warm` colors. Slow rotation + gentle
   bobbing via `useFrame`. Add a subtle parallax tilt that responds to
   pointer position — lerp it, don't snap.
3. Performance guardrails (this runs on an 8 GB RAM machine): max 5–7
   meshes, no postprocessing, no shadows, no heavy textures.
4. Add `src/components/DraggableCard.jsx`: a 2D draggable "business card"
   element, plain HTML/CSS (NOT inside the Three.js canvas), positioned
   absolutely. Use matter-js only for the physics calculation (velocity,
   edge bounce) and sync the result to the card's CSS transform manually
   — don't use matter.js's own canvas renderer.
5. Respect `prefers-reduced-motion`: if set, freeze the floating
   animation and disable drag-inertia (card can still be repositioned,
   just without the bounce/float).

**Step 6 (after Step 5):**
1. Add `src/components/GithubActivity.jsx`. Important constraint: GitHub's
   public REST API does **not** expose the contribution-calendar graph
   without an authenticated GraphQL call — do not attempt to fake or
   scrape it. Instead use the public, unauthenticated endpoint
   `GET https://api.github.com/users/{username}/repos` (repo names, star
   counts, primary language) or `GET .../events/public` (recent public
   activity). Ask me for my GitHub username before wiring this up if you
   don't already have it from the repo remote.
2. Render the result as floating 3D bars (bar height = star count or
   event count) inside a Three.js canvas, same visual language as Step
   5's hero scene.
3. Add a "skills constellation" view inside `Skills.jsx`: position each
   skill from the Step 3 skills data as a node in a simple radial 3D
   layout. Click a node to show/expand a short description. Reuse the
   skills data from Step 3 — do not hardcode a second copy.
4. Same performance guardrails as Step 5.

**Step 7 (last):**
1. Add `api/chat.js` — a Vercel serverless function reading
   `GEMINI_API_KEY` from environment variables, calling the Gemini API's
   `generateContent` endpoint. Build the system context from the same
   bio/skills/projects data already used in `Projects.jsx`/`Skills.jsx` —
   single source of truth, don't duplicate it with different wording.
2. Add `src/components/ChatWithYash.jsx` — a floating chat panel,
   visually distinct from `Terminal.jsx` (proper chat bubbles, not a CLI
   look), calling `/api/chat`.
3. Keep v1 simple: plain request/response, no streaming (no SSE). Disable
   the input while a request is in flight so a visitor can't fire
   overlapping requests — that's the only rate-limiting needed for v1.
4. **Do not** create, guess, or hardcode a `GEMINI_API_KEY` value. I will
   add it to the Vercel dashboard myself when this step starts — ask me
   to confirm it's set before testing against production.

## 6. SECRETS & ENVIRONMENT VARIABLES — applies to ALL of them, not just Telegram

Current secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Step 7 adds
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
