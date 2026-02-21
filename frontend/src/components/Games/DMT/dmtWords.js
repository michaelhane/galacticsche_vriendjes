/**
 * DMT WOORDEN SELECTIE
 * Levert woorden voor practice en test modus van het DMT Snowboard Sprint spel.
 *
 * Practice: willekeurige woorden uit het AVI niveau, geschud.
 * Test: 3 kaarten (easy/medium/hard) op basis van lettergreep-telling.
 *   - Kaart 1: 1 lettergreep
 *   - Kaart 2: 2 lettergrepen
 *   - Kaart 3: 3+ lettergrepen
 *
 * Elke kaart bevat WORDS_PER_CARD woorden, verdeeld over COLUMNS_PER_CARD
 * kolommen van ROWS_PER_CARD rijen.
 */

import { loadAviWords, getPreviousLevel, getNextLevel } from '../../../data/words/index'

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
