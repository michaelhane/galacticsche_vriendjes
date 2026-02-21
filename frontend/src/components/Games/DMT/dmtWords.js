/**
 * DMT WOORDEN SELECTIE
 * Levert woorden voor practice en test modus van het DMT Snowboard Sprint spel.
 *
 * Practice: slimme selectie op basis van leestijd (spaced repetition).
 * Test: 3 kaarten (easy/medium/hard) op basis van lettergreep-telling.
 *   - Kaart 1: 1 lettergreep
 *   - Kaart 2: 2 lettergrepen
 *   - Kaart 3: 3+ lettergrepen
 *
 * Elke kaart bevat WORDS_PER_CARD woorden, verdeeld over COLUMNS_PER_CARD
 * kolommen van ROWS_PER_CARD rijen.
 */

import { loadAviWords, getPreviousLevel, getNextLevel } from '../../../data/words/index'
import { supabase } from '../../../supabaseClient'

// --- Constanten ---

export const DMT_CONSTANTS = {
  WORDS_PER_CARD: 150,
  COLUMNS_PER_CARD: 5,
  ROWS_PER_CARD: 30,
  CARD_TIME_MS: 60000,            // 1 minuut per kaart
  PRACTICE_WORD_COUNTS: [25, 50, 100],
  PRACTICE_TIME_LIMITS: [60, 120, 180], // seconden
  MILESTONE_THRESHOLDS: [0.10, 0.20, 0.30, 0.40], // +10%, +20%, +30%, +40%
  STARS_PRACTICE: 5,
  STARS_TEST: 10,
  STARS_RECORD: 5,
  STARS_MILESTONE: 25
}

// --- Helpers ---

/**
 * Fisher-Yates shuffle (in-place).
 * Retourneert de geschudde array.
 */
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Vul een array aan tot `count` door de pool te herhalen.
 * Resultaat is geschud.
 */
const fillToCount = (pool, count) => {
  if (pool.length === 0) return []
  if (pool.length >= count) return shuffle(pool).slice(0, count)

  // Pool is kleiner dan count: herhaal tot we genoeg hebben
  const result = []
  while (result.length < count) {
    const shuffled = shuffle(pool)
    const remaining = count - result.length
    result.push(...shuffled.slice(0, remaining))
  }
  return result
}

/**
 * Verzamel woorden uit het huidige niveau plus aangrenzende niveaus,
 * gefilterd op lettergreep-telling.
 */
const collectWordsBySyllableCount = (aviLevel, targetSyllableCount) => {
  const words = []
  const seen = new Set()

  const addFromLevel = (level) => {
    if (!level) return
    const levelWords = loadAviWords(level)
    for (const w of levelWords) {
      const matches = targetSyllableCount === 3
        ? w.syllableCount >= 3
        : w.syllableCount === targetSyllableCount
      if (matches && !seen.has(w.word)) {
        seen.add(w.word)
        words.push(w)
      }
    }
  }

  // Huidig niveau eerst
  addFromLevel(aviLevel)

  // Aangrenzende niveaus als we niet genoeg hebben
  if (words.length < DMT_CONSTANTS.WORDS_PER_CARD) {
    addFromLevel(getPreviousLevel(aviLevel))
  }
  if (words.length < DMT_CONSTANTS.WORDS_PER_CARD) {
    addFromLevel(getNextLevel(aviLevel))
  }

  // Nog steeds niet genoeg? Probeer alle niveaus
  if (words.length < DMT_CONSTANTS.WORDS_PER_CARD) {
    const allLevels = ['start', 'm3', 'e3', 'm4', 'e4', 'm5-e5']
    for (const lvl of allLevels) {
      addFromLevel(lvl)
      if (words.length >= DMT_CONSTANTS.WORDS_PER_CARD) break
    }
  }

  return words
}

// --- Exports ---

/**
 * Haal woorden op voor practice modus.
 * Retourneert een geschudde array van `count` woorden uit het opgegeven AVI niveau.
 * Als er niet genoeg unieke woorden zijn, wordt de pool herhaald.
 *
 * @param {string} aviLevel - AVI niveau (bijv. 'e3', 'm4')
 * @param {number} count - Aantal woorden (standaard 50)
 * @returns {Array} Array van woord-objecten
 */
export const getWordsForPractice = (aviLevel, count = 50) => {
  const pool = loadAviWords(aviLevel)
  return fillToCount(pool, count)
}

/**
 * Slimme woordselectie voor practice modus.
 * Gebruikt word_attempts data om langzame woorden vaker terug te laten komen.
 *
 * Mix:
 *   - 40% langzame woorden (>2500ms gemiddeld) - deze moet het kind oefenen
 *   - 40% nieuwe/onbekende woorden - uitbreiding
 *   - 20% snelle woorden (<1500ms) - zelfvertrouwen, af en toe herhalen
 *
 * @param {string} userId - User ID voor word_attempts lookup
 * @param {string} aviLevel - AVI niveau
 * @param {number} count - Aantal woorden
 * @returns {Promise<Array>} Gewogen, geschudde woorden
 */
