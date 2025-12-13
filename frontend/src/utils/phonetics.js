/**
 * Helper om Nederlandse lettergrepen fonetisch te corrigeren voor TTS.
 * @param {string} syllable - De lettergreep zoals hij geschreven wordt (bijv. "mo")
 * @param {boolean} isStress - Heeft deze lettergreep de klemtoon?
 * @param {string} position - 'start', 'middle', 'end'
 * @returns {string} - De fonetische string voor de TTS
 */
export const getPhoneticSpelling = (syllable, isStress = true, position = 'middle') => {
  if (!syllable) return '';

  // Voeg een punt toe aan korte lettergrepen zodat TTS het niet als afkorting ziet
  // "mo" wordt anders uitgesproken als afkorting
  const s = syllable.trim();

  // Korte lettergrepen (2-3 letters) krijgen een punt om afkorting-detectie te voorkomen
  if (s.length <= 3 && /^[a-zA-Z]+$/.test(s)) {
    return s + '.';
  }

  return syllable;
};

/**
 * Bepaal de fonetische uitspraak voor een lettergreep binnen een woord context
 * @param {string} syllable - De lettergreep
 * @param {number} index - Index van de lettergreep in het woord
 * @param {number} totalSyllables - Totaal aantal lettergrepen
 * @param {number} stressIndex - Index van de beklemtoonde lettergreep (default 0)
 * @returns {string} - Fonetische spelling voor TTS
 */
export const getSyllableForSpeech = (syllable, index, totalSyllables, stressIndex = 0) => {
  let position = 'middle';
  if (index === 0) position = 'start';
  if (index === totalSyllables - 1) position = 'end';

  const isStress = index === stressIndex;

  return getPhoneticSpelling(syllable, isStress, position);
};

/**
 * Functie om een heel woord object te verrijken met spraak-strings
 */
export const enrichWordData = (wordObj) => {
  if (!wordObj.parts) return wordObj;

  const enrichedParts = wordObj.parts.map((part, index) => {
    // Als er al een handmatige 's' (speech) is, gebruik die.
    if (part.s) return part;

    // Bepaal positie
    let position = 'middle';
    if (index === 0) position = 'start';
    if (index === wordObj.parts.length - 1) position = 'end';

    // Bepaal klemtoon
    // Als stressIndex aanwezig is, gebruik die.
    // Anders: ga ervan uit dat de eerste lettergreep klemtoon heeft (veilige gok voor NL)
    let isStress = true;
    if (wordObj.stressIndex !== undefined) {
        isStress = wordObj.stressIndex === index;
    } else if (wordObj.parts.length > 1) {
        isStress = index === 0;
    }

    const text = part.t || part; // support string array of object array

    return {
      t: text,
      s: getPhoneticSpelling(text, isStress, position),
      stress: isStress
    };
  });

  return { ...wordObj, parts: enrichedParts };
};
