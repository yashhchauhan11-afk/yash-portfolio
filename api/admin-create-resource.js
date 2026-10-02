import { verifyAdminToken } from './_lib/verifyAdminToken.js'
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload = verifyAdminToken(req, res)
  if (!payload) return

  const { collectionId, newCollection, title, description, filePath } = req.body || {}

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Resource title is required' })
  }

  if (!filePath || typeof filePath !== 'string' || !filePath.trim()) {
    return res.status(400).json({ error: 'filePath is required' })
  }

  if (!collectionId && (!newCollection || !newCollection.title)) {
    return res.status(400).json({ error: 'collectionId or newCollection with title is required' })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin()
    let targetCollectionId = collectionId

    // If newCollection is provided, insert it first using service_role
    if (newCollection && newCollection.title) {
      const trimmedTitle = newCollection.title.trim()
      const rawSlug = newCollection.slug?.trim() || trimmedTitle
      const slug = rawSlug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `collection-${Date.now()}`

      const { data: createdCol, error: colErr } = await supabaseAdmin
        .from('collections')
        .insert({
          title: trimmedTitle,
          slug,
          excerpt: newCollection.excerpt?.trim() || '',
        })
        .select()
        .single()

      if (colErr) {
        console.error('Failed to create new collection:', colErr)
        return res.status(400).json({ error: colErr.message || 'Failed to create collection' })
      }

      targetCollectionId = createdCol.id
    }

    // Resolve public URL if filePath is relative
    let resolvedUrl = filePath.trim()
    if (!resolvedUrl.startsWith('http://') && !resolvedUrl.startsWith('https://')) {
      const { data: urlData } = supabaseAdmin.storage
        .from('resources')
        .getPublicUrl(resolvedUrl)
      resolvedUrl = urlData.publicUrl
    }

    // Determine next sort_order
    const { data: existingRows } = await supabaseAdmin
      .from('resources')
      .select('sort_order')
      .eq('collection_id', targetCollectionId)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = (existingRows?.[0]?.sort_order ?? -1) + 1

    const { data: createdResource, error: insertErr } = await supabaseAdmin
      .from('resources')
      .insert({
        collection_id: targetCollectionId,
        title: title.trim(),
        description: description?.trim() || '',
        file_path: resolvedUrl,
        sort_order: nextSortOrder,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('Failed to insert resource:', insertErr)
      return res.status(400).json({ error: insertErr.message || 'Failed to insert resource' })
    }

    return res.status(201).json({ ok: true, resource: createdResource })
  } catch (err) {
    console.error('admin-create-resource error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
