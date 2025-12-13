import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials niet gevonden. Check je .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Helper functie voor error handling
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  return null
}

// Ping Supabase om database actief te houden (voorkomt pauzeren free tier)
// Wordt aangeroepen bij app start, ongeacht demo mode
export const pingSupabase = async () => {
  try {
    // Simpele SELECT query om activiteit te tonen
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.log('Supabase ping failed:', error.message)
    } else {
      console.log('Supabase ping OK ✓')
    }
    return !error
  } catch (e) {
    console.log('Supabase ping error:', e.message)
    return false
  }
}

// Ping bij module load (app start)
pingSupabase()
