# DMT Snowboard Sprint - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a DMT (Drie Minuten Toets) speed-reading game with practice mode, test mode, and snowboard-themed milestone rewards.

**Architecture:** Multi-component game within existing Galactische Vrienden React app. Data stored in Supabase with localStorage fallback. Snowboard SVG scene as separate visual component. Two game modes (practice + test) sharing a common data layer and results screen.

**Tech Stack:** React 18, Tailwind CSS, Supabase (PostgreSQL), SVG animations, Web Speech API

**Design Doc:** `docs/plans/2026-02-21-dmt-snowboard-sprint-design.md`

---

## Agent Execution Overview

```
Fase 1 (parallel, no dependencies):
  ├── Agent 1: Database & Data Layer     → Tasks 1-3
  └── Agent 2: Snowboard Visuals         → Task 4

Fase 2 (parallel, after Agent 1 completes):
  ├── Agent 3: Oefenmodus                → Task 5
  └── Agent 4: Toetsmodus                → Task 6

Fase 3 (after Agents 1+2+3+4 complete):
  └── Agent 5: Menu, Results, Integration → Tasks 7-8

Fase 4:
  └── Coordinator: Review + Final wiring  → Task 9
```

---

## Task 1: Supabase Database Migration (Agent 1)

**Files:**
- Modify: `supabase_schema.sql` (append new tables)
- Run: SQL migration via Supabase SQL Editor or MCP

**Step 1: Create dmt_sessions table**

Run this SQL against the Supabase project (ref from `.env` VITE_SUPABASE_URL):

```sql
-- DMT Sessions: stores every practice/test session
CREATE TABLE IF NOT EXISTS public.dmt_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('practice', 'test')),
  avi_level TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  results JSONB NOT NULL,
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dmt_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dmt sessions"
  ON public.dmt_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dmt sessions"
  ON public.dmt_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dmt_sessions_user_level
  ON public.dmt_sessions(user_id, avi_level);

CREATE INDEX IF NOT EXISTS idx_dmt_sessions_user_created
  ON public.dmt_sessions(user_id, created_at DESC);
```

**Step 2: Create dmt_milestones table**

```sql
-- DMT Milestones: tracks baseline and milestone progress per user per level
CREATE TABLE IF NOT EXISTS public.dmt_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  avi_level TEXT NOT NULL,
  baseline FLOAT NOT NULL,
  current_milestone INT DEFAULT 0 CHECK (current_milestone >= 0 AND current_milestone <= 4),
  best_score FLOAT DEFAULT 0,
  snowboard_position FLOAT DEFAULT 0 CHECK (snowboard_position >= 0 AND snowboard_position <= 1),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, avi_level)
);

ALTER TABLE public.dmt_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dmt milestones"
  ON public.dmt_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dmt milestones"
  ON public.dmt_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dmt milestones"
  ON public.dmt_milestones FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dmt_milestones_user
  ON public.dmt_milestones(user_id);
```

**Step 3: Append to supabase_schema.sql**

Add both CREATE TABLE blocks (from steps 1-2) to the end of `supabase_schema.sql` with a section header:

```sql
-- ============================================
-- 6. DMT SESSIONS & MILESTONES
-- Snelheidslezen oefening en toets tracking
-- ============================================
```

**Step 4: Commit**

```bash
git add supabase_schema.sql
git commit -m "feat(dmt): add dmt_sessions and dmt_milestones tables"
```

---

## Task 2: Word Selection Logic (Agent 1)

**Files:**
- Create: `frontend/src/components/Games/DMT/dmtWords.js`

**Context needed:**
- Word database loader: `frontend/src/data/words/index.js`
- Exports: `loadAviWords(level)`, `getRandomWords(count, level, options)`, `getPreviousLevel(level)`, `getNextLevel(level)`
- Word shape: `{ word, syllables, syllableCount, stressIndex?, image, category }`

**Step 1: Create dmtWords.js**

