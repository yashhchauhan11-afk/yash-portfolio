import crypto from 'crypto'

/**
 * Verifies the admin HMAC token from request headers or body.
 * Returns decoded payload if valid, or null after writing 401 response if invalid.
 */
export function verifyAdminToken(req, res) {
  const token =
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    req.headers['x-admin-token'] ||
    req.body?.token

  if (!token || typeof token !== 'string') {
    res.status(401).json({ error: 'Unauthorized: Missing token' })
    return null
  }

  const tokenSecret = process.env.TOKEN_SECRET
  if (!tokenSecret) {
    console.error('Server configuration error: TOKEN_SECRET is missing.')
    res.status(500).json({ error: 'Server configuration error' })
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    res.status(401).json({ error: 'Unauthorized: Malformed token' })
    return null
  }

  const [b64Payload, signature] = parts

  try {
    const payloadStr = Buffer.from(b64Payload, 'base64').toString('utf8')
    const expectedSig = crypto
      .createHmac('sha256', tokenSecret)
      .update(payloadStr)
      .digest('hex')

    const sigBuf = Buffer.from(signature)
    const expSigBuf = Buffer.from(expectedSig)

    // Constant-time signature comparison
    if (
      sigBuf.length !== expSigBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expSigBuf)
    ) {
      res.status(401).json({ error: 'Unauthorized: Invalid token signature' })
      return null
    }

    const payload = JSON.parse(payloadStr)
    if (!payload.exp || typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      res.status(401).json({ error: 'Unauthorized: Token expired' })
      return null
    }

    return payload
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' })
    return null
  }
}
