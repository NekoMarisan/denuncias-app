import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkmcaklsvwqrtpprsymv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbWNha2xzdndxcnRwcHJzeW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MjcyMjcsImV4cCI6MjA5MzUwMzIyN30.k1bHIfe8TuDo6Gb6oAhghmwmM3y6_KxjAfOLcwVAQFo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,   // 🔥 clave: usa sessionStorage por pestaña
    autoRefreshToken: true,
    persistSession: true,
  },
})