```javascript
/**
 * DMT WORD SELECTION
 * Selecteert woorden voor DMT oefenmodus en toetskaarten.
 *
 * Oefenmodus: willekeurige woorden uit gekozen AVI-niveau
 * Toetsmodus: 3 kaarten met oplopende moeilijkheid
 *   Kaart 1: 1 lettergreep (makkelijk)
 *   Kaart 2: 2 lettergrepen (medium)
 *   Kaart 3: 3+ lettergrepen (moeilijk)
 */

import { loadAviWords, getPreviousLevel, getNextLevel } from '../../../data/words/index'

const WORDS_PER_CARD = 150
const COLUMNS_PER_CARD = 5

/**
 * Haal woorden op voor oefenmodus
 * @param {string} aviLevel - AVI niveau ('start', 'm3', 'e3', 'm4', 'e4', 'm5-e5')
 * @param {number} count - Aantal woorden (25, 50, of 100)
 * @returns {Array} Geschudde array van woorden
 */
export const getWordsForPractice = (aviLevel, count = 50) => {
  const words = loadAviWords(aviLevel)
  if (!words || words.length === 0) return []

  // Schud en neem het gevraagde aantal (herhaal als nodig)
  const shuffled = [...words].sort(() => Math.random() - 0.5)

  if (shuffled.length >= count) {
    return shuffled.slice(0, count)
  }

  // Niet genoeg woorden: herhaal de pool
  const result = []
  while (result.length < count) {
    const batch = [...words].sort(() => Math.random() - 0.5)
    result.push(...batch)
  }
  return result.slice(0, count)
}

/**
 * Haal woorden op voor de 3 DMT-toetskaarten
 * Kaart 1: 1 lettergreep (makkelijk)
 * Kaart 2: 2 lettergrepen (medium)
 * Kaart 3: 3+ lettergrepen (moeilijk)
 *
 * Woorden komen uit het gekozen AVI-niveau + aangrenzende niveaus
 * om voldoende woorden per moeilijkheidsgraad te hebben.
 *
 * @param {string} aviLevel - Gekozen AVI niveau
 * @returns {{ card1: Array, card2: Array, card3: Array }}
 */
export const getWordsForTest = (aviLevel) => {
  // Verzamel woorden uit huidig + aangrenzende niveaus
  const allWords = collectWordsForLevel(aviLevel)

  // Verdeel op basis van lettergrepen
  const oneSyllable = allWords.filter(w => w.syllableCount === 1)
  const twoSyllable = allWords.filter(w => w.syllableCount === 2)
  const threePlus = allWords.filter(w => w.syllableCount >= 3)

  return {
    card1: fillCard(oneSyllable, WORDS_PER_CARD),
    card2: fillCard(twoSyllable, WORDS_PER_CARD),
    card3: fillCard(threePlus, WORDS_PER_CARD)
  }
}

/**
 * Verzamel woorden uit het gekozen niveau + aangrenzende niveaus
 * zodat er voldoende woorden zijn voor alle kaarten
 */
const collectWordsForLevel = (aviLevel) => {
  const words = new Map()

  // Huidig niveau
  addWordsToMap(words, loadAviWords(aviLevel))

  // Vorig niveau (voor makkelijke woorden)
  const prevLevel = getPreviousLevel(aviLevel)
  if (prevLevel) {
    addWordsToMap(words, loadAviWords(prevLevel))
  }

  // Volgend niveau (voor moeilijke woorden)
  const nextLevel = getNextLevel(aviLevel)
  if (nextLevel) {
    addWordsToMap(words, loadAviWords(nextLevel))
  }

  return Array.from(words.values())
}

const addWordsToMap = (map, words) => {
  if (!words) return
  words.forEach(w => {
    if (!map.has(w.word)) {
      map.set(w.word, w)
    }
  })
}

/**
 * Vul een kaart met het gewenste aantal woorden
 * Herhaalt woorden als er niet genoeg zijn
 */
const fillCard = (words, count) => {
  if (words.length === 0) return []

  const shuffled = [...words].sort(() => Math.random() - 0.5)

  if (shuffled.length >= count) {
    return shuffled.slice(0, count)
  }

  // Herhaal pool tot we genoeg hebben
  const result = []
  while (result.length < count) {
    const batch = [...words].sort(() => Math.random() - 0.5)
    result.push(...batch)
  }
  return result.slice(0, count)
}

/**
 * Bereken woorden per minuut
 */
export const calculateWPM = (wordsRead, timeMs) => {
  if (timeMs <= 0) return 0
  const minutes = timeMs / 60000
  return Math.round((wordsRead / minutes) * 10) / 10
}

/**
 * Constanten
 */
export const DMT_CONSTANTS = {
  WORDS_PER_CARD,
  COLUMNS_PER_CARD,
  ROWS_PER_CARD: WORDS_PER_CARD / COLUMNS_PER_CARD, // 30
  CARD_TIME_MS: 60000,     // 1 minuut per kaart
  PRACTICE_WORD_COUNTS: [25, 50, 100],
  PRACTICE_TIME_LIMITS: [60, 120, 180], // seconden
  MILESTONE_THRESHOLDS: [0.10, 0.20, 0.30, 0.40], // +10%, +20%, +30%, +40%
  STARS_PRACTICE: 5,
  STARS_TEST: 10,
  STARS_RECORD: 5,
  STARS_MILESTONE: 25
}

export default {
  getWordsForPractice,
  getWordsForTest,
  calculateWPM,
  DMT_CONSTANTS
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Games/DMT/dmtWords.js
git commit -m "feat(dmt): add word selection logic for practice and test modes"
```

---

## Task 3: useDMT Hook - Data Layer (Agent 1)

**Files:**
- Create: `frontend/src/hooks/useDMT.js`

**Context needed:**
- Supabase client: `frontend/src/supabaseClient.js` → `import { supabase } from '../supabaseClient'`
- Auth hook: `frontend/src/hooks/useAuth.jsx` → `const { user, isDemoMode } = useAuth()`
- Pattern: follow `useProgress.js` for Supabase + localStorage fallback
- localStorage helper: `frontend/src/utils/storageSync.js` → `saveToLocalStorage`, `loadFromLocalStorage` (but we use our own keys)
- DMT constants: `DMT_CONSTANTS` from `dmtWords.js`

**Step 1: Create useDMT.js**

