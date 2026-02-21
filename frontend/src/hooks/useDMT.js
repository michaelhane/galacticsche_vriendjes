/**
 * useDMT HOOK
 * Beheert DMT sessies en milestones (Snowboard Sprint).
 *
 * Volgt hetzelfde patroon als useProgress.js:
 * 1. State update (instant feedback)
 * 2. localStorage save (immediate backup)
 * 3. Supabase sync (persistent storage)
 *
 * Milestone logica:
 * - Eerste sessie voor een level = baseline
 * - Milestones bij +10%, +20%, +30%, +40% boven baseline
 * - snowboardPosition 0-1 float (0 = onderaan berg, 1 = top)
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'
import { DMT_CONSTANTS } from '../components/Games/DMT/dmtWords'

// localStorage keys
const SESSIONS_KEY = 'galactische_dmt_sessions'
const MILESTONES_KEY = 'galactische_dmt_milestones'

// --- localStorage helpers ---

const loadLocalSessions = () => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Error loading DMT sessions from localStorage:', e)
    return []
  }
}

const saveLocalSessions = (sessions) => {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  } catch (e) {
    console.error('Error saving DMT sessions to localStorage:', e)
  }
}

const loadLocalMilestones = () => {
  try {
    const data = localStorage.getItem(MILESTONES_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('Error loading DMT milestones from localStorage:', e)
    return {}
  }
}

const saveLocalMilestones = (milestones) => {
  try {
    localStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones))
  } catch (e) {
    console.error('Error saving DMT milestones to localStorage:', e)
  }
}

// --- Hook ---

export const useDMT = () => {
  const { user, isDemoMode } = useAuth()
  const [sessions, setSessions] = useState([])
  const [milestones, setMilestones] = useState({}) // keyed by aviLevel
  const [loading, setLoading] = useState(true)

  // --- Laden bij mount / user change ---

  useEffect(() => {
    if (isDemoMode) {
      // Demo: alleen localStorage
      setSessions(loadLocalSessions())
      setMilestones(loadLocalMilestones())
      setLoading(false)
    } else if (user) {
      loadFromSupabase()
    } else {
      setSessions([])
      setMilestones({})
      setLoading(false)
    }
  }, [user, isDemoMode])

  const loadFromSupabase = async () => {
    if (!user) return
    setLoading(true)

    try {
      // Laad localStorage eerst (instant feedback)
      const localSessions = loadLocalSessions()
      const localMilestones = loadLocalMilestones()

      // Stel lokale data alvast in
      setSessions(localSessions)
      setMilestones(localMilestones)

      // Probeer cloud data te laden (10 sec timeout voor cold starts)
      const sessionsPromise = supabase
        .from('dmt_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      const milestonesPromise = supabase
        .from('dmt_milestones')
        .select('*')
        .eq('user_id', user.id)

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Cloud timeout')), 10000)
      )

      const [sessionsResult, milestonesResult] = await Promise.race([
        Promise.all([sessionsPromise, milestonesPromise]),
        timeoutPromise.then(() => { throw new Error('Cloud timeout') })
      ])

      if (sessionsResult.error) throw sessionsResult.error
      if (milestonesResult.error) throw milestonesResult.error

      const cloudSessions = sessionsResult.data || []
      const cloudMilestonesArr = milestonesResult.data || []

      // Cloud milestones array -> object keyed by avi_level
      const cloudMilestones = {}
      for (const m of cloudMilestonesArr) {
        cloudMilestones[m.avi_level] = {
          id: m.id,
          aviLevel: m.avi_level,
          baseline: m.baseline,
          currentMilestone: m.current_milestone,
          bestScore: m.best_score,
          snowboardPosition: m.snowboard_position,
          updatedAt: m.updated_at
        }
      }

      // Merge: cloud wint voor sessies (ze zijn de source of truth)
      // Voor milestones: neem de hoogste progress
      const mergedMilestones = { ...localMilestones }
      for (const [level, cloudMs] of Object.entries(cloudMilestones)) {
        const localMs = mergedMilestones[level]
        if (!localMs || cloudMs.currentMilestone > (localMs.currentMilestone || 0) ||
            cloudMs.bestScore > (localMs.bestScore || 0)) {
          mergedMilestones[level] = cloudMs
        }
      }

      // Gebruik cloud sessies als ze beschikbaar zijn, anders lokaal
      const finalSessions = cloudSessions.length > 0
        ? cloudSessions.map(s => ({
            id: s.id,
            mode: s.mode,
            aviLevel: s.avi_level,
            settings: s.settings,
            results: s.results,
            isBaseline: s.is_baseline,
            createdAt: s.created_at
          }))
        : localSessions

      setSessions(finalSessions)
      setMilestones(mergedMilestones)

      // Sync naar localStorage
      saveLocalSessions(finalSessions)
      saveLocalMilestones(mergedMilestones)

    } catch (e) {
      console.warn('DMT cloud load failed/timeout, using localStorage:', e.message)
      // localStorage data is al ingesteld hierboven
    }

    setLoading(false)
  }

  // --- Sessie opslaan ---

  const saveSession = useCallback(async (sessionData) => {
    // sessionData: { mode, aviLevel, settings, results }
    // results bevat o.a. wordsRead, timeMs, wpm
    const { mode, aviLevel, settings = {}, results } = sessionData
    const wpm = results.wpm || 0

    // Check of dit de eerste sessie is voor dit level (= baseline)
    const existingSessionsForLevel = sessions.filter(
      s => s.aviLevel === aviLevel && s.mode === 'test'
    )
    const isBaseline = existingSessionsForLevel.length === 0 && mode === 'test'

    const newSession = {
      id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
      mode,
      aviLevel,
      settings,
      results,
      isBaseline,
      createdAt: new Date().toISOString()
    }

    // STAP 1: Update state (instant feedback)
    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)

    // STAP 2: localStorage (backup)
    saveLocalSessions(updatedSessions)

    // STAP 3: Bereken milestone voortgang
    let milestoneResult = {
      milestoneReached: false,
      newMilestone: null,
      isNewRecord: false,
      snowboardPosition: 0
    }

    // Milestone tracking alleen voor test modus
    if (mode === 'test') {
      milestoneResult = updateMilestone(aviLevel, wpm, isBaseline)
    }

    // STAP 4: Sync naar Supabase
    if (user && !isDemoMode) {
      try {
        const { error } = await supabase
          .from('dmt_sessions')
          .insert({
            user_id: user.id,
            mode,
            avi_level: aviLevel,
            settings,
            results,
            is_baseline: isBaseline
          })

        if (error) {
          console.error('DMT session sync naar cloud failed:', error)
        }
      } catch (e) {
        console.error('DMT session sync exception:', e)
      }
    }

    return milestoneResult
  }, [sessions, milestones, user, isDemoMode])

  // --- Milestone update (intern) ---

  const updateMilestone = (aviLevel, wpm, isBaseline) => {
    const current = milestones[aviLevel]
    const thresholds = DMT_CONSTANTS.MILESTONE_THRESHOLDS

    let milestone
    if (isBaseline || !current) {
      // Eerste sessie: stel baseline in
      milestone = {
        aviLevel,
        baseline: wpm,
        currentMilestone: 0,
        bestScore: wpm,
        snowboardPosition: 0,
        updatedAt: new Date().toISOString()
      }
    } else {
      milestone = { ...current }
      // Update best score
      const isNewRecord = wpm > milestone.bestScore
      if (isNewRecord) {
        milestone.bestScore = wpm
      }

      // Bereken welke milestone bereikt is
      const baseline = milestone.baseline
      let newMilestoneIndex = milestone.currentMilestone
      for (let i = milestone.currentMilestone; i < thresholds.length; i++) {
        const target = baseline * (1 + thresholds[i])
        if (wpm >= target) {
          newMilestoneIndex = i + 1
        } else {
          break
        }
      }

      // Bereken snowboard positie (0-1)
      // Lineaire interpolatie op basis van verbetering ten opzichte van max milestone
      const maxThreshold = thresholds[thresholds.length - 1]
      const maxTarget = baseline * (1 + maxThreshold)
      const improvement = Math.max(0, wpm - baseline)
      const maxImprovement = maxTarget - baseline
      milestone.snowboardPosition = maxImprovement > 0
        ? Math.min(1, improvement / maxImprovement)
        : 0

      const milestoneReached = newMilestoneIndex > milestone.currentMilestone
      milestone.currentMilestone = newMilestoneIndex
      milestone.updatedAt = new Date().toISOString()

      // Update state en localStorage
      const updatedMilestones = { ...milestones, [aviLevel]: milestone }
      setMilestones(updatedMilestones)
      saveLocalMilestones(updatedMilestones)

      // Sync naar Supabase
      syncMilestoneToCloud(aviLevel, milestone)

      return {
        milestoneReached,
        newMilestone: milestoneReached ? newMilestoneIndex : null,
        isNewRecord: wpm > (current?.bestScore || 0),
        snowboardPosition: milestone.snowboardPosition
      }
    }

    // Baseline geval: sla op
    const updatedMilestones = { ...milestones, [aviLevel]: milestone }
    setMilestones(updatedMilestones)
    saveLocalMilestones(updatedMilestones)
    syncMilestoneToCloud(aviLevel, milestone)

    return {
      milestoneReached: false,
      newMilestone: null,
      isNewRecord: false,
      snowboardPosition: 0
    }
  }

  // --- Milestone sync naar cloud ---

  const syncMilestoneToCloud = async (aviLevel, milestone) => {
    if (!user || isDemoMode) return

    try {
      const { error } = await supabase
        .from('dmt_milestones')
        .upsert({
          user_id: user.id,
          avi_level: aviLevel,
          baseline: milestone.baseline,
          current_milestone: milestone.currentMilestone,
          best_score: milestone.bestScore,
          snowboard_position: milestone.snowboardPosition,
          updated_at: milestone.updatedAt
        }, {
          onConflict: 'user_id,avi_level'
        })

      if (error) {
        console.error('DMT milestone sync naar cloud failed:', error)
      }
    } catch (e) {
      console.error('DMT milestone sync exception:', e)
    }
  }

  // --- Getters ---

  /**
   * Haal baseline WPM op voor een AVI niveau.
   * @param {string} aviLevel
   * @returns {number|null} Baseline WPM of null als er geen baseline is
   */
  const getBaseline = useCallback((aviLevel) => {
    const ms = milestones[aviLevel]
    return ms ? ms.baseline : null
  }, [milestones])

  /**
   * Haal sessies op voor een specifiek AVI niveau, optioneel gefilterd op modus.
   * @param {string} aviLevel
   * @param {string} [mode] - 'practice' of 'test' (optioneel)
   * @returns {Array} Gefilterde sessies (nieuwste eerst)
   */
  const getSessionsForLevel = useCallback((aviLevel, mode) => {
    return sessions.filter(s => {
      if (s.aviLevel !== aviLevel) return false
      if (mode && s.mode !== mode) return false
      return true
    })
  }, [sessions])

  /**
   * Haal milestone object op voor een AVI niveau.
   * @param {string} aviLevel
   * @returns {Object|null} Milestone object of null
   */
  const getMilestone = useCallback((aviLevel) => {
    return milestones[aviLevel] || null
  }, [milestones])

  /**
   * Reset de baseline voor een AVI niveau (na halfpipe voltooiing).
   * @param {string} aviLevel
   * @param {number} newBaseline - Nieuwe baseline WPM
   */
  const resetBaseline = useCallback(async (aviLevel, newBaseline) => {
    const newMilestone = {
      aviLevel,
      baseline: newBaseline,
      currentMilestone: 0,
      bestScore: newBaseline,
      snowboardPosition: 0,
      updatedAt: new Date().toISOString()
    }

    const updatedMilestones = { ...milestones, [aviLevel]: newMilestone }
    setMilestones(updatedMilestones)
    saveLocalMilestones(updatedMilestones)

    // Sync naar cloud
    if (user && !isDemoMode) {
      try {
        const { error } = await supabase
          .from('dmt_milestones')
          .upsert({
            user_id: user.id,
            avi_level: aviLevel,
            baseline: newBaseline,
            current_milestone: 0,
            best_score: newBaseline,
            snowboard_position: 0,
            updated_at: newMilestone.updatedAt
          }, {
            onConflict: 'user_id,avi_level'
          })

        if (error) {
          console.error('DMT baseline reset sync failed:', error)
        }
      } catch (e) {
        console.error('DMT baseline reset exception:', e)
      }
    }
  }, [milestones, user, isDemoMode])

  return {
    sessions,
    milestones,
    loading,
    saveSession,
    getBaseline,
    getSessionsForLevel,
    getMilestone,
    resetBaseline
  }
}
