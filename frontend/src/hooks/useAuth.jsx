import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})

// Demo mode check - standaard UIT (moet expliciet geactiveerd worden)
const isDemoMode = () => {
  return localStorage.getItem('demo_mode') === 'true'
}

const DEMO_PROFILE = {
  id: 'demo-user',
  display_name: 'Demo Astronaut',
  age: 7,
  grade: 3,
  stars: 50,
  interests: ['dinosaurussen', 'ruimte', 'dieren']
}

// Cache profiel in localStorage voor snelle load
const PROFILE_CACHE_KEY = 'galactische_vrienden_profile'

const getCachedProfile = () => {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch { return null }
}

const setCachedProfile = (profile) => {
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    }
  } catch { }
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

    // Check huidige sessie met timeout
    const sessionPromise = supabase.auth.getSession()
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ data: { session: null }, timedOut: true }), 2000)
    )

    Promise.race([sessionPromise, timeoutPromise]).then((result) => {
      if (result.timedOut) {
        console.warn('Session check timeout - using cached profile')
        // Probeer cached profiel te gebruiken
        const cached = getCachedProfile()
        if (cached) {
          setUser({ id: cached.id })
          setProfile(cached)
        }
        setLoading(false)
        return
      }

      const session = result.data?.session
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
    // STAP 1: Gebruik cache voor instant load
    const cached = getCachedProfile()
    if (cached && cached.id === userId) {
      setProfile(cached)
      setLoading(false)
      // Sync op achtergrond (geen await)
      syncProfileFromCloud(userId)
      return
    }

    // STAP 2: Geen cache, probeer Supabase met korte timeout
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
    )

    try {
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
      }
      if (data) {
        setProfile(data)
        setCachedProfile(data)
      }
    } catch (e) {
      console.warn('Profile fetch failed/timeout:', e.message)
      setProfile(null)
    }
    setLoading(false)
  }

  // Achtergrond sync - update cache met verse data
  const syncProfileFromCloud = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
        setCachedProfile(data)
      }
    } catch (e) {
      // Stil falen - cache is al geladen
    }
  }

  // OTP login - stuurt magic link naar email (met code in link)
  const signInWithOtp = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
          shouldCreateUser: true
        }
      })
      return { error }
    } catch (e) {
      console.error('signInWithOtp exception:', e)
      return { error: e }
    }
  }

  // Verifieer de OTP code
  const verifyOtp = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    return { error }
  }

  // Legacy: Magic Link login (backup)
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
    // Clear demo mode en cache
    localStorage.removeItem('demo_mode')
    setCachedProfile(null)

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

    if (!error && data) {
      setProfile(data)
      setCachedProfile(data) // Cache updaten
    }
    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    signInWithOtp,
    verifyOtp,
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
