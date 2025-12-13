/**
 * SYLLABLE VALIDATOR
 * Valideert Nederlandse woorden en lettergreep-splitsingen.
 *
 * KRITIEKE REGELS:
 * 1. syllables.join('') MOET exact gelijk zijn aan word
 * 2. Aantal lettergrepen moet passen bij AVI niveau
 * 3. Geen lege lettergrepen
 * 4. stressIndex moet geldig zijn (als aanwezig)
 *
 * WAARSCHUWING: Dit is een validator, GEEN generator!
 * Claude mag NOOIT zelf woorden of lettergrepen bedenken.
 */

// AVI niveau configuratie
const AVI_CONFIG = {
  'start': { maxSyllables: 1, description: 'Begin groep 3, klankzuiver' },
  'm3': { maxSyllables: 1, description: 'Midden groep 3, + sch/ng/nk' },
  'e3': { maxSyllables: 2, description: 'Eind groep 3' },
  'm4': { maxSyllables: 3, description: 'Midden groep 4' },
  'e4': { maxSyllables: 3, description: 'Eind groep 4, + ge/be/ver' },
  'm5': { maxSyllables: 4, description: 'Midden groep 5' },
  'e5': { maxSyllables: 5, description: 'Eind groep 5' }
};

/**
 * Normaliseer AVI niveau string
 * @param {string} level - AVI niveau
 * @returns {string} Genormaliseerd niveau
 */
export const normalizeLevel = (level) => {
  if (!level) return 'e3';
  return level.toLowerCase().replace('avi-', '').replace('avi', '');
};

/**
 * Haal max lettergrepen voor een niveau
 * @param {string} level - AVI niveau
 * @returns {number} Maximum lettergrepen
 */
export const getMaxSyllablesForLevel = (level) => {
  const normalized = normalizeLevel(level);
  return AVI_CONFIG[normalized]?.maxSyllables || 2;
};

/**
 * Valideer een woord entry
 * @param {Object} entry - Woord entry om te valideren
 * @param {string} aviLevel - Optioneel: AVI niveau voor extra validatie
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
export const validateWord = (entry, aviLevel = null) => {
  const errors = [];
  const warnings = [];

  // Check 1: Woord bestaat
  if (!entry.word || typeof entry.word !== 'string') {
    errors.push('Woord ontbreekt of is geen string');
    return { valid: false, errors, warnings };
  }

  // Check 2: Syllables array bestaat
  if (!entry.syllables || !Array.isArray(entry.syllables)) {
    errors.push('Syllables array ontbreekt');
    return { valid: false, errors, warnings };
  }

  // Check 3: Geen lege syllables
  const emptySyllables = entry.syllables.filter(s => !s || s.length === 0);
  if (emptySyllables.length > 0) {
    errors.push(`${emptySyllables.length} lege lettergreep(en) gevonden`);
  }

  // Check 4: Syllables vormen het woord
  const joined = entry.syllables.join('');
  if (joined !== entry.word) {
    errors.push(
      `Lettergrepen "${entry.syllables.join('-')}" vormen niet "${entry.word}" (geeft: "${joined}")`
    );
  }

  // Check 5: syllableCount klopt (als aanwezig)
  if (entry.syllableCount !== undefined) {
    if (entry.syllableCount !== entry.syllables.length) {
      errors.push(
        `syllableCount ${entry.syllableCount} !== werkelijk ${entry.syllables.length}`
      );
    }
  }

  // Check 6: stressIndex is geldig (als aanwezig)
  if (entry.stressIndex !== undefined) {
    if (typeof entry.stressIndex !== 'number') {
      errors.push('stressIndex moet een nummer zijn');
    } else if (entry.stressIndex < 0 || entry.stressIndex >= entry.syllables.length) {
      errors.push(
        `stressIndex ${entry.stressIndex} is ongeldig voor ${entry.syllables.length} lettergrepen (moet 0-${entry.syllables.length - 1} zijn)`
      );
    }
  }

  // Check 7: Niveau passend (optioneel)
  if (aviLevel) {
    const maxAllowed = getMaxSyllablesForLevel(aviLevel);
    const actualCount = entry.syllables.length;

    if (actualCount > maxAllowed) {
      errors.push(
        `${actualCount} lettergrepen > max ${maxAllowed} voor niveau ${aviLevel}`
      );
    }
  }

  // Warnings (niet-fataal)

  // Warning: Geen afbeelding/emoji
  if (!entry.image) {
    warnings.push('Geen afbeelding/emoji gedefinieerd');
  }

  // Warning: Geen categorie
  if (!entry.category) {
    warnings.push('Geen categorie gedefinieerd');
  }

  // Warning: Hoofdletters in woord (behalve eigennamen)
  if (entry.word !== entry.word.toLowerCase() && entry.category !== 'namen') {
    warnings.push(`Woord bevat hoofdletters: "${entry.word}"`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Valideer een complete woorden lijst
 * @param {Array} words - Array van woord entries
 * @param {string} aviLevel - AVI niveau voor de lijst
 * @returns {Object} Validatie resultaten
 */