```javascript
/**
 * useDMT HOOK
 * Beheert DMT sessies, mijlpalen en voortgang.
 * Supabase als primaire opslag, localStorage als fallback.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './useAuth'
import { DMT_CONSTANTS } from '../components/Games/DMT/dmtWords'

const LOCAL_SESSIONS_KEY = 'galactische_dmt_sessions'
const LOCAL_MILESTONES_KEY = 'galactische_dmt_milestones'

// localStorage helpers
const loadLocal = (key, fallback) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : fallback
  } catch { return fallback }
}

const saveLocal = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('localStorage save failed:', e)
  }
}

export const useDMT = () => {
  const { user, isDemoMode } = useAuth()
  const [sessions, setSessions] = useState([])
  const [milestones, setMilestones] = useState({})
  const [loading, setLoading] = useState(true)

  // Laad data bij mount
  useEffect(() => {
    if (isDemoMode || !user) {
      // Demo/offline: alleen localStorage
      setSessions(loadLocal(LOCAL_SESSIONS_KEY, []))
      setMilestones(loadLocal(LOCAL_MILESTONES_KEY, {}))
      setLoading(false)
      return
    }
    loadFromSupabase()
  }, [user, isDemoMode])

  const loadFromSupabase = async () => {
    setLoading(true)
    try {
      // Laad sessies
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('dmt_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (sessionsError) throw sessionsError

      // Laad milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('dmt_milestones')
        .select('*')
        .eq('user_id', user.id)

      if (milestonesError) throw milestonesError

      // Map milestones naar object per avi_level
      const milestonesMap = {}
      milestonesData?.forEach(m => {
        milestonesMap[m.avi_level] = {
          baseline: m.baseline,
          currentMilestone: m.current_milestone,
          bestScore: m.best_score,
          snowboardPosition: m.snowboard_position
        }
      })

      const formattedSessions = (sessionsData || []).map(s => ({
        id: s.id,
        mode: s.mode,
        aviLevel: s.avi_level,
        settings: s.settings,
        results: s.results,
        isBaseline: s.is_baseline,
        createdAt: s.created_at
      }))

      setSessions(formattedSessions)
      setMilestones(milestonesMap)

      // Sync naar localStorage als backup
      saveLocal(LOCAL_SESSIONS_KEY, formattedSessions)
      saveLocal(LOCAL_MILESTONES_KEY, milestonesMap)
    } catch (e) {
      console.error('Failed to load DMT data:', e)
      // Fallback naar localStorage
      setSessions(loadLocal(LOCAL_SESSIONS_KEY, []))
      setMilestones(loadLocal(LOCAL_MILESTONES_KEY, {}))
    }
    setLoading(false)
  }

  /**
   * Sla een nieuwe sessie op
   * @returns {{ milestoneReached: boolean, newMilestone: number, isNewRecord: boolean }}
   */
  const saveSession = useCallback(async (sessionData) => {
    const { mode, aviLevel, settings, results } = sessionData
    const wpm = results.wordsPerMinute

    // Check of dit de eerste sessie is voor dit niveau (baseline)
    const existingForLevel = sessions.filter(s => s.aviLevel === aviLevel && s.mode === mode)
    const isBaseline = existingForLevel.length === 0

    const newSession = {
      id: crypto.randomUUID(),
      mode,
      aviLevel,
      settings,
      results,
      isBaseline,
      createdAt: new Date().toISOString()
    }

    // Update state
    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    saveLocal(LOCAL_SESSIONS_KEY, updatedSessions)

    // Milestone logica
    let milestoneResult = { milestoneReached: false, newMilestone: 0, isNewRecord: false }

    if (isBaseline) {
      // Eerste sessie: stel baseline in
      const newMilestone = {
        baseline: wpm,
        currentMilestone: 0,
        bestScore: wpm,
        snowboardPosition: 0
      }
      const updatedMilestones = { ...milestones, [aviLevel]: newMilestone }
      setMilestones(updatedMilestones)
      saveLocal(LOCAL_MILESTONES_KEY, updatedMilestones)

      // Sync naar Supabase
      if (user && !isDemoMode) {
        await saveMilestoneToSupabase(aviLevel, newMilestone)
      }
    } else {
      // Niet baseline: check milestone voortgang
      const current = milestones[aviLevel]
      if (current) {
        milestoneResult = checkAndUpdateMilestone(aviLevel, wpm, current)
      }
    }

    // Sync sessie naar Supabase
    if (user && !isDemoMode) {
      try {
        await supabase.from('dmt_sessions').insert({
          user_id: user.id,
          mode,
          avi_level: aviLevel,
          settings,
          results,
          is_baseline: isBaseline
        })
      } catch (e) {
        console.error('Failed to save DMT session to Supabase:', e)
      }
    }

    return milestoneResult
  }, [sessions, milestones, user, isDemoMode])

  /**
   * Check en update mijlpalen
   */
  const checkAndUpdateMilestone = useCallback((aviLevel, wpm, current) => {
    const { baseline, currentMilestone, bestScore } = current
    const isNewRecord = wpm > bestScore
    const improvement = (wpm - baseline) / baseline

    // Welke mijlpaal is bereikt?
    let newMilestoneLevel = currentMilestone
    DMT_CONSTANTS.MILESTONE_THRESHOLDS.forEach((threshold, index) => {
      if (improvement >= threshold && index + 1 > currentMilestone) {
        newMilestoneLevel = index + 1
      }
    })

    const milestoneReached = newMilestoneLevel > currentMilestone

    // Bereken snowboard positie (0-1)
    // Positie = voortgang richting volgende mijlpaal
    let snowboardPosition
    if (newMilestoneLevel >= 4) {
      snowboardPosition = 1 // Bovenaan!
    } else {
      const nextThreshold = DMT_CONSTANTS.MILESTONE_THRESHOLDS[newMilestoneLevel] || 0.40
      const prevThreshold = newMilestoneLevel > 0
        ? DMT_CONSTANTS.MILESTONE_THRESHOLDS[newMilestoneLevel - 1]
        : 0
      const progressInSegment = (improvement - prevThreshold) / (nextThreshold - prevThreshold)
      const segmentSize = 1 / 4 // 4 mijlpalen
      snowboardPosition = Math.min(1, (newMilestoneLevel * segmentSize) + (Math.max(0, progressInSegment) * segmentSize))
    }

    const updated = {
      baseline, // baseline blijft hetzelfde
      currentMilestone: newMilestoneLevel,
      bestScore: Math.max(bestScore, wpm),
      snowboardPosition
    }

    const updatedMilestones = { ...milestones, [aviLevel]: updated }
    setMilestones(updatedMilestones)
    saveLocal(LOCAL_MILESTONES_KEY, updatedMilestones)

    // Sync naar Supabase
    if (user && !isDemoMode) {
      saveMilestoneToSupabase(aviLevel, updated)
    }

    return {
      milestoneReached,
      newMilestone: newMilestoneLevel,
      isNewRecord,
      snowboardPosition
    }
  }, [milestones, user, isDemoMode])

  const saveMilestoneToSupabase = async (aviLevel, milestone) => {
    try {
      await supabase.from('dmt_milestones').upsert({
        user_id: user.id,
        avi_level: aviLevel,
        baseline: milestone.baseline,
        current_milestone: milestone.currentMilestone,
        best_score: milestone.bestScore,
        snowboard_position: milestone.snowboardPosition,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,avi_level'
      })
    } catch (e) {
      console.error('Failed to save DMT milestone to Supabase:', e)
    }
  }

  /**
   * Haal baseline op voor een AVI-niveau
   */
  const getBaseline = useCallback((aviLevel) => {
    return milestones[aviLevel]?.baseline || null
  }, [milestones])

  /**
   * Haal sessies op voor een specifiek niveau en modus
   */
  const getSessionsForLevel = useCallback((aviLevel, mode = null) => {
    return sessions.filter(s =>
      s.aviLevel === aviLevel && (mode === null || s.mode === mode)
    )
  }, [sessions])

  /**
   * Haal de milestone data op voor een niveau
   */
  const getMilestone = useCallback((aviLevel) => {
    return milestones[aviLevel] || null
  }, [milestones])

  /**
   * Reset baseline voor een niveau (na halfpipe = nieuwe berg)
   */
  const resetBaseline = useCallback(async (aviLevel, newBaseline) => {
    const updated = {
      baseline: newBaseline,
      currentMilestone: 0,
      bestScore: newBaseline,
      snowboardPosition: 0
    }

    const updatedMilestones = { ...milestones, [aviLevel]: updated }
    setMilestones(updatedMilestones)
    saveLocal(LOCAL_MILESTONES_KEY, updatedMilestones)

    if (user && !isDemoMode) {
      await saveMilestoneToSupabase(aviLevel, updated)
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

export default useDMT
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useDMT.js
git commit -m "feat(dmt): add useDMT hook for session and milestone management"
```

