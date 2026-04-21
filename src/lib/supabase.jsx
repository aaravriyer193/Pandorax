import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// ── Convenience query helpers ──────────────────────────────

/** Fetch paginated published wonders with author info */
export async function fetchWonders({ page = 0, limit = 20, category = null } = {}) {
  let query = supabase
    .from('wonders_with_author')
    .select('*')
    .order('published_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1)

  if (category) query = query.eq('category_slug', category)

  const { data, error } = await query
  if (error) throw error
  return data
}

/** Fetch trending wonders via RPC */
export async function fetchTrending({ limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .rpc('get_trending_wonders', { p_limit: limit, p_offset: offset })
  if (error) throw error
  return data
}

/** Fetch a single wonder by id */
export async function fetchWonder(id) {
  const { data, error } = await supabase
    .from('wonders_with_author')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/** Fetch comments for a target */
export async function fetchComments(targetId, targetType) {
  const { data, error } = await supabase
    .from('comments_with_author')
    .select('*')
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

/** Fetch today's simulation */
export async function fetchTodaySim() {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('simulations')
    .select('*')
    .eq('sim_date', today)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

/** Fetch forum posts */
export async function fetchForumPosts({ page = 0, limit = 20, category = null, sort = 'latest' } = {}) {
  let query = supabase
    .from('forum_posts_with_author')
    .select('*')
    .range(page * limit, page * limit + limit - 1)

  if (category) query = query.eq('category_slug', category)
  if (sort === 'top') query = query.order('like_count', { ascending: false })
  else query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return data
}

/** Fetch a profile by username */
export async function fetchProfile(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  if (error) throw error
  return data
}

/** Toggle like — insert or delete */
export async function toggleLike(userId, targetId, targetType) {
  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('target_id', targetId)
    .eq('target_type', targetType)
    .single()

  if (existing) {
    await supabase.from('likes').delete()
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .eq('target_type', targetType)
    return false // unliked
  } else {
    await supabase.from('likes').insert({ user_id: userId, target_id: targetId, target_type: targetType })
    return true // liked
  }
}

/** Toggle follow */
export async function toggleFollow(followerId, followingId) {
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  if (existing) {
    await supabase.from('follows').delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
    return false
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
    return true
  }
}