export const validateWordList = (words, aviLevel = null) => {
  const results = {
    total: words.length,
    valid: 0,
    invalid: 0,
    withWarnings: 0,
    errors: [],
    warnings: [],
    duplicates: []
  };

  const seenWords = new Set();

  words.forEach((word, index) => {
    // Check duplicaten
    if (seenWords.has(word.word)) {
      results.duplicates.push({
        word: word.word,
        index
      });
    }
    seenWords.add(word.word);

    // Valideer woord
    const validation = validateWord(word, aviLevel);

    if (validation.valid) {
      results.valid++;
    } else {
      results.invalid++;
      results.errors.push({
        index,
        word: word.word,
        errors: validation.errors
      });
    }

    if (validation.warnings.length > 0) {
      results.withWarnings++;
      results.warnings.push({
        index,
        word: word.word,
        warnings: validation.warnings
      });
    }
  });

  return results;
};

/**
 * Snel check of een woord entry geldig is
 * @param {Object} entry - Woord entry
 * @returns {boolean} Is geldig
 */
export const isValidWord = (entry) => {
  return validateWord(entry).valid;
};

/**
 * Valideer een JSON woorden bestand
 * @param {Object} jsonData - Geparsde JSON data
 * @returns {Object} Validatie resultaten
 */
export const validateWordFile = (jsonData) => {
  const results = {
    fileValid: true,
    fileErrors: [],
    ...validateWordList(jsonData.words || [], jsonData.level)
  };

  // Check file metadata
  if (!jsonData.level) {
    results.fileErrors.push('Geen "level" gedefinieerd in bestand');
    results.fileValid = false;
  }

  if (!jsonData.words || !Array.isArray(jsonData.words)) {
    results.fileErrors.push('Geen "words" array in bestand');
    results.fileValid = false;
  }

  if (!jsonData.maxSyllables) {
    results.fileErrors.push('Geen "maxSyllables" gedefinieerd');
  }

  // Valideer dat maxSyllables klopt met level
  if (jsonData.level && jsonData.maxSyllables) {
    const expected = getMaxSyllablesForLevel(jsonData.level);
    if (jsonData.maxSyllables !== expected) {
      results.fileErrors.push(
        `maxSyllables ${jsonData.maxSyllables} komt niet overeen met niveau ${jsonData.level} (verwacht: ${expected})`
      );
    }
  }

  results.fileValid = results.fileValid && results.fileErrors.length === 0;

  return results;
};

/**
 * Hulpfunctie: Tel lettergrepen in een Nederlands woord
 * LET OP: Dit is een SCHATTING, geen definitieve telling!
 * Gebruik dit alleen voor validatie checks, NOOIT voor het genereren van splitsingen.
 *
 * @param {string} word - Het woord
 * @returns {number} Geschat aantal lettergrepen
 */
export const estimateSyllableCount = (word) => {
  if (!word) return 0;

  const lowerWord = word.toLowerCase();

  // Tel klinkers als basis
  const vowels = lowerWord.match(/[aeiouáéíóúàèìòùäëïöü]/g) || [];
  let count = vowels.length;

  // Tweeklanken tellen als 1
  const diphthongs = ['aa', 'ee', 'ie', 'oe', 'oo', 'uu', 'au', 'ou', 'ei', 'ij', 'ui', 'eu', 'ai', 'oi', 'aai', 'ooi', 'oei', 'eeu', 'ieu'];
  for (const d of diphthongs) {
    const matches = (lowerWord.match(new RegExp(d, 'g')) || []).length;
    count -= matches;
  }

  // Minimum 1 lettergreep
  return Math.max(1, count);
};

/**
 * Check of geschatte telling overeenkomt met werkelijke
 * @param {Object} entry - Woord entry
 * @returns {Object} { matches: boolean, estimated: number, actual: number }
 */
export const checkSyllableCountEstimate = (entry) => {
  const estimated = estimateSyllableCount(entry.word);
  const actual = entry.syllables?.length || 0;

  return {
    matches: estimated === actual,
    estimated,
    actual,
    word: entry.word
  };
};

export default {
  validateWord,
  validateWordList,
  validateWordFile,
  isValidWord,
  getMaxSyllablesForLevel,
  normalizeLevel,
  estimateSyllableCount,
  checkSyllableCountEstimate,
  AVI_CONFIG
};
