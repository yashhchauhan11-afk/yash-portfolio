// Vercel serverless function.
// Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from environment variables
// (set these in the Vercel dashboard — never hardcode them here).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, message } = req.body || {}

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return res.status(500).json({ error: 'Server is not configured' })
  }

  const text = `📩 New portfolio message\nFrom: ${name?.trim() || 'Anonymous'}\n\n${message.trim()}`

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    )

    if (!telegramRes.ok) {
      const errBody = await telegramRes.text()
      console.error('Telegram API error:', errBody)
      return res.status(502).json({ error: 'Telegram delivery failed' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('send-message error:', err)
    return res.status(500).json({ error: 'Unexpected server error' })
  }
}