---

## Task 4: Snowboard Scene SVG (Agent 2)

**Files:**
- Create: `frontend/src/components/Games/DMT/SnowboardScene.jsx`

**Context needed:**
- This is a standalone visual component. No dependencies on other DMT files.
- Existing app uses Tailwind CSS for styling
- SVG animations use CSS @keyframes (see TrollGame for pattern)
- Props: `position` (0-1), `playHalfpipe` (boolean), `onHalfpipeComplete` (callback)

**Step 1: Create SnowboardScene.jsx**

Build an SVG scene with:

1. **Mountain background** - triangular mountain shape with snow caps, gradient sky (light blue to white)
2. **Ski lift** - cable line from bottom-left to top-right, small chair lift boxes along the cable
3. **Snowboarder figure** - simple figure sitting on the lift, position controlled by `position` prop (0 = bottom, 1 = top)
4. **Halfpipe** - U-shaped half-pipe at the top of the mountain, only visible when `playHalfpipe` is true
5. **Halfpipe animation** - when `playHalfpipe`:
   - Snowboarder detaches from lift
   - Slides down into halfpipe
   - Does tricks (360 spin, flip) via CSS keyframe animations
   - Snow particles / confetti burst
   - Calls `onHalfpipeComplete()` after ~4 seconds
6. **Snow particles** - gentle falling snowflakes in the background (CSS animation, always visible)

Dimensions: responsive, max 400px height. Use viewBox for scaling.

Color palette:
- Sky: `#87CEEB` to `#E0F2FE`
- Mountain: `#E2E8F0` (light gray) with white snow caps
- Ski lift cable: `#64748B` (dark gray)
- Snowboarder: bright colors (red jacket `#EF4444`, blue pants `#3B82F6`)
- Halfpipe: `#CBD5E1` (gray)
- Snow: white particles

CSS animations to include (in a `<style>` block inside the SVG or via Tailwind):
- `@keyframes snowfall` - gentle falling for snowflakes
- `@keyframes liftMove` - ski lift chairs moving along cable
- `@keyframes boarderSpin` - 360 spin trick
- `@keyframes boarderFlip` - backflip trick
- `@keyframes confettiBurst` - confetti particles exploding outward

