/**
 * WOORDEN DATABASE LOADER
 * Laadt en beheert de gevalideerde woordenlijsten per AVI niveau.
 *
 * AVI Niveaus:
 * - Start: Begin groep 3, 1 lettergreep, klankzuiver
 * - M3: Midden groep 3, 1 lettergreep + sch/ng/nk
 * - E3: Eind groep 3, max 2 lettergrepen
 * - M4: Midden groep 4, max 3 lettergrepen
 * - E4: Eind groep 4, max 3 lettergrepen + ge/be/ver
 * - M5-E5: Midden-Eind groep 5, max 4-5 lettergrepen
 */

// Import JSON bestanden
import aviStartData from './avi-start.json';
import aviM3Data from './avi-m3.json';
import aviE3Data from './avi-e3.json';
import aviM4Data from './avi-m4.json';
import aviE4Data from './avi-e4.json';
import aviM5E5Data from './avi-m5-e5.json';

// AVI niveau volgorde
const AVI_LEVELS = ['start', 'm3', 'e3', 'm4', 'e4', 'm5', 'e5', 'm5-e5'];

// Level naar data mapping
const LEVEL_DATA = {
  'start': aviStartData,
  'm3': aviM3Data,
  'e3': aviE3Data,
  'm4': aviM4Data,
  'e4': aviE4Data,
  'm5': aviM5E5Data,
  'e5': aviM5E5Data,
  'm5-e5': aviM5E5Data
};

// Max lettergrepen per niveau
const MAX_SYLLABLES = {
  'start': 1,
  'm3': 1,
  'e3': 2,
  'm4': 3,
  'e4': 3,
  'm5': 4,
  'e5': 5,
  'm5-e5': 5
};

// Cache voor geladen woorden
const wordCache = {
  all: null,
  stressWords: null,
  byLevel: {}
};

/**
 * Normaliseer level string
 */
const normalizeLevel = (level) => {
  if (!level) return 'e3';
  return level.toLowerCase().replace('avi-', '').replace('avi', '');
};

/**
 * Laad woorden voor een specifiek AVI niveau
 * @param {string} level - AVI niveau ('start', 'm3', 'e3', 'm4', 'e4', 'm5', 'e5', 'm5-e5')
 * @returns {Array} Array van woorden
 */
export const loadAviWords = (level) => {
  const normalized = normalizeLevel(level);

  if (wordCache.byLevel[normalized]) {
    return wordCache.byLevel[normalized];
  }

  const data = LEVEL_DATA[normalized];
  if (!data) {
    console.warn(`Onbekend AVI niveau: ${level}, fallback naar E3`);
    return loadAviWords('e3');
  }

  wordCache.byLevel[normalized] = data.words || [];
  return wordCache.byLevel[normalized];
};

/**
 * Laad alle woorden (gecombineerd uit alle niveaus)
 */
export const loadAllWords = () => {
  if (wordCache.all) return wordCache.all;

  const allWords = [];
  const seenWords = new Set();

  // Laad woorden van alle niveaus (hogere niveaus overschrijven lagere)
  Object.values(LEVEL_DATA).forEach(data => {
    if (data?.words) {
      data.words.forEach(word => {
        if (!seenWords.has(word.word)) {
          seenWords.add(word.word);
          allWords.push(word);
        }
      });
    }
  });

  wordCache.all = allWords;
  return allWords;
};

/**
 * Laad alleen klemtoon woorden (voor TrollGame)
 * Woorden met stressIndex gedefinieerd
 */
export const loadStressWords = () => {
  if (wordCache.stressWords) return wordCache.stressWords;

  const allWords = loadAllWords();
  const stressWords = allWords.filter(w =>
    w.stressIndex !== undefined &&
    w.syllableCount >= 2
  );

  wordCache.stressWords = stressWords;
  return stressWords;
};

/**
 * Laad klemtoon woorden voor specifiek niveau
 */
export const loadStressWordsForLevel = (level) => {
  const words = loadAviWords(level);
  return words.filter(w =>
    w.stressIndex !== undefined &&
    w.syllableCount >= 2
  );
};

/**
 * Haal het vorige AVI niveau op
 * @param {string} level - Huidig niveau
 * @returns {string|null} Vorig niveau of null
 */
export const getPreviousLevel = (level) => {
  const normalized = normalizeLevel(level);
  const orderedLevels = ['start', 'm3', 'e3', 'm4', 'e4', 'm5-e5'];
  const index = orderedLevels.indexOf(normalized);

  // Handle m5 and e5 as aliases
  if (normalized === 'm5' || normalized === 'e5') {
    return 'e4';
  }

  if (index <= 0) return null;
  return orderedLevels[index - 1];
};

/**
 * Haal het volgende AVI niveau op
 * @param {string} level - Huidig niveau
 * @returns {string|null} Volgend niveau of null
 */
export const getNextLevel = (level) => {
  const normalized = normalizeLevel(level);
  const orderedLevels = ['start', 'm3', 'e3', 'm4', 'e4', 'm5-e5'];
  const index = orderedLevels.indexOf(normalized);

  // Handle m5 and e5 as aliases
  if (normalized === 'm5' || normalized === 'e5' || normalized === 'm5-e5') {
    return null; // Already at highest level
  }

  if (index < 0 || index >= orderedLevels.length - 1) return null;
  return orderedLevels[index + 1];
};

/**
 * Haal het maximum aantal lettergrepen voor een niveau
 */
