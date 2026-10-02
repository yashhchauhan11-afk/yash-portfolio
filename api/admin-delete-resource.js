import { verifyAdminToken } from './_lib/verifyAdminToken.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = verifyAdminToken(req, res)
  if (!payload) return

  const { resourceId } = req.body || {}

  if (!resourceId || typeof resourceId !== 'string') {
    return res.status(400).json({ error: 'resourceId is required' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { error: deleteErr } = await supabaseAdmin
      .from('resources')
      .delete()
      .eq('id', resourceId)

    if (deleteErr) {
      console.error('Failed to delete resource:', deleteErr)
      return res.status(400).json({ error: deleteErr.message || 'Failed to delete resource' })
    }

    return res.status(200).json({ ok: true, deletedId: resourceId })
  } catch (err) {
    console.error('admin-delete-resource error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
