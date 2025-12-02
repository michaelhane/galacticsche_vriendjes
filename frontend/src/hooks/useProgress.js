import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'

// localStorage keys voor demo mode
const DEMO_STORAGE_KEY = 'galactische_vrienden_demo_progress'

// Helper functies voor demo localStorage
const loadDemoProgress = () => {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Error loading demo progress:', e)
  }
  // Defaults
  return {
    stars: 50,
    completedLevels: { code_kraken: [], stories: [], jumper: [], troll: [] },
    unlockedItems: ['plant-alien']
  }
}

const saveDemoProgress = (progress) => {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(progress))
  } catch (e) {
    console.error('Error saving demo progress:', e)
  }
}

export const useProgress = () => {
  const { user, profile, isDemoMode } = useAuth()
  const [stars, setStarsState] = useState(50)
  const [completedLevels, setCompletedLevels] = useState({
    code_kraken: [],
    stories: [],
    jumper: [],
    troll: []
  })
  const [unlockedItems, setUnlockedItemsState] = useState(['plant-alien'])
  const [loading, setLoading] = useState(true)

  // Laad voortgang bij login of demo mode
  useEffect(() => {
    if (isDemoMode) {
      // Demo mode: laad uit localStorage
      const demoProgress = loadDemoProgress()
      setStarsState(demoProgress.stars)
      setCompletedLevels(demoProgress.completedLevels)
      setUnlockedItemsState(demoProgress.unlockedItems)
      setLoading(false)
    } else if (user) {
      loadProgress()
    } else {
      // Niet ingelogd en geen demo: reset naar defaults
      setStarsState(20)
      setCompletedLevels({ code_kraken: [], stories: [], jumper: [], troll: [] })
      setUnlockedItemsState(['plant-alien'])
      setLoading(false)
    }
  }, [user, isDemoMode])

  // Sla demo progress op bij elke wijziging
  useEffect(() => {
    if (isDemoMode) {
      saveDemoProgress({
        stars,
        completedLevels,
        unlockedItems
      })
    }
  }, [stars, completedLevels, unlockedItems, isDemoMode])

  const loadProgress = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Laad sterren uit profiel
      if (profile?.stars !== undefined) {
        setStarsState(profile.stars)
      }

      // Laad voltooide levels
      const { data: levels } = await supabase
        .from('completed_levels')
        .select('game_type, level_id')
        .eq('user_id', user.id)

      if (levels) {
        const grouped = { code_kraken: [], stories: [], jumper: [], troll: [] }
        levels.forEach(l => {
          if (grouped[l.game_type]) {
            grouped[l.game_type].push(l.level_id)
          }
        })
        setCompletedLevels(grouped)
      }

      // Laad gekochte items
      const { data: items } = await supabase
        .from('user_items')
        .select('item_id')
        .eq('user_id', user.id)

      if (items) {
        const itemIds = items.map(i => i.item_id)
        // Altijd plant-alien erbij (gratis starter)
        if (!itemIds.includes('plant-alien')) {
          itemIds.unshift('plant-alien')
        }
        setUnlockedItemsState(itemIds)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
    setLoading(false)
  }

  // Sterren toevoegen
  const addStars = useCallback(async (amount) => {
    const newStars = stars + amount
    setStarsState(newStars)

    // Voor demo mode wordt automatisch opgeslagen via useEffect
    if (user && !isDemoMode) {
      await supabase
        .from('profiles')
        .update({ stars: newStars, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }
  }, [stars, user, isDemoMode])

  // Sterren aftrekken (voor aankopen)
  const spendStars = useCallback(async (amount) => {
    if (stars < amount) return false

    const newStars = stars - amount
    setStarsState(newStars)

    // Voor demo mode wordt automatisch opgeslagen via useEffect
    if (user && !isDemoMode) {
      await supabase
        .from('profiles')
        .update({ stars: newStars, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }
    return true
  }, [stars, user, isDemoMode])

  // Level voltooien
  const completeLevel = useCallback(async (gameType, levelId, starsEarned = 0) => {
    // Update lokale state
    setCompletedLevels(prev => {
      if (prev[gameType]?.includes(levelId)) return prev
      return {
        ...prev,
        [gameType]: [...(prev[gameType] || []), levelId]
      }
    })

    // Voeg sterren toe
    if (starsEarned > 0) {
      await addStars(starsEarned)
    }

    // Opslaan in database (niet voor demo mode - dat gaat via localStorage)
    if (user && !isDemoMode) {
      await supabase
        .from('completed_levels')
        .upsert({
          user_id: user.id,
          game_type: gameType,
          level_id: levelId,
          stars_earned: starsEarned,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,game_type,level_id'
        })
    }
  }, [user, addStars, isDemoMode])

  // Check of level unlocked is
  const isLevelUnlocked = useCallback((gameType, levelId) => {
    if (levelId === 0) return true // Eerste level altijd open
    const completed = completedLevels[gameType] || []
    return completed.includes(levelId - 1) // Vorige level moet voltooid zijn
  }, [completedLevels])

  // Item kopen
  const purchaseItem = useCallback(async (itemId, price) => {
    if (unlockedItems.includes(itemId)) return { success: false, reason: 'Al gekocht' }
    if (stars < price) return { success: false, reason: 'Niet genoeg sterren' }

    // Trek sterren af
    const spent = await spendStars(price)
    if (!spent) return { success: false, reason: 'Niet genoeg sterren' }

    // Voeg item toe
    setUnlockedItemsState(prev => [...prev, itemId])

    // Opslaan in database (niet voor demo mode - dat gaat via localStorage)
    if (user && !isDemoMode) {
      await supabase
        .from('user_items')
        .insert({
          user_id: user.id,
          item_id: itemId
        })
    }

    return { success: true }
  }, [stars, unlockedItems, spendStars, user, isDemoMode])

  return {
    stars,
    addStars,
    spendStars,
    completedLevels,
    completeLevel,
    isLevelUnlocked,
    unlockedItems,
    purchaseItem,
    loading,
    refresh: loadProgress
  }
}
