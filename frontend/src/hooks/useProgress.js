import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  resolveConflict,
  addToRetryQueue,
  processRetryQueue,
  syncToCloud,
  loadFromCloud
} from '../utils/storageSync'

// localStorage keys voor demo mode (backwards compatible)
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
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'synced' | 'offline'
  const retryProcessed = useRef(false)

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
    setSyncStatus('syncing')

    try {
      // STAP 1: Laad eerst uit localStorage (instant feedback)
      const localData = loadFromLocalStorage()

      // STAP 2: Probeer cloud data te laden (met timeout van 5 seconden)
      const cloudPromise = loadFromCloud(supabase, user.id)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloud timeout')), 5000)
      )

      let cloudData
      try {
        cloudData = await Promise.race([cloudPromise, timeoutPromise])
      } catch (e) {
        console.warn('Cloud load failed/timeout, using localStorage:', e.message)
        cloudData = null
      }

      let finalData

      if (cloudData) {
        // STAP 3: Conflict resolution - Highest Progress Wins
        finalData = resolveConflict(localData, cloudData)
        setSyncStatus('synced')

        // Sync het gemerged resultaat naar beide bronnen
        saveToLocalStorage(finalData)
        if (finalData.resolvedFrom === 'local') {
          // Local had meer progress, sync naar cloud
          await syncToCloud(supabase, user.id, finalData)
        }
      } else {
        // Cloud niet bereikbaar, gebruik localStorage
        console.warn('Cloud niet bereikbaar, gebruik localStorage fallback')
        finalData = localData
        setSyncStatus('offline')
      }

      // STAP 4: Update state met gemerged resultaat
      // Sterren: neem uit finalData of profile (hoogste)
      const profileStars = profile?.stars || 0
      const mergedStars = Math.max(finalData.stars || 0, profileStars)
      setStarsState(mergedStars)

      // Completed levels
      if (finalData.completedLevels) {
        setCompletedLevels(prev => ({
          code_kraken: [...new Set([...(prev.code_kraken || []), ...(finalData.completedLevels.code_kraken || [])])],
          stories: [...new Set([...(prev.stories || []), ...(finalData.completedLevels.stories || [])])],
          jumper: [...new Set([...(prev.jumper || []), ...(finalData.completedLevels.jumper || [])])],
          troll: [...new Set([...(prev.troll || []), ...(finalData.completedLevels.troll || [])])]
        }))
      }

      // Unlocked items
      const itemIds = finalData.unlockedItems || []
      if (!itemIds.includes('plant-alien')) {
        itemIds.unshift('plant-alien')
      }
      setUnlockedItemsState(itemIds)

      // STAP 5: Process retry queue (eenmalig bij startup)
      if (!retryProcessed.current) {
        retryProcessed.current = true
        const retryFn = async (operation) => {
          if (operation.type === 'complete_level') {
            await supabase.from('completed_levels').upsert({
              user_id: user.id,
              game_type: operation.gameType,
              level_id: operation.levelId,
              stars_earned: operation.starsEarned,
              completed_at: operation.timestamp
            }, { onConflict: 'user_id,game_type,level_id' })
          } else if (operation.type === 'add_stars') {
            await supabase.from('profiles').update({
              stars: operation.newStars,
              updated_at: new Date().toISOString()
            }).eq('id', user.id)
          } else if (operation.type === 'purchase_item') {
            await supabase.from('user_items').insert({
              user_id: user.id,
              item_id: operation.itemId
            })
          }
        }
        const { processed } = await processRetryQueue(retryFn)
        if (processed > 0) {
          console.log(`Retry queue: ${processed} operaties gesynchroniseerd`)
        }
      }

    } catch (error) {
      console.error('Error loading progress:', error)
      setSyncStatus('offline')

      // Fallback naar localStorage bij error
      const localData = loadFromLocalStorage()
      setStarsState(localData.stars || 50)
      if (localData.completedLevels) {
        setCompletedLevels(localData.completedLevels)
      }
      if (localData.unlockedItems) {
        setUnlockedItemsState(localData.unlockedItems)
      }
    }

    setLoading(false)
  }

  // Sterren toevoegen
  const addStars = useCallback(async (amount) => {
    const newStars = stars + amount

    // STAP 1: Update React state (instant feedback)
    setStarsState(newStars)

    // Voor demo mode wordt automatisch opgeslagen via useEffect
    if (user && !isDemoMode) {
      // STAP 2: Save to localStorage (backup)
      saveToLocalStorage({
        stars: newStars,
        completedLevels,
        unlockedItems
      })

      // STAP 3: Sync naar database
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ stars: newStars, updated_at: new Date().toISOString() })
          .eq('id', user.id)

        if (error) throw error
      } catch (e) {
        console.error('Sync sterren naar cloud failed:', e)
        // Voeg toe aan retry queue
        addToRetryQueue({
          type: 'add_stars',
          newStars,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
      }
    }
  }, [stars, completedLevels, unlockedItems, user, isDemoMode])

  // Sterren aftrekken (voor aankopen)
  const spendStars = useCallback(async (amount) => {
    if (stars < amount) return false

    const newStars = stars - amount

    // STAP 1: Update React state (instant feedback)
    setStarsState(newStars)

    // Voor demo mode wordt automatisch opgeslagen via useEffect
    if (user && !isDemoMode) {
      // STAP 2: Save to localStorage (backup)
      saveToLocalStorage({
        stars: newStars,
        completedLevels,
        unlockedItems
      })

      // STAP 3: Sync naar database
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ stars: newStars, updated_at: new Date().toISOString() })
          .eq('id', user.id)

        if (error) throw error
      } catch (e) {
        console.error('Sync sterren naar cloud failed:', e)
        addToRetryQueue({
          type: 'add_stars',
          newStars,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
      }
    }
    return true
  }, [stars, completedLevels, unlockedItems, user, isDemoMode])

  // Level voltooien
  const completeLevel = useCallback(async (gameType, levelId, starsEarned = 0) => {
    // STAP 1: Update lokale React state (instant feedback)
    let newCompletedLevels
    setCompletedLevels(prev => {
      if (prev[gameType]?.includes(levelId)) {
        newCompletedLevels = prev
        return prev
      }
      newCompletedLevels = {
        ...prev,
        [gameType]: [...(prev[gameType] || []), levelId]
      }
      return newCompletedLevels
    })

    // Voeg sterren toe (dit handled eigen localStorage sync)
    if (starsEarned > 0) {
      await addStars(starsEarned)
    }

    // Opslaan in database (niet voor demo mode - dat gaat via localStorage)
    if (user && !isDemoMode) {
      // STAP 2: Save to localStorage (backup)
      // Wacht even tot state is geupdate
      setTimeout(() => {
        saveToLocalStorage({
          stars: stars + starsEarned,
          completedLevels: newCompletedLevels || completedLevels,
          unlockedItems
        })
      }, 0)

      // STAP 3: Sync naar database
      try {
        const { error } = await supabase
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

        if (error) throw error
      } catch (e) {
        console.error('Sync level naar cloud failed:', e)
        // Voeg toe aan retry queue
        addToRetryQueue({
          type: 'complete_level',
          gameType,
          levelId,
          starsEarned,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
      }
    }
  }, [user, addStars, isDemoMode, stars, completedLevels, unlockedItems])

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

    // Trek sterren af (dit handled eigen localStorage sync)
    const spent = await spendStars(price)
    if (!spent) return { success: false, reason: 'Niet genoeg sterren' }

    // STAP 1: Voeg item toe aan React state (instant feedback)
    const newUnlockedItems = [...unlockedItems, itemId]
    setUnlockedItemsState(newUnlockedItems)

    // Opslaan in database (niet voor demo mode - dat gaat via localStorage)
    if (user && !isDemoMode) {
      // STAP 2: Save to localStorage (backup)
      saveToLocalStorage({
        stars: stars - price,
        completedLevels,
        unlockedItems: newUnlockedItems
      })

      // STAP 3: Sync naar database
      try {
        const { error } = await supabase
          .from('user_items')
          .insert({
            user_id: user.id,
            item_id: itemId
          })

        if (error) throw error
      } catch (e) {
        console.error('Sync item naar cloud failed:', e)
        // Voeg toe aan retry queue
        addToRetryQueue({
          type: 'purchase_item',
          itemId,
          userId: user.id,
          timestamp: new Date().toISOString()
        })
      }
    }

    return { success: true }
  }, [stars, unlockedItems, completedLevels, spendStars, user, isDemoMode])

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
    syncStatus, // 'idle' | 'syncing' | 'synced' | 'offline'
    refresh: loadProgress
  }
}
