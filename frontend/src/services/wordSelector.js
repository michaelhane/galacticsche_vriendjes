/**
 * SLIM WOORD SELECTIE ALGORITME
 * Dit is het hart van de educatieve engine.
 *
 * Genereert een sessie van 10 woorden met de volgende mix:
 * - 20% Weekwoorden (ouder/school input)
 * - 30% Moeilijke woorden (eerder fout gehad)
 * - 40% Nieuwe woorden (uit AVI database)
 * - 10% Makkelijke woorden (zelfvertrouwen)
 */

import { supabase } from '../supabaseClient';
import { loadAviWords, getPreviousLevel, getNextLevel } from '../data/words';

/**
 * Genereer een slimme sessie van woorden voor een specifiek spel
 * @param {Object} userProfile - Het profiel van het kind
 * @param {string} gameType - Type spel ('code_kraken', 'troll', 'jumper')
 * @returns {Promise<Array>} Array van 10 woorden met volledige data
 */
export const generateSession = async (userProfile, gameType) => {
  const sessionWords = [];
  const targetCount = 10;
  const usedWords = new Set();

  // 1. WEEKWOORDEN (20% = max 2)
  // Woorden die de ouder deze week heeft toegevoegd
  try {
    const { data: weekWords } = await supabase
      .from('week_words')
      .select('*')
      .eq('user_id', userProfile.id)
      .gte('active_until', new Date().toISOString());

    if (weekWords?.length) {
      const selected = weekWords.slice(0, 2).map(w => ({
        word: w.word,
        syllables: w.syllables,
        syllableCount: w.syllables.length,
        stressIndex: w.stress_index || 0,
        image: '📚', // School woord indicator
        category: 'school',
        source: 'week_words'
      }));

      selected.forEach(w => {
        sessionWords.push(w);
        usedWords.add(w.word);
      });
    }
  } catch (e) {
    console.warn('Could not load week words:', e);
  }

  // 2. MOEILIJKE WOORDEN (30% = max 3)
  // Woorden die het kind eerder fout had
  try {
    const { data: attempts } = await supabase
      .from('word_attempts')
      .select('word')
      .eq('user_id', userProfile.id)
      .eq('correct', false)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (attempts?.length) {
      // Unieke moeilijke woorden die nog niet in sessie zitten
      const uniqueDifficult = [...new Set(attempts.map(a => a.word))]
        .filter(w => !usedWords.has(w));

      // Zoek de volledige data van deze woorden in de database
      const difficultData = lookupWordsInDb(uniqueDifficult, userProfile.avi_level);

      difficultData.slice(0, 3).forEach(w => {
        sessionWords.push({ ...w, source: 'difficult' });
        usedWords.add(w.word);
      });
    }
  } catch (e) {
    console.warn('Could not load difficult words:', e);
  }

  // 3. MAKKELIJKE WOORDEN (10% = 1 woord voor zelfvertrouwen)
  const prevLevel = getPreviousLevel(userProfile.avi_level);
  if (prevLevel) {
    const easyWords = loadAviWords(prevLevel);
    const availableEasy = easyWords.filter(w => !usedWords.has(w.word));

    if (availableEasy.length) {
      const randomEasy = availableEasy[Math.floor(Math.random() * availableEasy.length)];
      sessionWords.push({ ...randomEasy, source: 'easy' });
      usedWords.add(randomEasy.word);
    }
  }

  // 4. NIEUWE WOORDEN (40% + rest = vul aan tot 10)
  const aviWords = loadAviWords(userProfile.avi_level);

  // Filter woorden die al in de sessie zitten
  let pool = aviWords.filter(w => !usedWords.has(w.word));

  // Boost score voor interesses van het kind
  pool = pool.map(w => {
    let score = Math.random(); // Basis random score

    // Bonus voor woorden die bij interesses passen
    if (userProfile.interests?.includes(w.category)) {
      score += 0.5;
    }

    return { ...w, score, source: 'new' };
  });

  // Sorteer op score (hoogste eerst)
  pool.sort((a, b) => b.score - a.score);

  // Vul aan tot target aantal
  const needed = targetCount - sessionWords.length;
  pool.slice(0, needed).forEach(w => {
    const { score, ...wordData } = w; // Verwijder score uit finale data
    sessionWords.push(wordData);
  });

  // Shuffle de sessie zodat weekwoorden niet altijd eerst komen
  return shuffleArray(sessionWords);
};

/**
 * Zoek woorden op in de AVI database
 * @param {Array<string>} wordList - Lijst van woorden om te zoeken
 * @param {string} level - AVI niveau om in te zoeken
 * @returns {Array} Gevonden woorden met volledige data
 */
const lookupWordsInDb = (wordList, level) => {
  // Probeer eerst in het huidige niveau
  let db = loadAviWords(level);
  let found = db.filter(entry => wordList.includes(entry.word));

  // Als niet gevonden, zoek ook in aangrenzende niveaus
  if (found.length < wordList.length) {
    const prevLevel = getPreviousLevel(level);
    const nextLevel = getNextLevel(level);

    if (prevLevel) {
      const prevDb = loadAviWords(prevLevel);
      found = [...found, ...prevDb.filter(entry =>
        wordList.includes(entry.word) && !found.find(f => f.word === entry.word)
      )];
    }

    if (nextLevel) {
      const nextDb = loadAviWords(nextLevel);
      found = [...found, ...nextDb.filter(entry =>
        wordList.includes(entry.word) && !found.find(f => f.word === entry.word)
      )];
    }
  }

  return found;
};

/**
 * Fisher-Yates shuffle algoritme
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Haal woorden op voor een specifiek spel type
 * Filtert op basis van wat het spel nodig heeft
 */
export const getWordsForGame = async (userProfile, gameType) => {
  const session = await generateSession(userProfile, gameType);

  // Voor TrollGame: alleen woorden met stressIndex
  if (gameType === 'troll') {
    return session.filter(w => w.stressIndex !== undefined);
  }

  // Voor CodeKraken: alle woorden met syllables
  if (gameType === 'code_kraken') {
    return session.filter(w => w.syllables && w.syllables.length > 0);
  }

  return session;
};

/**
 * Fallback functie voor offline mode of als database niet beschikbaar is
 * Gebruikt alleen de lokale JSON database
 */
export const getOfflineSession = (aviLevel, count = 10) => {
  const words = loadAviWords(aviLevel);
  const shuffled = shuffleArray(words);
  return shuffled.slice(0, count);
};

export default {
  generateSession,
  getWordsForGame,
  getOfflineSession
};
