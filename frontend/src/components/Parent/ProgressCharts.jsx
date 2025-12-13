import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

/**
 * ProgressCharts - Visualisatie van kind's voortgang voor ouders
 * Toont statistieken over gespeelde games, moeilijke woorden, etc.
 */
export const ProgressCharts = ({ userId, profile }) => {
  const [stats, setStats] = useState(null)
  const [difficultWords, setDifficultWords] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week') // week, month, all

  useEffect(() => {
    if (userId) {
      loadStats()
    }
  }, [userId, timeRange])

  const loadStats = async () => {
    setLoading(true)
    try {
      // Bepaal datum range
      const now = new Date()
      let startDate = new Date()
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (timeRange === 'month') {
        startDate.setDate(now.getDate() - 30)
      } else {
        startDate = new Date('2020-01-01') // All time
      }

      // Haal word_attempts op voor statistieken
      const { data: attempts, error: attemptsError } = await supabase
        .from('word_attempts')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })

      if (attemptsError) {
        console.error('Error loading attempts:', attemptsError)
        // Als de tabel niet bestaat, toon lege stats
        setStats({
          totalAttempts: 0,
          correctAttempts: 0,
          accuracy: 0,
          uniqueWords: 0,
          byGameType: {},
          streakDays: 0
        })
        setDifficultWords([])
        setRecentActivity([])
        setLoading(false)
        return
      }

      // Bereken statistieken
      const totalAttempts = attempts?.length || 0
      const correctAttempts = attempts?.filter(a => a.correct).length || 0
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

      // Unieke woorden
      const uniqueWords = new Set(attempts?.map(a => a.word) || []).size

      // Per game type
      const byGameType = {}
      attempts?.forEach(a => {
        if (!byGameType[a.game_type]) {
          byGameType[a.game_type] = { total: 0, correct: 0 }
        }
        byGameType[a.game_type].total++
        if (a.correct) byGameType[a.game_type].correct++
      })

      // Streak berekening (hoeveel dagen op rij gespeeld)
      const playDates = new Set(
        attempts?.map(a => new Date(a.timestamp).toDateString()) || []
      )
      let streakDays = 0
      const today = new Date()
      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today)
        checkDate.setDate(today.getDate() - i)
        if (playDates.has(checkDate.toDateString())) {
          streakDays++
        } else if (i > 0) {
          break // Streak gebroken
        }
      }

      setStats({
        totalAttempts,
        correctAttempts,
        accuracy,
        uniqueWords,
        byGameType,
        streakDays
      })

      // Moeilijke woorden (meest fout)
      const wordErrors = {}
      attempts?.forEach(a => {
        if (!a.correct) {
          wordErrors[a.word] = (wordErrors[a.word] || 0) + 1
        }
      })
      const difficult = Object.entries(wordErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word, count]) => ({ word, errorCount: count }))

      setDifficultWords(difficult)

      // Recente activiteit (laatste 7 dagen)
      const activityByDay = {}
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toDateString()
        last7Days.push(dateStr)
        activityByDay[dateStr] = { total: 0, correct: 0 }
      }

      attempts?.forEach(a => {
        const dateStr = new Date(a.timestamp).toDateString()
        if (activityByDay[dateStr]) {
          activityByDay[dateStr].total++
          if (a.correct) activityByDay[dateStr].correct++
        }
      })

      setRecentActivity(
        last7Days.map(dateStr => ({
          date: dateStr,
          ...activityByDay[dateStr]
        }))
      )

    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Game type namen voor weergave
  const gameTypeNames = {
    code_kraken: 'Code Kraken',
    troll: 'Brutelaars',
    jumper: 'Lettergreep Springer',
    stories: 'Verhalen'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p className="text-gray-500">Statistieken laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header met kind info */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="text-5xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full" />
            ) : '👤'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.display_name || 'Kind'}</h2>
            <p className="opacity-90">
              Groep {profile?.grade || '?'} • AVI niveau {profile?.avi_level || 'E3'}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl font-bold">{stats?.streakDays || 0}</div>
            <div className="text-sm opacity-90">dagen streak 🔥</div>
          </div>
        </div>
      </div>

      {/* Time range selector */}
      <div className="flex gap-2">
        {[
          { value: 'week', label: 'Deze week' },
          { value: 'month', label: 'Deze maand' },
          { value: 'all', label: 'Alles' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setTimeRange(option.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors
              ${timeRange === option.value
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.accuracy || 0}%</div>
          <div className="text-sm text-gray-500">Nauwkeurigheid</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-3xl mb-2">📝</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.totalAttempts || 0}</div>
          <div className="text-sm text-gray-500">Woorden geoefend</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats?.correctAttempts || 0}</div>
          <div className="text-sm text-gray-500">Correct</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-3xl mb-2">📚</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.uniqueWords || 0}</div>
          <div className="text-sm text-gray-500">Unieke woorden</div>
        </div>
      </div>

      {/* Activity chart (simple bar visualization) */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Activiteit afgelopen 7 dagen</h3>

        {recentActivity.every(d => d.total === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            Nog geen activiteit in deze periode
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2 h-32">
            {recentActivity.map((day, i) => {
              const maxTotal = Math.max(...recentActivity.map(d => d.total), 1)
              const height = (day.total / maxTotal) * 100
              const correctHeight = day.total > 0 ? (day.correct / day.total) * height : 0

              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100px' }}>
                    {/* Total bar */}
                    <div
                      className="absolute bottom-0 w-full bg-indigo-200 rounded-t transition-all"
                      style={{ height: `${height}%` }}
                    >
                      {/* Correct portion */}
                      <div
                        className="absolute bottom-0 w-full bg-green-400 rounded-t transition-all"
                        style={{ height: `${day.total > 0 ? (day.correct / day.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-200 rounded" />
            <span className="text-gray-600">Totaal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded" />
            <span className="text-gray-600">Correct</span>
          </div>
        </div>
      </div>

      {/* Per game stats */}
      {stats?.byGameType && Object.keys(stats.byGameType).length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🎮 Per spel</h3>
          <div className="space-y-3">
            {Object.entries(stats.byGameType).map(([gameType, data]) => {
              const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
              return (
                <div key={gameType} className="flex items-center gap-4">
                  <div className="w-40 font-medium text-gray-700">
                    {gameTypeNames[gameType] || gameType}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-full rounded-full transition-all"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <div className="w-20 text-right">
                    <span className="font-bold text-gray-800">{accuracy}%</span>
                    <span className="text-gray-400 text-sm ml-1">({data.total})</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Difficult words */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          ⚠️ Woorden om extra te oefenen
        </h3>

        {difficultWords.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <div className="text-4xl mb-2">🌟</div>
            Geen moeilijke woorden gevonden - goed bezig!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {difficultWords.map((item, i) => (
              <div
                key={item.word}
                className="flex items-center justify-between p-2 bg-red-50 rounded-lg"
              >
                <span className="font-medium text-gray-800">{item.word}</span>
                <span className="text-red-500 text-sm">{item.errorCount}x fout</span>
              </div>
            ))}
          </div>
        )}

        {difficultWords.length > 0 && (
          <p className="text-sm text-gray-500 mt-4">
            💡 Tip: Voeg deze woorden toe als weekwoorden voor extra oefening!
          </p>
        )}
      </div>
    </div>
  )
}

export default ProgressCharts
