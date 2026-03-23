import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// 前端用这个（用户登录、读取自己的数据）
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// 后端用这个（有完整权限，只能在服务器端使用）
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SECRET_KEY!
)