export const getSmartWordsForPractice = async (userId, aviLevel, count = 50) => {
  const pool = loadAviWords(aviLevel)
  if (!userId || pool.length === 0) return fillToCount(pool, count)

  // Haal recente word_attempts op voor DMT
  let wordStats = {}
  try {
    const { data: attempts } = await supabase
      .from('word_attempts')
      .select('word, time_taken_ms, correct')
      .eq('user_id', userId)
      .in('game_type', ['dmt_practice', 'dmt_test'])
      .order('timestamp', { ascending: false })
      .limit(500)

    if (attempts?.length) {
      // Bereken gemiddelde tijd per woord (laatste 5 pogingen max)
      const wordAttempts = {}
      for (const a of attempts) {
        if (!wordAttempts[a.word]) wordAttempts[a.word] = []
        if (wordAttempts[a.word].length < 5) {
          wordAttempts[a.word].push(a.time_taken_ms || 3000)
        }
      }
      for (const [word, times] of Object.entries(wordAttempts)) {
        const avg = times.reduce((s, t) => s + t, 0) / times.length
        wordStats[word] = { avgMs: avg, attempts: times.length }
      }
    }
  } catch (e) {
    console.warn('Smart word selection: kon geen attempts laden, gebruik random:', e)
    return fillToCount(pool, count)
  }

  // Categoriseer woorden
  const slow = []    // >2500ms gemiddeld - moet oefenen
  const medium = []  // 1500-2500ms - normaal
  const fast = []    // <1500ms - beheerst
  const unseen = []  // nooit gezien

  for (const word of pool) {
    const stats = wordStats[word.word]
    if (!stats) {
      unseen.push(word)
    } else if (stats.avgMs > 2500) {
      slow.push(word)
    } else if (stats.avgMs < 1500) {
      fast.push(word)
    } else {
      medium.push(word)
    }
  }

  // Bepaal aantallen per categorie
  const slowCount = Math.round(count * 0.4)
  const fastCount = Math.round(count * 0.2)
  const restCount = count - slowCount - fastCount

  const result = []

  // 1. Langzame woorden (40%) - prioriteit
  if (slow.length > 0) {
    // Sorteer langzaamste eerst
    slow.sort((a, b) => (wordStats[b.word]?.avgMs || 0) - (wordStats[a.word]?.avgMs || 0))
    const picked = slow.length >= slowCount ? shuffle(slow).slice(0, slowCount) : [...slow]
    result.push(...picked)
  }

  // 2. Snelle woorden (20%) - zelfvertrouwen
  if (fast.length > 0) {
    const picked = fast.length >= fastCount ? shuffle(fast).slice(0, fastCount) : shuffle(fast).slice(0, Math.min(fastCount, fast.length))
    result.push(...picked)
  }

  // 3. Vul aan met nieuwe + medium woorden
  const remaining = count - result.length
  const fillPool = shuffle([...unseen, ...medium])
  // Als er niet genoeg zijn, voeg ook extra slow/fast toe
  const allRemaining = fillPool.length >= remaining
    ? fillPool.slice(0, remaining)
    : [...fillPool, ...shuffle([...slow, ...fast]).filter(w => !result.includes(w))].slice(0, remaining)
  result.push(...allRemaining)

  // Als we nog steeds niet genoeg hebben, vul aan uit hele pool
  if (result.length < count) {
    const usedWords = new Set(result.map(w => w.word))
    const extra = pool.filter(w => !usedWords.has(w.word))
    result.push(...fillToCount(extra.length > 0 ? extra : pool, count - result.length))
  }

  return shuffle(result.slice(0, count))
}

/**
 * Haal woorden op voor test modus.
 * Retourneert 3 kaarten:
 *   card1: 1-lettergreep woorden (makkelijk)
 *   card2: 2-lettergreep woorden (medium)
 *   card3: 3+-lettergreep woorden (moeilijk)
 *
 * Elke kaart bevat WORDS_PER_CARD (150) woorden.
 *
 * @param {string} aviLevel - AVI niveau
 * @returns {{ card1: Array, card2: Array, card3: Array }}
 */
export const getWordsForTest = (aviLevel) => {
  const words1 = collectWordsBySyllableCount(aviLevel, 1)
  const words2 = collectWordsBySyllableCount(aviLevel, 2)
  const words3 = collectWordsBySyllableCount(aviLevel, 3)

  return {
    card1: fillToCount(words1, DMT_CONSTANTS.WORDS_PER_CARD),
    card2: fillToCount(words2, DMT_CONSTANTS.WORDS_PER_CARD),
    card3: fillToCount(words3, DMT_CONSTANTS.WORDS_PER_CARD)
  }
}

/**
 * Bereken woorden per minuut (WPM).
 *
 * @param {number} wordsRead - Aantal gelezen woorden
 * @param {number} timeMs - Verstreken tijd in milliseconden
 * @returns {number} WPM, afgerond op 1 decimaal
 */
export const calculateWPM = (wordsRead, timeMs) => {
  if (timeMs <= 0) return 0
  const minutes = timeMs / 60000
  return Math.round((wordsRead / minutes) * 10) / 10
}
