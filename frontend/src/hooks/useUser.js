import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'

/**
 * useUser - Hook voor uitgebreide gebruikerspersonalisatie
 * Biedt toegang tot en beheer van personalisatie data (huisdier, held, kleur, etc.)
 */
export const useUser = () => {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)

  // Gestructureerde personalisatie data
  const personalization = {
    // Basis
    name: profile?.display_name || 'Astronaut',
    age: profile?.age || 7,
    grade: profile?.grade || 3,

    // Personalisatie
    petInfo: profile?.pet_info || null,
    petName: profile?.pet_info?.name || null,
    petType: profile?.pet_info?.type || null,
    idol: profile?.idol || null,
    favoriteColor: profile?.favorite_color || 'blauw',
    interests: profile?.interests || [],

    // AVI niveau
    aviLevel: profile?.avi_level || 'E3',
    targetAviLevel: profile?.target_avi_level || null
  }

  /**
   * Update personalisatie velden
   */
  const updatePersonalization = useCallback(async (updates) => {
    setLoading(true)
    try {
      const result = await updateProfile(updates)
      return result
    } finally {
      setLoading(false)
    }
  }, [updateProfile])

  /**
   * Update huisdier info
   */
  const updatePet = useCallback(async (type, name) => {
    const petInfo = type && type !== 'geen' ? { type, name: name || type } : null
    return updatePersonalization({ pet_info: petInfo })
  }, [updatePersonalization])

  /**
   * Update held/idool
   */
  const updateIdol = useCallback(async (idol) => {
    return updatePersonalization({ idol: idol || null })
  }, [updatePersonalization])

  /**
   * Update favoriete kleur
   */
  const updateFavoriteColor = useCallback(async (color) => {
    return updatePersonalization({ favorite_color: color })
  }, [updatePersonalization])

  /**
   * Update interesses
   */
  const updateInterests = useCallback(async (interests) => {
    return updatePersonalization({ interests })
  }, [updatePersonalization])

  /**
   * Update AVI niveau
   */
  const updateAviLevel = useCallback(async (level) => {
    return updatePersonalization({ avi_level: level })
  }, [updatePersonalization])

  /**
   * Haal placeholder waarden op voor tekst personalisatie
   * Te gebruiken met textPersonalizer utility
   */
  const getPlaceholders = useCallback(() => {
    return {
      naam: personalization.name,
      kind: personalization.name,
      leeftijd: personalization.age,
      groep: personalization.grade,
      huisdier: personalization.petName || 'het huisdier',
      huisdiernaam: personalization.petName || 'Buddy',
      huisdiertype: personalization.petType || 'huisdier',
      held: personalization.idol || 'de held',
      idool: personalization.idol || 'de held',
      kleur: personalization.favoriteColor || 'blauw',
      // Extra varianten
      Naam: capitalize(personalization.name),
      Huisdier: capitalize(personalization.petName || 'het huisdier'),
      Held: capitalize(personalization.idol || 'de held')
    }
  }, [personalization])

  /**
   * Check of personalisatie compleet is
   */
  const isPersonalizationComplete = useCallback(() => {
    return !!(
      personalization.name &&
      personalization.favoriteColor &&
      personalization.interests?.length > 0
    )
  }, [personalization])

  /**
   * Haal emoji voor huisdier type
   */
  const getPetEmoji = useCallback(() => {
    const petEmojis = {
      hond: '🐕',
      kat: '🐱',
      konijn: '🐰',
      hamster: '🐹',
      vis: '🐠',
      vogel: '🐦',
      schildpad: '🐢'
    }
    return petEmojis[personalization.petType] || '🐾'
  }, [personalization.petType])

  /**
   * Haal kleur class voor Tailwind
   */
  const getColorClass = useCallback((type = 'bg') => {
    const colorMap = {
      blauw: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
      paars: { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500' },
      roze: { bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-500' },
      rood: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
      oranje: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
      geel: { bg: 'bg-yellow-400', text: 'text-yellow-500', border: 'border-yellow-400' },
      groen: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
      cyaan: { bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500' }
    }
    const colors = colorMap[personalization.favoriteColor] || colorMap.blauw
    return colors[type] || colors.bg
  }, [personalization.favoriteColor])

  return {
    // Data
    user,
    profile,
    personalization,
    loading,

    // Getters
    getPlaceholders,
    isPersonalizationComplete,
    getPetEmoji,
    getColorClass,

    // Updaters
    updatePersonalization,
    updatePet,
    updateIdol,
    updateFavoriteColor,
    updateInterests,
    updateAviLevel
  }
}

// Helper functie
const capitalize = (str) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export default useUser
