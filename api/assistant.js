// Vercel serverless function.
// Reads GEMINI_API_KEY from environment variables (configured in Vercel dashboard).
// Serves as the smart backend for voice navigation (Step 5) and ChatWithYash (Step 8).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, message, prompt, mode = 'voice', history = [] } = req.body || {}
  const query = (transcript || message || prompt || '').trim()

  if (!query) {
    return res.status(400).json({ error: 'Query, message, or transcript is required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
  }

  const isChat = mode === 'chat'

  // Voice mode system prompt: strictly <15 words, fast classification
  const voiceSystemInstruction = `You are the AI assistant on Yash Chauhan's portfolio website.
Classify the user's spoken voice command or input into one of the following destination categories:
- "projects": if asking about projects, portfolio, things built, shipped work, case studies.
- "skills": if asking about skills, technical abilities, tech stack, languages, tools.
- "about": if asking about background, education, bio, who Yash is, GEC Patan, GTU.
- "blog": if asking about blog, articles, writing, essays, posts.
- "contact": if asking to contact, say hello, send a message, hire him, get in touch.
- "none": if greeting without intent, chit-chat, or unrelated query.

Also write a concise, friendly reply in the site's dark zero-gravity tech tone.
Rule: The reply MUST be strictly fewer than 15 words.
Respond in strict JSON with no markdown formatting or backticks:
{"destination": "projects" | "skills" | "about" | "blog" | "contact" | "none", "reply": "string"}`

  // Chat mode system prompt: conversational, grounded in single source of truth bio/projects/skills
  const chatSystemInstruction = `You are the AI digital assistant representing Yash Chauhan on his portfolio website.
Ground all responses strictly in Yash's real background, projects, and skills (single source of truth):
- Background: CSE / IoT Engineer from GEC Patan, Gujarat Technological University (GTU), India. Builds autonomous systems, AI products, quantitative models, and hardware-software bridges.
- Featured Projects:
  1. Missed-Call Lead-Recovery Workflow: Self-hosted n8n automation integrating webhooks, Twilio triggers, and instant CRM recovery sequences.
  2. Order-Flow Forecasting Engine: Quantitative Python model analyzing high-frequency market microstructures using Hawkes self-exciting point processes.
  3. Smart Environmental Telemetry Node: Ultra-low power ESP32/IoT sensor node monitoring ambient environmental telemetry with deep sleep power management.
- Skills & Tech Stack:
  * Languages: Python, JavaScript (ES6+)
  * Frontend: React, Tailwind CSS
  * Backend: Firebase (Firestore, Auth), FastAPI (asynchronous microservices)
  * Automation: n8n, Google Apps Script
  * Embedded: IoT, Sensor Systems
  * Active Focus / Currently Learning: Order-flow forecasting, Hawkes processes
- Contact & GitHub:
  * Visitors can message Yash directly via the Telegram contact form on this site ("Say hello" section).
  * GitHub: github.com/yashhchauhan11-afk

Tone & Formatting Guidelines:
- Conversational, knowledgeable, direct, in the site's dark zero-gravity tech tone.
- Answer questions clearly in 2 to 4 sentences (or a short focused paragraph). Avoid overwhelming walls of text.
- If the user asks to see or jump to a section (projects, skills, about, blog, contact), set "destination" to that category; otherwise set "destination": "none".
- Respond in strict JSON with no markdown fences or backticks:
{"destination": "projects" | "skills" | "about" | "blog" | "contact" | "none", "reply": "string"}`

  // Build contents payload
  let contents = []

  if (isChat && Array.isArray(history)) {
    // Multi-turn context for chat mode: accept last ~6 messages
    const recentHistory = history.slice(-6)
    for (const item of recentHistory) {
      if (!item || !item.text) continue
      const role = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user'
      contents.push({
        role,
        parts: [{ text: String(item.text).trim() }],
      })
    }
  }

  // Current user query is appended as the latest message
  contents.push({
    role: 'user',
    parts: [{ text: query }],
  })

  // Ensure alternating roles for multi-turn if history is present
  if (contents.length > 1) {
    const sanitized = []
    let lastRole = null
    for (const msg of contents) {
      if (msg.role !== lastRole) {
        sanitized.push(msg)
        lastRole = msg.role
      } else {
        // If two consecutive messages have the same role, combine their text
        const prev = sanitized[sanitized.length - 1]
        prev.parts[0].text += `\n${msg.parts[0].text}`
      }
    }
    // If first message is model, prepend a dummy greeting user turn or remove it
    if (sanitized.length > 0 && sanitized[0].role === 'model') {
      sanitized.shift()
    }
    contents = sanitized.length > 0 ? sanitized : [{ role: 'user', parts: [{ text: query }] }]
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: isChat ? chatSystemInstruction : voiceSystemInstruction }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: isChat ? 0.4 : 0.2,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini API error response:', errText)
      return res.status(response.status).json({ error: 'Gemini API call failed' })
    }

    const data = await response.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from Gemini' })
    }

    let parsed
    try {
      // Remove any unintentional markdown fences if present
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
      parsed = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON:', rawText, parseErr)
      return res.status(502).json({ error: 'Invalid JSON returned from model', raw: rawText })
    }

    const validDestinations = ['projects', 'skills', 'about', 'blog', 'contact', 'none']
    const destination = validDestinations.includes(parsed.destination)
      ? parsed.destination
      : 'none'

    return res.status(200).json({
      destination,
      reply: parsed.reply || (isChat ? "I'm here to help with questions about Yash's work." : 'Navigating...'),
    })
  } catch (err) {
    console.error('assistant.js unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