```jsx
import { useState, useEffect } from 'react'

/**
 * SnowboardScene - SVG snowboard animatie met skilift en halfpipe
 * @param {number} position - 0-1, positie van snowboarder op de berg (0=onder, 1=top)
 * @param {boolean} playHalfpipe - trigger halfpipe animatie
 * @param {function} onHalfpipeComplete - callback na halfpipe animatie
 * @param {boolean} compact - kleiner formaat voor inline gebruik
 */
export const SnowboardScene = ({ position = 0, playHalfpipe = false, onHalfpipeComplete, compact = false }) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (playHalfpipe && !isAnimating) {
      setIsAnimating(true)
      setShowConfetti(true)

      // Halfpipe animatie duurt 4 seconden
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(() => {
          setShowConfetti(false)
          onHalfpipeComplete?.()
        }, 500)
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [playHalfpipe])

  // Bereken snowboarder positie langs de skilift lijn
  // Lift gaat van (50, 280) linksonder naar (350, 60) rechtsboven
  const boarderX = 50 + position * 300
  const boarderY = 280 - position * 220

  const height = compact ? 200 : 300

  return (
    <div className={`relative w-full ${compact ? 'max-w-xs' : 'max-w-md'} mx-auto`}>
      <svg
        viewBox="0 0 400 320"
        className="w-full"
        style={{ height }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Lucht gradient */}
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>
          {/* Berg gradient */}
          <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
          {/* Sneeuw op de berg */}
          <linearGradient id="snowCap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes snowfall {
            0% { transform: translateY(-20px); opacity: 0.8; }
            100% { transform: translateY(340px); opacity: 0; }
          }
          @keyframes halfpipeRide {
            0% { transform: translate(0, 0); }
            15% { transform: translate(-30px, 40px); }
            30% { transform: translate(0, 80px) rotate(360deg); }
            50% { transform: translate(30px, 40px) rotate(720deg); }
            65% { transform: translate(0, 80px) rotate(1080deg); }
            80% { transform: translate(-20px, 30px) scaleY(-1); }
            100% { transform: translate(0, 0) rotate(1440deg); }
          }
          @keyframes confetti {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
          }
          .snowflake {
            animation: snowfall linear infinite;
          }
          .halfpipe-rider {
            animation: halfpipeRide 4s ease-in-out forwards;
          }
          .confetti-particle {
            animation: confetti 1.5s ease-out forwards;
          }
        `}</style>

        {/* Lucht */}
        <rect width="400" height="320" fill="url(#skyGradient)" />

        {/* Sneeuwvlokken achtergrond */}
        {[...Array(12)].map((_, i) => (
          <circle
            key={`snow-${i}`}
            cx={30 + (i * 33) % 380}
            cy={10 + (i * 47) % 300}
            r={1.5 + (i % 3)}
            fill="white"
            opacity={0.6}
            className="snowflake"
            style={{ animationDuration: `${3 + (i % 4)}s`, animationDelay: `${i * 0.5}s` }}
          />
        ))}

        {/* Berg achtergrond */}
        <polygon points="0,320 100,100 200,320" fill="url(#mountainGradient)" opacity="0.5" />
        <polygon points="150,320 280,50 400,320" fill="url(#mountainGradient)" />

        {/* Sneeuwtoppen */}
        <polygon points="240,50 280,50 310,100 250,100" fill="url(#snowCap)" />
        <polygon points="70,100 100,100 120,140 50,140" fill="url(#snowCap)" opacity="0.5" />

        {/* Halfpipe bovenaan (altijd zichtbaar maar subtiel) */}
        <path
          d="M 300,70 Q 310,110 340,70"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="3"
          opacity={position > 0.7 ? 1 : 0.3}
        />
        <path
          d="M 298,70 Q 310,115 342,70"
          fill="none"
          stroke="#CBD5E1"
          strokeWidth="6"
          opacity={position > 0.7 ? 0.5 : 0.15}
        />

        {/* Skilift kabel */}
        <line x1="40" y1="290" x2="360" y2="55" stroke="#475569" strokeWidth="2" />

        {/* Skilift stoeltjes (decoratief) */}
        {[0.15, 0.35, 0.55, 0.75].map((p, i) => {
          const cx = 40 + p * 320
          const cy = 290 - p * 235
          return (
            <g key={`chair-${i}`} opacity={0.4}>
              <line x1={cx} y1={cy} x2={cx} y2={cy + 12} stroke="#475569" strokeWidth="1.5" />
              <rect x={cx - 6} y={cy + 12} width="12" height="6" rx="1" fill="#475569" />
            </g>
          )
        })}

        {/* Snowboarder */}
        {!isAnimating ? (
          <g transform={`translate(${boarderX}, ${boarderY})`}>
            {/* Lifthaak */}
            <line x1="0" y1="-4" x2="0" y2={-12} stroke="#475569" strokeWidth="1.5" />
            {/* Lichaam */}
            <circle cx="0" cy="0" r="6" fill="#EF4444" /> {/* Rode jas */}
            <circle cx="0" cy="-8" r="4" fill="#FDE68A" /> {/* Hoofd */}
            {/* Benen */}
            <line x1="-3" y1="6" x2="-5" y2="14" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="3" y1="6" x2="5" y2="14" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            {/* Snowboard */}
            <rect x="-8" y="14" width="16" height="3" rx="1.5" fill="#1E293B" />
          </g>
        ) : (
          /* Halfpipe animatie */
          <g transform={`translate(320, 70)`} className="halfpipe-rider">
            <circle cx="0" cy="0" r="6" fill="#EF4444" />
            <circle cx="0" cy="-8" r="4" fill="#FDE68A" />
            <rect x="-8" y="6" width="16" height="3" rx="1.5" fill="#1E293B" />
          </g>
        )}

        {/* Confetti bij halfpipe */}
        {showConfetti && [...Array(20)].map((_, i) => {
          const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
          const angle = (i / 20) * Math.PI * 2
          const distance = 40 + Math.random() * 60
          return (
            <circle
              key={`conf-${i}`}
              cx="320"
              cy="70"
              r={2 + Math.random() * 2}
              fill={colors[i % colors.length]}
              className="confetti-particle"
              style={{
                '--dx': `${Math.cos(angle) * distance}px`,
                '--dy': `${Math.sin(angle) * distance - 30}px`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            />
          )
        })}

        {/* Mijlpaal markers langs de lift */}
        {[0.25, 0.50, 0.75, 1.0].map((p, i) => {
          const mx = 40 + p * 320
          const my = 290 - p * 235
          const reached = position >= p
          return (
            <g key={`milestone-${i}`} transform={`translate(${mx + 15}, ${my})`}>
              <circle r="8" fill={reached ? '#10B981' : '#E2E8F0'} stroke={reached ? '#059669' : '#CBD5E1'} strokeWidth="1.5" />
              <text textAnchor="middle" dy="4" fontSize="8" fill={reached ? 'white' : '#94A3B8'} fontWeight="bold">
                {i + 1}
              </text>
            </g>
          )
        })}

        {/* Berg label */}
        {!compact && (
          <text x="350" y="45" fontSize="10" fill="#64748B" textAnchor="end" fontWeight="bold">
            {position >= 1 ? 'TOP!' : `${Math.round(position * 100)}%`}
          </text>
        )}
      </svg>
    </div>
  )
}

