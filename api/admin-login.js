import crypto from 'crypto'

function timingSafeCheck(input, secret) {
  if (typeof input !== 'string' || typeof secret !== 'string') return false
  const inputBuf = Buffer.from(input, 'utf8')
  const secretBuf = Buffer.from(secret, 'utf8')
  const maxLen = Math.max(inputBuf.length, secretBuf.length, 1)
  const paddedInput = Buffer.alloc(maxLen, 0)
  const paddedSecret = Buffer.alloc(maxLen, 0)
  inputBuf.copy(paddedInput)
  secretBuf.copy(paddedSecret)
  const lengthMatch = inputBuf.length === secretBuf.length
  const contentMatch = crypto.timingSafeEqual(paddedInput, paddedSecret)
  return lengthMatch && contentMatch
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body || {}

  if (!password || typeof password !== 'string') {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const tokenSecret = process.env.TOKEN_SECRET

  if (!adminPassword || !tokenSecret) {
    console.error('Server configuration error: ADMIN_PASSWORD or TOKEN_SECRET missing.')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const isValid = timingSafeCheck(password, adminPassword)

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const payload = JSON.stringify({ exp: Date.now() + 2 * 60 * 60 * 1000 })
  const signature = crypto
    .createHmac('sha256', tokenSecret)
    .update(payload)
    .digest('hex')

  const token = `${Buffer.from(payload, 'utf8').toString('base64')}.${signature}`

  return res.status(200).json({ ok: true, token })
}
