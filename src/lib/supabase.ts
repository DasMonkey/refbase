import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    // Use a simple health check instead of querying a specific table
    const { data, error } = await supabase.auth.getSession()
    
    if (error && error.message !== 'Auth session missing!') {
      console.error('Supabase connection error:', error)
      return { connected: false, error: error.message }
    }
    
    // If we get here, the connection is working
    console.log('✅ Supabase connected successfully!')
    return { connected: true, error: null }
  } catch (err) {
    console.error('Supabase connection failed:', err)
    return { connected: false, error: 'Failed to connect to Supabase' }
  }
}