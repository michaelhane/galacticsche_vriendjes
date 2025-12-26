import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

// Beschikbare achievements
export const ACHIEVEMENTS = {
  first_story: { id: 'first_story', name: 'Eerste Verhaal', icon: '📖', description: 'Je eerste verhaal gelezen!' },
  first_game: { id: 'first_game', name: 'Eerste Spel', icon: '🎮', description: 'Je eerste spel gespeeld!' },
  star_50: { id: 'star_50', name: 'Sterrenverzamelaar', icon: '⭐', description: '50 sterren verzameld!' },
  star_200: { id: 'star_200', name: 'Sterrenmeester', icon: '🌟', description: '200 sterren verzameld!' },
  star_500: { id: 'star_500', name: 'Supernova', icon: '💫', description: '500 sterren verzameld!' },
  streak_3: { id: 'streak_3', name: '3 Dagen Reeks', icon: '🔥', description: '3 dagen achter elkaar gelezen!' },
  streak_7: { id: 'streak_7', name: 'Week Kampioen', icon: '🏆', description: '7 dagen achter elkaar gelezen!' },
  streak_30: { id: 'streak_30', name: 'Maand Meester', icon: '👑', description: '30 dagen achter elkaar gelezen!' },
  story_maker: { id: 'story_maker', name: 'Verhalen Maker', icon: '✨', description: '5 verhalen gemaakt!' },
  quiz_ace: { id: 'quiz_ace', name: 'Quiz Kampioen', icon: '🧠', description: '5 quizzen perfect behaald!' }
}

export const useAchievements = (userId) => {
  const [earned, setEarned] = useState([])
  const [loading, setLoading] = useState(true)
  const [newAchievement, setNewAchievement] = useState(null)

  // Laad behaalde achievements
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadAchievements = async () => {
      try {
        const { data, error } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', userId)

        if (!error && data) {
          setEarned(data.map(a => a.achievement_id))
        }
      } catch (err) {
        console.error('Achievements laden mislukt:', err)
      }
      setLoading(false)
    }

    loadAchievements()
  }, [userId])

  // Check en geef achievement
  const checkAndAward = useCallback(async (achievementId) => {
    if (!userId || earned.includes(achievementId)) return false

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: achievementId })

      if (!error) {
        setEarned(prev => [...prev, achievementId])
        setNewAchievement(ACHIEVEMENTS[achievementId])
        // Auto-hide na 3 seconden
        setTimeout(() => setNewAchievement(null), 3000)
        return true
      }
    } catch (err) {
      console.error('Achievement toekennen mislukt:', err)
    }
    return false
  }, [userId, earned])

  // Check meerdere achievements op basis van stats
  const checkStats = useCallback(async (stats) => {
    const { stars, streak, storiesRead, gamesPlayed, storiesMade, perfectQuizzes } = stats

    // Star achievements
    if (stars >= 50) await checkAndAward('star_50')
    if (stars >= 200) await checkAndAward('star_200')
    if (stars >= 500) await checkAndAward('star_500')

    // Streak achievements
    if (streak >= 3) await checkAndAward('streak_3')
    if (streak >= 7) await checkAndAward('streak_7')
    if (streak >= 30) await checkAndAward('streak_30')

    // Activity achievements
    if (storiesRead >= 1) await checkAndAward('first_story')
    if (gamesPlayed >= 1) await checkAndAward('first_game')
    if (storiesMade >= 5) await checkAndAward('story_maker')
    if (perfectQuizzes >= 5) await checkAndAward('quiz_ace')
  }, [checkAndAward])

  // Dismiss notification
  const dismissNotification = useCallback(() => {
    setNewAchievement(null)
  }, [])

  return { 
    earned, 
    loading, 
    newAchievement, 
    checkAndAward, 
    checkStats,
    dismissNotification,
    allAchievements: ACHIEVEMENTS 
  }
}