export const getMaxSyllables = (level) => {
  const normalized = normalizeLevel(level);
  return MAX_SYLLABLES[normalized] || 2;
};

/**
 * Haal niveau metadata op
 */
export const getLevelInfo = (level) => {
  const normalized = normalizeLevel(level);
  const data = LEVEL_DATA[normalized];

  if (!data) return null;

  return {
    level: data.level,
    description: data.description,
    maxSyllables: data.maxSyllables,
    wordCount: data.words?.length || 0,
    validated: data.validated,
    validatedBy: data.validatedBy,
    validatedDate: data.validatedDate
  };
};

/**
 * Valideer een woord entry
 * @param {Object} entry - Woord entry om te valideren
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateWord = (entry) => {
  const errors = [];

  // Check 1: Syllables vormen het woord
  if (entry.syllables) {
    const joined = entry.syllables.join('');
    if (joined !== entry.word) {
      errors.push(`Lettergrepen "${entry.syllables.join('-')}" vormen niet "${entry.word}" (geeft: "${joined}")`);
    }
  }

  // Check 2: Aantal lettergrepen klopt
  if (entry.syllables && entry.syllableCount !== entry.syllables.length) {
    errors.push(`syllableCount ${entry.syllableCount} !== actual ${entry.syllables.length}`);
  }

  // Check 3: Geen lege syllables
  if (entry.syllables?.some(s => !s || s.length === 0)) {
    errors.push('Lege lettergreep gevonden');
  }

  // Check 4: stressIndex is geldig (als aanwezig)
  if (entry.stressIndex !== undefined && entry.syllables) {
    if (entry.stressIndex < 0 || entry.stressIndex >= entry.syllables.length) {
      errors.push(`stressIndex ${entry.stressIndex} is ongeldig voor ${entry.syllables.length} lettergrepen`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valideer alle woorden in een niveau
 */
export const validateLevel = (level) => {
  const words = loadAviWords(level);
  const results = {
    level,
    total: words.length,
    valid: 0,
    invalid: 0,
    errors: []
  };

  words.forEach(word => {
    const validation = validateWord(word);
    if (validation.valid) {
      results.valid++;
    } else {
      results.invalid++;
      results.errors.push({
        word: word.word,
        errors: validation.errors
      });
    }
  });

  return results;
};

/**
 * Valideer alle woorden in de database
 */
export const validateAllWords = () => {
  const allWords = loadAllWords();
  const results = {
    total: allWords.length,
    valid: 0,
    invalid: 0,
    errors: []
  };

  allWords.forEach(word => {
    const validation = validateWord(word);
    if (validation.valid) {
      results.valid++;
    } else {
      results.invalid++;
      results.errors.push({
        word: word.word,
        errors: validation.errors
      });
    }
  });

  return results;
};

/**
 * Zoek een woord in de database
 */
export const findWord = (searchWord) => {
  const allWords = loadAllWords();
  return allWords.find(w => w.word === searchWord);
};

/**
 * Filter woorden op categorie
 */
export const filterByCategory = (category, level = null) => {
  const words = level ? loadAviWords(level) : loadAllWords();
  return words.filter(w => w.category === category);
};

/**
 * Haal alle beschikbare categorieën op
 */
export const getCategories = (level = null) => {
  const words = level ? loadAviWords(level) : loadAllWords();
  return [...new Set(words.map(w => w.category))].sort();
};

/**
 * Haal willekeurige woorden op
 */
export const getRandomWords = (count, level = null, options = {}) => {
  const words = level ? loadAviWords(level) : loadAllWords();
  let filtered = [...words];

  // Filter op categorie als opgegeven
  if (options.category) {
    filtered = filtered.filter(w => w.category === options.category);
  }

  // Filter op min/max lettergrepen
  if (options.minSyllables) {
    filtered = filtered.filter(w => w.syllableCount >= options.minSyllables);
  }
  if (options.maxSyllables) {
    filtered = filtered.filter(w => w.syllableCount <= options.maxSyllables);
  }

  // Filter alleen woorden met klemtoon info
  if (options.requireStress) {
    filtered = filtered.filter(w => w.stressIndex !== undefined);
  }

  // Exclude specifieke woorden
  if (options.exclude && options.exclude.length > 0) {
    const excludeSet = new Set(options.exclude);
    filtered = filtered.filter(w => !excludeSet.has(w.word));
  }

  // Shuffle en neem count
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Statistieken over de database
 */
export const getDatabaseStats = () => {
  const levels = ['start', 'm3', 'e3', 'm4', 'e4', 'm5-e5'];
  const stats = {
    totalWords: 0,
    byLevel: {},
    categories: getCategories(),
    stressWords: loadStressWords().length
  };

  levels.forEach(level => {
    const words = loadAviWords(level);
    stats.byLevel[level] = words.length;
    stats.totalWords += words.length;
  });

  // Correct for shared m5-e5
  stats.totalWords = loadAllWords().length;

  return stats;
};

/**
 * Clear de cache (voor testing of refresh)
 */
export const clearCache = () => {
  wordCache.all = null;
  wordCache.stressWords = null;
  wordCache.byLevel = {};
};

export default {
  loadAllWords,
  loadAviWords,
  loadStressWords,
  loadStressWordsForLevel,
  getPreviousLevel,
  getNextLevel,
  getMaxSyllables,
  getLevelInfo,
  validateWord,
  validateLevel,
  validateAllWords,
  findWord,
  filterByCategory,
  getCategories,
  getRandomWords,
  getDatabaseStats,
  clearCache,
  AVI_LEVELS
};