export default SnowboardScene
```

**Step 2: Commit**

```bash
git add frontend/src/components/Games/DMT/SnowboardScene.jsx
git commit -m "feat(dmt): add SnowboardScene SVG with ski lift and halfpipe animations"
```

---

## Task 5: Practice Mode Component (Agent 3)

**Files:**
- Create: `frontend/src/components/Games/DMT/DMTPractice.jsx`

**Context needed:**
- Word data: `import { getWordsForPractice, calculateWPM, DMT_CONSTANTS } from './dmtWords'`
- Spaced repetition: `import { recordAttempt } from '../../../services/spacedRepetition'`
- Auth: `import { useAuth } from '../../../hooks/useAuth'`
- Icons: `import { ArrowLeft, Volume2, Info } from '../../shared/Icons'` (see `frontend/src/components/shared/Icons.jsx`)
- Game pattern: intro screen → game → onComplete callback
- Standard props: `speak`, `onBack`, `onComplete(results)` where results = `{ totalWords, totalTimeMs, wordsPerMinute, wordTimes }`
- Additional props: `aviLevel` (string), `settings` (object with `wordCount` and/or `timeLimit`)

**Step 1: Create DMTPractice.jsx**

Build the practice mode with:

1. **Intro screen** (showIntro state):
   - Snowboard emoji + "Vrije Run" title
   - Brief explanation: "Lees elk woord hardop en druk op Volgende. Probeer steeds sneller te worden!"
   - "Start!" button

2. **Game screen**:
   - Large word display (text-5xl, centered) on a white card with slide animation
   - "Volgende →" button (large, touch-friendly, at bottom)
   - Timer display top-right (format: MM:SS)
   - Word counter top-left ("12 / 50")
   - Progress bar under the header
   - Light blue gradient background with subtle snow theme
   - Each word transition: current card slides left, new card slides in from right (CSS transition)
   - Track `wordTimes[]` array: push `{ word, timeMs }` per word

3. **End condition**:
   - Word mode: all words shown
   - Time mode: timer reaches limit
   - Call `onComplete(results)` with calculated WPM and word times

4. **Spaced repetition**: After each word, call `recordAttempt(userId, word, true, 'dmt_practice', timeForWord)`. Consider words taking >3000ms as "slow" (`correct: false`).

Styling:
- Background: `bg-gradient-to-b from-sky-100 to-blue-50`
- Word card: `bg-white rounded-3xl shadow-xl p-8`
- Next button: `bg-sky-500 hover:bg-sky-600 text-white text-xl font-bold py-4 px-12 rounded-2xl`
- Timer: `text-lg font-mono` (changes to orange at <15s, red at <5s in time mode)

**Step 2: Commit**

```bash
git add frontend/src/components/Games/DMT/DMTPractice.jsx
git commit -m "feat(dmt): add practice mode with word-by-word speed reading"
```

---

## Task 6: Test Mode Component (Agent 4)

**Files:**
- Create: `frontend/src/components/Games/DMT/DMTTest.jsx`

**Context needed:**
- Word data: `import { getWordsForTest, DMT_CONSTANTS } from './dmtWords'`
- Auth: `import { useAuth } from '../../../hooks/useAuth'`
- Icons: `import { ArrowLeft, Info } from '../../shared/Icons'`
- Standard props: `speak`, `onBack`, `onComplete(results)` where results = `{ totalWords, totalTimeMs, wordsPerMinute, cards }`
- Additional props: `aviLevel` (string), `withParent` (boolean)

**Step 1: Create DMTTest.jsx**

Build the test mode with:

1. **Intro screen** (showIntro state):
   - Stopwatch emoji + "DMT Toets" title
   - Explanation: which mode (with/without parent)
   - "Start Kaart 1" button

2. **Card screen** (the core DMT experience):
   - **Header**: Card number ("Kaart 1 van 3"), countdown timer (60s, large font-mono)
   - **Word grid**: 5 columns, ~30 rows per column
     - CSS grid: `grid grid-cols-5 gap-x-4 gap-y-1`
     - Words in order: column 1 top-bottom, then column 2, etc.
     - Each word: `text-sm md:text-base font-medium cursor-pointer`
   - **Without parent mode**: tap word = mark as read (turns green `text-emerald-600 bg-emerald-50`)
     - Words must be tapped in order (left-to-right, top-to-bottom)
     - Next unread word has subtle highlight
   - **With parent mode**:
     - All words visible, no tap needed
     - Bottom bar: red "Fout" button (marks last word as error), "Stop" button
     - Parent enters total words read at end
   - **Timer**: counts down from 60, visual warning at 15s (orange) and 5s (red + pulse)
   - **Auto-stop**: when timer hits 0, card ends

3. **Between cards** (rest screen):
   - "Kaart 1: X woorden gelezen"
   - "Klaar voor Kaart 2?"
   - "Start" button

4. **After card 3**: Call `onComplete(results)` with per-card scores

Styling:
- Background: `bg-white` (clean, test-like, not distracting)
- Timer: `text-3xl font-mono font-bold`
- Word grid: `font-serif text-gray-900` (readable for children)
- Read word: `text-emerald-600 bg-emerald-50 rounded`
- Current word: `ring-2 ring-sky-400 bg-sky-50 rounded`

**Step 2: Commit**

```bash
git add frontend/src/components/Games/DMT/DMTTest.jsx
git commit -m "feat(dmt): add test mode with real DMT card layout"
```

---

## Task 7: DMT Menu (Agent 5)

**Files:**
- Create: `frontend/src/components/Games/DMT/DMTMenu.jsx`

**Context needed:**
- Hook: `import { useDMT } from '../../../hooks/useDMT'`
- Snowboard: `import { SnowboardScene } from './SnowboardScene'`
- Icons: `import { ArrowLeft } from '../../shared/Icons'`
- Word levels from: `frontend/src/data/words/index.js` → `AVI_LEVELS`, `getLevelInfo`
- Props: `speak`, `onBack`, `onStartPractice(aviLevel, settings)`, `onStartTest(aviLevel, withParent)`

**Step 1: Create DMTMenu.jsx**

Build the menu with:

1. **Header**: Back button + "Snowboard Sprint" title + snowboard emoji
2. **Snowboard scene** (compact mode): shows current mountain position
3. **AVI Level selector**: row of buttons for each level
   - Labels: "Start", "M3", "E3", "M4", "E4", "M5+"
   - Selected level has ring highlight
4. **Mode cards** (2 large cards side by side):
   - **Oefenen card**: Ski lift icon, "Vrije Run" title
     - Sub-options: word count (25/50/100) OR time limit (1/2/3 min)
     - Toggle between word/time mode
     - "Start" button
   - **DMT Toets card**: Stopwatch icon, "DMT Kaart" title
     - Toggle: "Zonder ouder" / "Met ouder"
     - "Start Toets" button
5. **Stats section**:
   - Current baseline WPM (if exists)
   - Milestone progress: "Mijlpaal 2/4"
   - Best score

Styling:
- Background: `bg-gradient-to-b from-sky-400 to-blue-600` (like other game menus)
- Cards: `bg-white rounded-3xl shadow-xl p-6`
- Level buttons: pill shape, white bg, sky-500 selected

**Step 2: Commit**

```bash
git add frontend/src/components/Games/DMT/DMTMenu.jsx
git commit -m "feat(dmt): add DMT menu with mode selection and level picker"
```

---

## Task 8: Results Screen & Integration (Agent 5)

**Files:**
- Create: `frontend/src/components/Games/DMT/DMTResults.jsx`
- Create: `frontend/src/components/Games/DMT/index.js` (barrel export)
- Modify: `frontend/src/components/Dashboard.jsx` (add DMT card to games array, line 4-53)
- Modify: `frontend/src/App.jsx` (add DMT import + currentView handling, lines 18-26 and 219-297)

**Step 1: Create DMTResults.jsx**

Build the results screen with:

1. **Score summary**:
   - Large WPM number (animated count-up)
   - "woorden per minuut" label
   - Mode label: "Oefenmodus" or "DMT Toets"
   - Per-card breakdown (test mode): "Kaart 1: 42 | Kaart 2: 35 | Kaart 3: 28"

2. **Comparison section**:
   - If baseline exists: "Vorige keer: X w/m" with delta (+5 sneller!)
   - New record indicator: star burst animation

3. **Progress chart** (simple bar chart, no library needed):
   - Last 10 sessions as vertical bars
   - Current session highlighted
   - Baseline shown as horizontal dashed line
   - X-axis: dates, Y-axis: WPM

4. **Milestone progress**:
   - Progress bar showing position toward next milestone
   - "Nog X woorden sneller voor de volgende truc!"
   - If milestone reached: SnowboardScene with `playHalfpipe={true}`

5. **Snowboard scene** (normal size): shows current position

6. **Action buttons**:
   - "Opnieuw" (return to menu)
   - "Terug naar Dashboard" (onBack)

7. **Stars earned**: display stars animation

**Step 2: Create index.js barrel export**

```javascript
export { DMTMenu } from './DMTMenu'
export { DMTPractice } from './DMTPractice'
export { DMTTest } from './DMTTest'
export { DMTResults } from './DMTResults'
export { SnowboardScene } from './SnowboardScene'
```

**Step 3: Add DMT card to Dashboard.jsx**

In the `games` array (line 4), add after the `rewards` entry:

```javascript
{
  id: 'dmt',
  title: 'Snowboard Sprint',
  desc: 'Oefen je leessnelheid',
  icon: '🏂',
  color: 'from-sky-400 to-blue-600',
  shadow: 'shadow-sky-200'
}
```

**Step 4: Add DMT routing to App.jsx**

Add import at top (after line 21):
```javascript
import { DMTMenu, DMTPractice, DMTTest, DMTResults } from './components/Games/DMT'
```

Add DMT hook usage inside App function (after line 134):
```javascript
const [dmtState, setDmtState] = useState({ view: 'menu', aviLevel: 'e3', settings: {}, withParent: false, results: null })
```

Add DMT view handling in the JSX (after the `rewards` section, around line 265):
```jsx
{currentView === 'dmt' && dmtState.view === 'menu' && (
  <DMTMenu
    {...gameProps}
    onStartPractice={(aviLevel, settings) => {
      setDmtState({ view: 'practice', aviLevel, settings, withParent: false, results: null })
    }}
    onStartTest={(aviLevel, withParent) => {
      setDmtState({ view: 'test', aviLevel, settings: {}, withParent, results: null })
    }}
  />
)}

