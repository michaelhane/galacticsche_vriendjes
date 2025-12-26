import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export const useStreak = (userId) => {
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [loading, setLoading] = useState(true)

  // Laad huidige streak
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const loadStreak = async () => {
      try {
        const { data, error } = await supabase
          .from('reading_streaks')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (data) {
          // Check of streak nog geldig is (niet meer dan 1 dag geleden)
          const lastDate = data.last_activity_date ? new Date(data.last_activity_date) : null
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (lastDate) {
            const diffDays = Math.floor((today - new Date(lastDate)) / (1000 * 60 * 60 * 24))
            if (diffDays > 1) {
              // Streak verlopen, reset naar 0
              setStreak({ current: 0, longest: data.longest_streak })
            } else {
              setStreak({ current: data.current_streak, longest: data.longest_streak })
            }
          } else {
            setStreak({ current: 0, longest: 0 })
          }
        }
      } catch (err) {
        console.error('Streak laden mislukt:', err)
      }
      setLoading(false)
    }

    loadStreak()
  }, [userId])

  // Update streak na activiteit
  const recordActivity = useCallback(async () => {
    if (!userId) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    try {
      // Haal huidige streak op
      const { data: existing } = await supabase
        .from('reading_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (existing) {
        const lastDate = existing.last_activity_date
        
        // Al vandaag geregistreerd? Skip
        if (lastDate === todayStr) return

        const lastDateObj = lastDate ? new Date(lastDate) : null
        let newStreak = 1

        if (lastDateObj) {
          const diffDays = Math.floor((today - lastDateObj) / (1000 * 60 * 60 * 24))
          if (diffDays === 1) {
            // Gisteren actief = streak +1
            newStreak = existing.current_streak + 1
          }
          // diffDays > 1 = streak reset naar 1
        }

        const newLongest = Math.max(newStreak, existing.longest_streak)

        await supabase
          .from('reading_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: todayStr,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)

        setStreak({ current: newStreak, longest: newLongest })
      } else {
        // Eerste keer - maak record aan
        await supabase
          .from('reading_streaks')
          .insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: todayStr
          })

        setStreak({ current: 1, longest: 1 })
      }
    } catch (err) {
      console.error('Streak updaten mislukt:', err)
    }
  }, [userId])

  return { streak, loading, recordActivity }
}
