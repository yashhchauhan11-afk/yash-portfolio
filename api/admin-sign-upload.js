import crypto from 'crypto'
import { verifyAdminToken } from './_lib/verifyAdminToken.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = verifyAdminToken(req, res)
  if (!payload) return

  const { filename } = req.body || {}

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Filename is required' })
  }

  try {
    const rawExt = filename.split('.').pop() || 'pdf'
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'pdf'
    const uniquePath = `${crypto.randomUUID()}.${ext}`

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.storage
      .from('resources')
      .createSignedUploadUrl(uniquePath)

    if (error) {
      console.error('createSignedUploadUrl error:', error)
      return res.status(500).json({ error: error.message || 'Failed to sign upload URL' })
    }

    return res.status(200).json({
      signedUrl: data.signedUrl,
      path: data.path || uniquePath,
    })
  } catch (err) {
    console.error('admin-sign-upload error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