{currentView === 'dmt' && dmtState.view === 'practice' && (
  <DMTPractice
    {...gameProps}
    aviLevel={dmtState.aviLevel}
    settings={dmtState.settings}
    onComplete={(results) => {
      setDmtState(prev => ({ ...prev, view: 'results', results }))
    }}
    onBack={() => setDmtState(prev => ({ ...prev, view: 'menu' }))}
  />
)}

{currentView === 'dmt' && dmtState.view === 'test' && (
  <DMTTest
    {...gameProps}
    aviLevel={dmtState.aviLevel}
    withParent={dmtState.withParent}
    onComplete={(results) => {
      setDmtState(prev => ({ ...prev, view: 'results', results }))
    }}
    onBack={() => setDmtState(prev => ({ ...prev, view: 'menu' }))}
  />
)}

{currentView === 'dmt' && dmtState.view === 'results' && (
  <DMTResults
    {...gameProps}
    aviLevel={dmtState.aviLevel}
    mode={dmtState.results?.cards ? 'test' : 'practice'}
    results={dmtState.results}
    onPlayAgain={() => setDmtState(prev => ({ ...prev, view: 'menu' }))}
  />
)}
```

**Step 5: Commit**

```bash
git add frontend/src/components/Games/DMT/DMTResults.jsx frontend/src/components/Games/DMT/index.js frontend/src/components/Dashboard.jsx frontend/src/App.jsx
git commit -m "feat(dmt): add results screen and integrate DMT into dashboard and routing"
```

---

## Task 9: Final Integration & Review (Coordinator)

**Files:** All DMT files + Dashboard.jsx + App.jsx

**Step 1: Verify all imports resolve**

Check that all import paths are correct across all DMT files. Common issues:
- Relative paths from `components/Games/DMT/` to `hooks/`, `services/`, `data/`
- Barrel export in `index.js` matches actual component exports

**Step 2: Smoke test**

Run the dev server:
```bash
cd frontend && npm run dev
```

Verify:
- [ ] Dashboard shows "Snowboard Sprint" card with 🏂 icon
- [ ] Clicking card opens DMT menu
- [ ] AVI level can be selected
- [ ] Practice mode: words appear, next button works, timer runs, results show
- [ ] Test mode: grid layout shows, tapping words marks them, timer counts down
- [ ] Results screen: WPM shown, chart renders, snowboard scene visible
- [ ] Back navigation works at every level
- [ ] No console errors

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat(dmt): complete DMT Snowboard Sprint game with practice and test modes"
```

---

## Quick Reference: File Dependency Graph

```
dmtWords.js          ← no deps (only imports from data/words/index.js)
useDMT.js            ← supabaseClient, useAuth, dmtWords (DMT_CONSTANTS)
SnowboardScene.jsx   ← no deps (standalone SVG)
DMTPractice.jsx      ← dmtWords, spacedRepetition, useAuth, Icons
DMTTest.jsx          ← dmtWords, useAuth, Icons
DMTMenu.jsx          ← useDMT, SnowboardScene, data/words/index.js, Icons
DMTResults.jsx       ← useDMT, SnowboardScene, Icons
index.js             ← barrel re-exports all above
Dashboard.jsx        ← add card entry (no new imports)
App.jsx              ← import from DMT/index.js, add routing
```
