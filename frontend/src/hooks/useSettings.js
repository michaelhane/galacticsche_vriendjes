import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'

const defaultSettings = {
  theme: 'space-light',
  font_type: 'sans',
  text_size: 'normal',
  letter_spacing: false
}

export const useSettings = () => {
  const { user } = useAuth()
  const [settings, setSettingsState] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)

  // Laad instellingen bij login
  useEffect(() => {
    if (user) {
      loadSettings()
    } else {
      // Probeer uit localStorage te laden voor niet-ingelogde gebruikers
      const saved = localStorage.getItem('galactische_settings')
      if (saved) {
        try {
          setSettingsState(JSON.parse(saved))
        } catch (e) {
          setSettingsState(defaultSettings)
        }
      }
      setLoading(false)
    }
  }, [user])

  const loadSettings = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setSettingsState({
        theme: data.theme || defaultSettings.theme,
        font_type: data.font_type || defaultSettings.font_type,
        text_size: data.text_size || defaultSettings.text_size,
        letter_spacing: data.letter_spacing ?? defaultSettings.letter_spacing
      })
    } else if (error && error.code === 'PGRST116') {
      // Geen settings gevonden, maak defaults aan
      await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...defaultSettings })
    }
    setLoading(false)
  }

  const updateSetting = useCallback(async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettingsState(newSettings)

    // Altijd opslaan in localStorage als backup
    localStorage.setItem('galactische_settings', JSON.stringify(newSettings))

    // Als ingelogd, ook naar database
    if (user) {
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          [key]: value
        }, {
          onConflict: 'user_id'
        })
    }
  }, [settings, user])

  // Convenience functies
  const setTheme = (theme) => updateSetting('theme', theme)
  const setFontType = (fontType) => updateSetting('font_type', fontType)
  const setTextSize = (textSize) => updateSetting('text_size', textSize)
  const setLetterSpacing = (spacing) => updateSetting('letter_spacing', spacing)

  // CSS classes gebaseerd op instellingen
  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'space-light': return 'bg-[#F0F4F8] text-slate-900'
      case 'mars': return 'bg-[#FFF5F0] text-red-950'
      case 'deep-space': return 'bg-[#1a202c] text-blue-50'
      default: return 'bg-white text-gray-900'
    }
  }

  const getFontClasses = () => {
    let classes = settings.font_type === 'comic' ? 'font-comic' : 'font-sans'
    if (settings.letter_spacing) classes += ' tracking-widest leading-loose'
    if (settings.text_size === 'large') classes += ' text-xl'
    else if (settings.text_size === 'xl') classes += ' text-2xl'
    else classes += ' text-lg'
    return classes
  }

  return {
    settings,
    setTheme,
    setFontType,
    setTextSize,
    setLetterSpacing,
    getThemeClasses,
    getFontClasses,
    loading
  }
}
