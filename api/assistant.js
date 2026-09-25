// Vercel serverless function.
// Reads OPENROUTER_KEY from environment variables (configured in Vercel dashboard).
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

  const apiKey = process.env.OPENROUTER_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENROUTER_KEY is not configured' })
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
- Background: Computer Science Engineering student from GEC Patan, Gujarat Technological University (GTU), India. Explores AI, automation, data systems, and quantitative technology with an eye toward quantitative trading and research.
- Featured Projects:
  1. Missed-Call Lead-Recovery Workflow: Working AI-powered customer recovery workflow reconnecting with missed calls via WhatsApp, handling customer requirements, and escalating when needed.
  2. Quantitative R&D: Foundational quantitative research exploring market microstructure, limit order book dynamics, Order Flow Imbalance, and Hawkes point processes.
  3. Spotify Clone: Early frontend project reproducing a real-world music-streaming interface to strengthen frontend fundamentals and UI implementation.
  4. Airbnb Clone: Early full-stack project building a larger, real-world-style web application end to end.
- Skills & Tech Stack:
  * Languages: Python, JavaScript (ES6+)
  * Frontend: React, Tailwind CSS
  * Backend: Firebase (Firestore, Auth), FastAPI (asynchronous microservices)
  * Automation: n8n, Google Apps Script
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

  // Build OpenAI-compatible messages array
  const messages = [
    {
      role: 'system',
      content: isChat ? chatSystemInstruction : voiceSystemInstruction,
    },
  ]

  if (isChat && Array.isArray(history)) {
    const recentHistory = history.slice(-6)
    for (const item of recentHistory) {
      if (!item || !item.text) continue
      const role = item.role === 'assistant' || item.role === 'model' ? 'assistant' : 'user'
      messages.push({
        role,
        content: String(item.text).trim(),
      })
    }
  }

  // Current user query is appended as the latest message
  messages.push({
    role: 'user',
    content: query,
  })

  try {
    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions'
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://yash-portfolio-six-flax.vercel.app',
      'X-Title': 'Yash Chauhan Portfolio',
    }

    const payload = {
      model: 'openrouter/free',
      messages,
      temperature: isChat ? 0.4 : 0.2,
      response_format: { type: 'json_object' },
    }

    let response = await fetch(openRouterUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    // If the selected free model doesn't support response_format: { type: 'json_object' }, retry without it
    if (!response.ok && response.status === 400) {
      const errPeek = await response.clone().text()
      if (errPeek.toLowerCase().includes('response_format')) {
        delete payload.response_format
        response = await fetch(openRouterUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        })
      }
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter API error response:', errText)
      return res.status(response.status).json({ error: 'OpenRouter API call failed' })
    }

    const data = await response.json()

    // Server-side only log for debugging underlying model chosen by the free router
    if (data.model) {
      console.log('OpenRouter model used:', data.model)
    }

    const rawText = data.choices?.[0]?.message?.content?.trim()

    if (!rawText) {
      return res.status(502).json({ error: 'Empty response from model' })
    }

    let parsed
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
      // Extract the first JSON object block {...} via regex for resilient parsing
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      const targetJson = jsonMatch ? jsonMatch[0] : cleaned
      parsed = JSON.parse(targetJson)
    } catch (parseErr) {
      console.error('Failed to parse OpenRouter JSON:', rawText, parseErr)
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
