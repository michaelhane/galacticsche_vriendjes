/**
 * SPACED REPETITION SERVICE
 * Houdt bij welke woorden een kind moeilijk vindt
 * en bepaalt wanneer ze opnieuw moeten worden geoefend.
 *
 * Logica:
 * - Nieuw/Moeilijk (<50% goed): Dagelijks
 * - Matig (50-80% goed): Om de dag
 * - Beheerst (>90% goed): Wekelijks/Maandelijks
 */

import { supabase } from '../supabaseClient';

/**
 * Registreer een woord-poging
 * @param {string} userId - ID van de gebruiker
 * @param {string} word - Het geoefende woord
 * @param {boolean} correct - Was het antwoord correct?
 * @param {string} gameType - Type spel ('code_kraken', 'troll', 'jumper')
 * @param {number} timeTakenMs - Tijd in milliseconden (optioneel)
 */
export const recordAttempt = async (userId, word, correct, gameType, timeTakenMs = null) => {
  try {
    const { error } = await supabase
      .from('word_attempts')
      .insert({
        user_id: userId,
        word,
        correct,
        game_type: gameType,
        time_taken_ms: timeTakenMs,
        timestamp: new Date().toISOString()
      });

    if (error) throw error;

    return { success: true };
  } catch (e) {
    console.error('Failed to record attempt:', e);

    // Fallback: sla lokaal op voor later sync
    saveAttemptLocally(userId, word, correct, gameType, timeTakenMs);

    return { success: false, error: e };
  }
};

/**
 * Lokale fallback voor offline mode
 */
const PENDING_ATTEMPTS_KEY = 'galactische_pending_attempts';

const saveAttemptLocally = (userId, word, correct, gameType, timeTakenMs) => {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_ATTEMPTS_KEY) || '[]');
    pending.push({
      user_id: userId,
      word,
      correct,
      game_type: gameType,
      time_taken_ms: timeTakenMs,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(PENDING_ATTEMPTS_KEY, JSON.stringify(pending));
  } catch (e) {
    console.error('Failed to save attempt locally:', e);
  }
};

/**
 * Sync lokaal opgeslagen pogingen naar de database
 */
export const syncPendingAttempts = async () => {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_ATTEMPTS_KEY) || '[]');

    if (pending.length === 0) return { synced: 0 };

    const { error } = await supabase
      .from('word_attempts')
      .insert(pending);

    if (error) throw error;

    // Clear local storage na succesvolle sync
    localStorage.removeItem(PENDING_ATTEMPTS_KEY);

    return { synced: pending.length };
  } catch (e) {
    console.error('Failed to sync pending attempts:', e);
    return { synced: 0, error: e };
  }
};

/**
 * Haal moeilijke woorden op voor een gebruiker
 * @param {string} userId - ID van de gebruiker
 * @param {number} limit - Maximum aantal woorden
 * @returns {Promise<Array>} Lijst van moeilijke woorden
 */
export const getDifficultWords = async (userId, limit = 10) => {
  try {
    // Haal alle recente pogingen op
    const { data: attempts, error } = await supabase
      .from('word_attempts')
      .select('word, correct')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Bereken success rate per woord
    const wordStats = {};

    attempts.forEach(a => {
      if (!wordStats[a.word]) {
        wordStats[a.word] = { correct: 0, total: 0 };
      }
      wordStats[a.word].total++;
      if (a.correct) wordStats[a.word].correct++;
    });

    // Filter op woorden met lage success rate (<50%)
    const difficult = Object.entries(wordStats)
      .filter(([_, stats]) => stats.total >= 2 && (stats.correct / stats.total) < 0.5)
      .map(([word, stats]) => ({
        word,
        successRate: stats.correct / stats.total,
        attempts: stats.total
      }))
      .sort((a, b) => a.successRate - b.successRate);

    return difficult.slice(0, limit);
  } catch (e) {
    console.error('Failed to get difficult words:', e);
    return [];
  }
};

/**
 * Haal woord statistieken op voor een specifiek woord
 * @param {string} userId - ID van de gebruiker
 * @param {string} word - Het woord om te checken
 */
export const getWordStats = async (userId, word) => {
  try {
    const { data: attempts, error } = await supabase
      .from('word_attempts')
      .select('correct, timestamp')
      .eq('user_id', userId)
      .eq('word', word)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!attempts || attempts.length === 0) {
      return { isNew: true, successRate: 0, attempts: 0 };
    }

    const correct = attempts.filter(a => a.correct).length;
    const total = attempts.length;

    return {
      isNew: false,
      successRate: correct / total,
      attempts: total,
      lastAttempt: attempts[0].timestamp,
      mastery: getMasteryLevel(correct / total)
    };
  } catch (e) {
    console.error('Failed to get word stats:', e);
    return { isNew: true, successRate: 0, attempts: 0 };
  }
};

/**
 * Bepaal het beheersingsniveau
 */
const getMasteryLevel = (successRate) => {
  if (successRate >= 0.9) return 'mastered';
  if (successRate >= 0.7) return 'learning';
  if (successRate >= 0.5) return 'practicing';
  return 'difficult';
};

/**
 * Bereken wanneer een woord opnieuw geoefend moet worden
 * @param {Object} stats - Statistieken van het woord
 * @returns {Date} Volgende review datum
 */
export const getNextReviewDate = (stats) => {
  const now = new Date();

  if (stats.isNew || stats.mastery === 'difficult') {
    // Morgen
    return new Date(now.setDate(now.getDate() + 1));
  }

  if (stats.mastery === 'practicing') {
    // Over 2 dagen
    return new Date(now.setDate(now.getDate() + 2));
  }

  if (stats.mastery === 'learning') {
    // Over een week
    return new Date(now.setDate(now.getDate() + 7));
  }

  // Mastered: over een maand
  return new Date(now.setMonth(now.getMonth() + 1));
};

/**
 * Haal alle statistieken op voor het ouder dashboard
 * @param {string} userId - ID van de gebruiker
 */
export const getUserProgress = async (userId) => {
  try {
    const { data: attempts, error } = await supabase
      .from('word_attempts')
      .select('word, correct, game_type, timestamp')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Totale statistieken
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter(a => a.correct).length;
    const uniqueWords = [...new Set(attempts.map(a => a.word))].length;

    // Per spel
    const byGame = {};
    attempts.forEach(a => {
      if (!byGame[a.game_type]) {
        byGame[a.game_type] = { total: 0, correct: 0 };
      }
      byGame[a.game_type].total++;
      if (a.correct) byGame[a.game_type].correct++;
    });

    // Voortgang per dag (laatste 7 dagen)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayAttempts = attempts.filter(a =>
        a.timestamp.startsWith(dateStr)
      );

      last7Days.push({
        date: dateStr,
        total: dayAttempts.length,
        correct: dayAttempts.filter(a => a.correct).length
      });
    }

    return {
      totalAttempts,
      correctAttempts,
      successRate: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
      uniqueWords,
      byGame,
      last7Days
    };
  } catch (e) {
    console.error('Failed to get user progress:', e);
    return null;
  }
};

export default {
  recordAttempt,
  syncPendingAttempts,
  getDifficultWords,
  getWordStats,
  getNextReviewDate,
  getUserProgress
};
