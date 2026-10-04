import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { resourceId } = req.body || {}

  if (!resourceId || typeof resourceId !== 'string') {
    return res.status(400).json({ error: 'resourceId is required' })
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured.')
    return res.status(200).json({ ok: true, notice: 'Telegram not configured' })
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const anonKey =
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY

    let title = 'Resource'
    if (supabaseUrl && anonKey) {
      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      })
      const { data, error } = await supabase
        .from('resources')
        .select('title')
        .eq('id', resourceId)
        .maybeSingle()

      if (!error && data?.title) {
        title = data.title
      }
    }

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const text = `🎮 Someone won the unlock challenge for '${title}' and downloaded it.\nTime: ${timestamp}`

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
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('notify-game-win error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
