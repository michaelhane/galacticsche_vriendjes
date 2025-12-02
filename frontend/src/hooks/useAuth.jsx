import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

// Demo mode check - standaard AAN voor makkelijk testen
const isDemoMode = () => {
  // Als niet expliciet uitgezet, is demo mode aan
  return localStorage.getItem('demo_mode') !== 'false'
}

const DEMO_PROFILE = {
  id: 'demo-user',
  display_name: 'Demo Astronaut',
  age: 7,
  grade: 3,
  stars: 50,
  interests: ['dinosaurussen', 'ruimte', 'dieren']
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check demo mode eerst
    if (isDemoMode()) {
      setUser({ id: 'demo-user', email: 'demo@test.nl' })
      setProfile(DEMO_PROFILE)
      setLoading(false)
      return
    }

    // Check huidige sessie
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Luister naar auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
    }
    setProfile(data)
    setLoading(false)
  }

  // Magic Link login
  const signInWithMagicLink = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    return { error }
  }

  // Uitloggen
  const signOut = async () => {
    // Clear demo mode
    localStorage.removeItem('demo_mode')

    const { error } = await supabase.auth.signOut()
    if (!error) {
      setUser(null)
      setProfile(null)
    }
    return { error }
  }

  // Demo login (voor development)
  const signInDemo = () => {
    localStorage.setItem('demo_mode', 'true')
    setUser({ id: 'demo-user', email: 'demo@test.nl' })
    setProfile(DEMO_PROFILE)
  }

  // Profiel aanmaken/updaten
  const updateProfile = async (updates) => {
    if (!user) return { error: 'Niet ingelogd' }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (!error) {
      setProfile(data)
    }
    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    signInWithMagicLink,
    signInDemo,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    hasProfile: !!profile?.display_name,
    isDemoMode: isDemoMode()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth moet binnen AuthProvider gebruikt worden')
  }
  return context
}
