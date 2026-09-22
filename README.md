# Portfolio — Step 1: Foundation + Telegram messaging

A Vite + React portfolio with a "Say hello" box that forwards messages
straight to your Telegram, via a Vercel serverless function.

## 1. Create your Telegram bot

1. Open Telegram, search for **@BotFather**, and start a chat.
2. Send `/newbot`, give it a name and a username (must end in `bot`).
3. BotFather replies with a **bot token** — copy it. Looks like
   `123456789:AAExampleTokenString`.
4. Now send **any message** to your new bot (search its username, open the
   chat, type "hi").
5. In your browser, open:
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   (replace `<YOUR_TOKEN>` with your real token). Find `"chat":{"id": ...}`
   in the response — that number is your **chat ID**.

## 2. Local setup

```bash
npm install
cp .env.example .env
```

Open `.env` and paste in your bot token and chat ID from step 1.

## 3. Run it locally

Plain `npm run dev` will NOT run the `/api` function — Vite's dev server
doesn't execute serverless functions. Use the Vercel CLI instead, which
simulates the real deployment locally:

```bash
npm install -g vercel
vercel dev
```

First run asks a few setup questions (link to a Vercel account — free,
just sign up at vercel.com if you haven't). Once it's running, open the
printed localhost URL and try the "Say hello" form — a message should land
in your Telegram within a second or two.

## 4. Deploy to Vercel

```bash
vercel
```

This deploys a preview. Then in the Vercel dashboard for this project:

1. Go to **Settings → Environment Variables**.
2. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` with your real values.
3. Redeploy (`vercel --prod`, or push to your connected git repo) so the
   function picks up the new environment variables.

Your `.env` file is never uploaded (it's git-ignored) — production reads
the values from the Vercel dashboard instead.

## What's next

This is Step 1 of the full build: shell + working contact channel, live.
Step 2 onward adds the hidden terminal, voice navigation, the zero-gravity
3D hero, and the rest — on top of this same foundation.
