// Vercel serverless function.
// Reads GEMINI_API_KEY from environment variables (configured in Vercel dashboard).
// Serves as the smart backend for voice navigation (Step 5) and ChatWithYash (Step 8).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { transcript, message, prompt } = req.body || {}
  const query = (transcript || message || prompt || '').trim()

  if (!query) {
    return res.status(400).json({ error: 'Query or transcript is required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
  }

  const systemInstruction = `You are the AI assistant on Yash Chauhan's portfolio website.
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

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: query }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
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
      reply: parsed.reply || 'Navigating...',
    })
  } catch (err) {
    console.error('assistant.js unexpected error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
