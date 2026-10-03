import { verifyAdminToken } from './_lib/verifyAdminToken.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = verifyAdminToken(req, res)
  if (!payload) return

  const { resourceId, downloadable } = req.body || {}

  if (!resourceId || typeof resourceId !== 'string') {
    return res.status(400).json({ error: 'resourceId is required' })
  }

  if (typeof downloadable !== 'boolean') {
    return res.status(400).json({ error: 'downloadable must be a boolean' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error: updateErr } = await supabaseAdmin
      .from('resources')
      .update({ downloadable })
      .eq('id', resourceId)
      .select()
      .single()

    if (updateErr) {
      console.error('Failed to update resource:', updateErr)
      return res.status(400).json({ error: updateErr.message || 'Failed to update resource' })
    }

    return res.status(200).json({ ok: true, resource: data })
  } catch (err) {
    console.error('admin-update-resource error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
