/**
 * DUAL STORAGE SYNC UTILITY
 * Zorgt ervoor dat progress NOOIT verloren gaat.
 *
 * Strategie:
 * 1. State update (instant feedback)
 * 2. localStorage save (immediate backup)
 * 3. Supabase sync (persistent storage)
 *
 * Bij conflict: Highest Progress Wins
 */

const STORAGE_KEY = 'galactische_vrienden_progress';
const RETRY_QUEUE_KEY = 'galactische_vrienden_retry_queue';

/**
 * Sla progress op in localStorage
 * @param {Object} data - Progress data om op te slaan
 */
export const saveToLocalStorage = (data) => {
  try {
    const existing = loadFromLocalStorage();
    const merged = {
      ...existing,
      ...data,
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return true;
  } catch (e) {
    console.error('localStorage save failed:', e);
    return false;
  }
};

/**
 * Laad progress uit localStorage
 * @returns {Object} Opgeslagen progress data
 */
export const loadFromLocalStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getDefaultProgress();
  } catch (e) {
    console.error('localStorage load failed:', e);
    return getDefaultProgress();
  }
};

/**
 * Default progress structuur
 */
const getDefaultProgress = () => ({
  stars: 0,
  completedLevels: {
    code_kraken: [],
    troll: [],
    jumper: [],
    stories: []
  },
  unlockedItems: [],
  lastUpdated: null
});

/**
 * Conflict resolution: Highest Progress Wins
 * @param {Object} local - localStorage data
 * @param {Object} cloud - Supabase data
 * @returns {Object} Gemerged resultaat met hoogste progress
 */
export const resolveConflict = (local, cloud) => {
  // Neem de hoogste sterren
  const stars = Math.max(local.stars || 0, cloud.stars || 0);

  // Merge completed levels (union van beide)
  const completedLevels = mergeCompletedLevels(
    local.completedLevels || {},
    cloud.completedLevels || {}
  );

  // Merge unlocked items (union)
  const unlockedItems = [...new Set([
    ...(local.unlockedItems || []),
    ...(cloud.unlockedItems || [])
  ])];

  return {
    stars,
    completedLevels,
    unlockedItems,
    lastUpdated: Date.now(),
    resolvedFrom: local.lastUpdated > (cloud.lastUpdated || 0) ? 'local' : 'cloud'
  };
};

/**
 * Merge completed levels van twee bronnen
 */
const mergeCompletedLevels = (local, cloud) => {
  const gameTypes = ['code_kraken', 'troll', 'jumper', 'stories'];
  const merged = {};

  for (const gameType of gameTypes) {
    merged[gameType] = [...new Set([
      ...(local[gameType] || []),
      ...(cloud[gameType] || [])
    ])];
  }

  return merged;
};

/**
 * Voeg een gefaalde operatie toe aan de retry queue
 * @param {Object} operation - De operatie die opnieuw geprobeerd moet worden
 */
export const addToRetryQueue = (operation) => {
  try {
    const queue = getRetryQueue();
    queue.push({
      ...operation,
      timestamp: Date.now(),
      retries: 0
    });
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to add to retry queue:', e);
  }
};

/**
 * Haal de retry queue op
 */
export const getRetryQueue = () => {
  try {
    const data = localStorage.getItem(RETRY_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

/**
 * Verwijder een operatie uit de retry queue
 */
export const removeFromRetryQueue = (index) => {
  try {
    const queue = getRetryQueue();
    queue.splice(index, 1);
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to remove from retry queue:', e);
  }
};

/**
 * Clear de hele retry queue
 */
export const clearRetryQueue = () => {
  try {
    localStorage.removeItem(RETRY_QUEUE_KEY);
  } catch (e) {
    console.error('Failed to clear retry queue:', e);
  }
};

/**
 * Process de retry queue
 * @param {Function} syncFunction - Functie om te syncen naar cloud
 */
export const processRetryQueue = async (syncFunction) => {
  const queue = getRetryQueue();

  if (queue.length === 0) return { processed: 0 };

  let processed = 0;
  const maxRetries = 3;

  for (let i = queue.length - 1; i >= 0; i--) {
    const operation = queue[i];

    // Skip als te veel retries
    if (operation.retries >= maxRetries) {
      console.warn('Max retries reached for operation:', operation);
      removeFromRetryQueue(i);
      continue;
    }

    try {
      await syncFunction(operation);
      removeFromRetryQueue(i);
      processed++;
    } catch (e) {
      // Update retry count
      queue[i].retries++;
      queue[i].lastRetry = Date.now();
      localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
    }
  }

  return { processed };
};

/**
 * Sync lokale data naar Supabase
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {Object} localData - Lokale progress data
 */
export const syncToCloud = async (supabase, userId, localData) => {
  try {
    // Update stars in profiles
    const { error: starsError } = await supabase
      .from('profiles')
      .update({
        stars: localData.stars,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (starsError) throw starsError;

    // Sync completed levels
    const completedLevels = localData.completedLevels || {};

    for (const [gameType, levels] of Object.entries(completedLevels)) {
      for (const levelId of levels) {
        await supabase
          .from('completed_levels')
          .upsert({
            user_id: userId,
            game_type: gameType,
            level_id: levelId,
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,game_type,level_id'
          });
      }
    }

    // Sync unlocked items
    const unlockedItems = localData.unlockedItems || [];

    for (const itemId of unlockedItems) {
      await supabase
        .from('user_items')
        .upsert({
          user_id: userId,
          item_id: itemId,
          purchased_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,item_id'
        });
    }

    return { success: true };
  } catch (e) {
    console.error('Sync to cloud failed:', e);
    return { success: false, error: e };
  }
};

/**
 * Laad data uit Supabase
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 */
export const loadFromCloud = async (supabase, userId) => {
  try {
    // Haal profiel op voor sterren
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stars')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Haal completed levels op
    const { data: completedData, error: completedError } = await supabase
      .from('completed_levels')
      .select('game_type, level_id')
      .eq('user_id', userId);

    if (completedError) throw completedError;

    // Groepeer per game type
    const completedLevels = {
      code_kraken: [],
      troll: [],
      jumper: [],
      stories: []
    };

    completedData?.forEach(item => {
      if (completedLevels[item.game_type]) {
        completedLevels[item.game_type].push(item.level_id);
      }
    });

    // Haal unlocked items op
    const { data: itemsData, error: itemsError } = await supabase
      .from('user_items')
      .select('item_id')
      .eq('user_id', userId);

    if (itemsError) throw itemsError;

    const unlockedItems = itemsData?.map(item => item.item_id) || [];

    return {
      stars: profile?.stars || 0,
      completedLevels,
      unlockedItems,
      lastUpdated: Date.now()
    };
  } catch (e) {
    console.error('Load from cloud failed:', e);
    return null;
  }
};

/**
 * Full sync: vergelijk local en cloud, merge, en sync beide
 */
export const fullSync = async (supabase, userId) => {
  const local = loadFromLocalStorage();
  const cloud = await loadFromCloud(supabase, userId);

  if (!cloud) {
    console.warn('Could not load from cloud, using local data');
    return local;
  }

  // Resolve conflicts
  const merged = resolveConflict(local, cloud);

  // Save merged result to both
  saveToLocalStorage(merged);
  await syncToCloud(supabase, userId, merged);

  return merged;
};

export default {
  saveToLocalStorage,
  loadFromLocalStorage,
  resolveConflict,
  addToRetryQueue,
  getRetryQueue,
  processRetryQueue,
  syncToCloud,
  loadFromCloud,
  fullSync
};
