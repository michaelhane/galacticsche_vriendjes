import { useState, useEffect, useRef } from 'react'
import { SnowboardScene } from './SnowboardScene'
import { useDMT } from '../../../hooks/useDMT'
import { DMT_CONSTANTS } from './dmtWords'
import { ArrowLeft } from '../../shared/Icons'

/**
 * DMTResults - Resultaatscherm na een DMT sessie
 *
 * Toont WPM score, vergelijking met vorige sessies, staafgrafiek,
 * milestone voortgang en sterren beloning.
 *
 * @param {function} speak - TTS functie
 * @param {function} onBack - Terug naar dashboard
 * @param {function} addStars - Sterren toevoegen
 * @param {string} aviLevel - AVI niveau
 * @param {string} mode - 'practice' of 'test'
 * @param {object} results - Resultaten van DMTPractice of DMTTest
 * @param {function} onPlayAgain - Terug naar DMT menu
 */
export const DMTResults = ({ speak, onBack, addStars, aviLevel, mode, results, onPlayAgain }) => {
  const { saveSession, getSessionsForLevel, getBaseline, getMilestone } = useDMT()

  const [milestoneResult, setMilestoneResult] = useState(null)
  const [saved, setSaved] = useState(false)
  const [starsEarned, setStarsEarned] = useState(0)
  const [showStarsBounce, setShowStarsBounce] = useState(false)
  const [playHalfpipe, setPlayHalfpipe] = useState(false)
  const savedRef = useRef(false)

  const wpm = results?.wordsPerMinute || 0
  const isTest = mode === 'test'

  // Sessie opslaan bij mount (eenmalig)
  useEffect(() => {
    if (savedRef.current || !results) return
    savedRef.current = true

    const doSave = async () => {
      const sessionData = {
        mode,
        aviLevel,
        settings: {},
        results: {
          ...results,
          wpm: results.wordsPerMinute || 0
        }
      }

      const msResult = await saveSession(sessionData)
      setMilestoneResult(msResult)
      setSaved(true)

      // Bereken sterren
      let stars = isTest ? DMT_CONSTANTS.STARS_TEST : DMT_CONSTANTS.STARS_PRACTICE
      if (msResult?.isNewRecord) stars += DMT_CONSTANTS.STARS_RECORD
      if (msResult?.milestoneReached) stars += DMT_CONSTANTS.STARS_MILESTONE

      setStarsEarned(stars)
      addStars(stars)

      // Star bounce animatie
      setTimeout(() => setShowStarsBounce(true), 500)

      // Halfpipe animatie als milestone bereikt
      if (msResult?.milestoneReached) {
        setTimeout(() => setPlayHalfpipe(true), 1500)
      }
    }

    doSave()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Data voor vergelijking en grafiek
  const previousSessions = getSessionsForLevel(aviLevel, mode)
  // Exclude huidige sessie (die net is toegevoegd)
  const olderSessions = saved ? previousSessions.slice(1) : previousSessions
  const previousWpm = olderSessions.length > 0
    ? olderSessions[0]?.results?.wpm || olderSessions[0]?.results?.wordsPerMinute || 0
    : null
  const delta = previousWpm !== null ? Math.round((wpm - previousWpm) * 10) / 10 : null

  // Beste score ooit
  const allWpms = previousSessions.map(s => s.results?.wpm || s.results?.wordsPerMinute || 0)
  const isNewRecord = milestoneResult?.isNewRecord || false

  // Grafiek data: laatste 10 sessies (inclusief huidige)
  const chartSessions = previousSessions.slice(0, 10).reverse()
  const chartWpms = chartSessions.map(s => s.results?.wpm || s.results?.wordsPerMinute || 0)
  const maxWpm = Math.max(...chartWpms, 1)
  const baseline = getBaseline(aviLevel)
  const milestone = getMilestone(aviLevel)

  // Volgende milestone berekening
  const thresholds = DMT_CONSTANTS.MILESTONE_THRESHOLDS
  const currentMs = milestone?.currentMilestone || 0
  const nextMsTarget = currentMs < thresholds.length && baseline
    ? Math.round(baseline * (1 + thresholds[currentMs]) * 10) / 10
    : null
  const wpmToNext = nextMsTarget ? Math.round((nextMsTarget - wpm) * 10) / 10 : null

  // Datum formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  // TTS bij laden
  useEffect(() => {
    if (saved && wpm > 0) {
      const rounded = Math.round(wpm)
      const msg = isNewRecord
        ? `Wow! Nieuw record! ${rounded} woorden per minuut!`
        : `${rounded} woorden per minuut!`
      speak(msg)
    }
  }, [saved]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Geen resultaten beschikbaar.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-50">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sky-700 hover:text-sky-900 transition-colors"
        >
          <ArrowLeft size={24} />
          <span className="text-lg">Dashboard</span>
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        {/* Score Header */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-sky-600 mb-1">
            {Math.round(wpm * 10) / 10}
          </div>
          <div className="text-lg text-gray-500 mb-2">woorden per minuut</div>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            isTest
              ? 'bg-purple-100 text-purple-700'
              : 'bg-sky-100 text-sky-700'
          }`}>
            {isTest ? 'DMT Toets' : 'Oefenmodus'}
          </span>
        </div>

        {/* Kaart breakdown (alleen test modus) */}
        {isTest && results.cards && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {results.cards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-3 text-center shadow">
                <div className="text-xs text-gray-500 mb-1">Kaart {i + 1}</div>
                <div className="text-lg font-bold text-gray-800">
                  {card.wordsRead}
                </div>
                <div className="text-xs text-gray-400">woorden</div>
              </div>
            ))}
          </div>
        )}

        {/* Vergelijking met vorige sessie */}
        {delta !== null && (
          <div className="bg-white rounded-2xl p-4 shadow mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Vorige keer</div>
                <div className="text-lg font-semibold text-gray-700">
                  {Math.round(previousWpm * 10) / 10} w/m
                </div>
              </div>
              <div className="text-right">
                {delta > 0 ? (
                  <div className="text-lg font-bold text-emerald-600">
                    +{delta} sneller!
                  </div>
                ) : delta < 0 ? (
                  <div className="text-lg font-bold text-red-500">
                    {delta} langzamer
                  </div>
                ) : (
                  <div className="text-lg font-bold text-gray-500">
                    Gelijk!
                  </div>
                )}
              </div>
            </div>

            {/* Nieuw record badge */}
            {isNewRecord && (
              <div className="mt-3 flex items-center justify-center gap-2 bg-yellow-50 rounded-xl py-2">
                <span className="text-2xl animate-bounce">⭐</span>
                <span className="font-bold text-yellow-700">Nieuw record!</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</span>
              </div>
            )}
          </div>
        )}

        {/* Staafgrafiek (laatste 10 sessies) */}
        {chartSessions.length > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Voortgang</h3>
            <div className="relative h-32">
              {/* Baseline lijn */}
              {baseline && (
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-orange-300 z-10"
                  style={{ bottom: `${(baseline / maxWpm) * 100}%` }}
                >
                  <span className="absolute -top-4 right-0 text-xs text-orange-400">
                    {baseline}
                  </span>
                </div>
              )}

              {/* Bars */}
              <div className="flex items-end justify-between h-full gap-1">
                {chartWpms.map((w, i) => {
                  const isCurrentSession = i === chartWpms.length - 1
                  const heightPct = maxWpm > 0 ? (w / maxWpm) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isCurrentSession ? 'bg-sky-500' : 'bg-sky-200'
                        }`}
                        style={{
                          height: `${Math.max(heightPct, 4)}%`,
                          minHeight: '4px'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Datum labels */}
            <div className="flex justify-between mt-1">
              {chartSessions.map((s, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-[10px] text-gray-400">
                    {formatDate(s.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone voortgang */}
        <div className="bg-white rounded-2xl p-4 shadow mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Mijlpaal voortgang</h3>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">Mijlpaal</span>
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                style={{ width: `${((milestone?.currentMilestone || 0) / 4) * 100}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {milestone?.currentMilestone || 0}/4
            </span>
          </div>

          {/* Volgende milestone tekst */}
          {wpmToNext !== null && wpmToNext > 0 && (
            <p className="text-sm text-gray-500 mb-3">
              Nog {wpmToNext} w/m sneller voor de volgende truc!
            </p>
          )}

          {/* Snowboard Scene */}
          <SnowboardScene
            position={milestoneResult?.snowboardPosition ?? milestone?.snowboardPosition ?? 0}
            playHalfpipe={playHalfpipe}
            onHalfpipeComplete={() => setPlayHalfpipe(false)}
          />

          {/* Milestone bereikt bericht */}
          {milestoneResult?.milestoneReached && (
            <div className="mt-3 text-center bg-emerald-50 rounded-xl p-3">
              <span className="text-2xl">🎉</span>
              <p className="font-bold text-emerald-700">
                Nieuwe mijlpaal bereikt: {milestoneResult.newMilestone}/4!
              </p>
            </div>
          )}
        </div>

        {/* Sterren verdiend */}
        {starsEarned > 0 && (
          <div className={`bg-yellow-50 rounded-2xl p-4 shadow mb-6 text-center ${
            showStarsBounce ? 'animate-bounce' : ''
          }`}
            style={showStarsBounce ? { animationIterationCount: 3, animationDuration: '0.6s' } : {}}
          >
            <div className="text-4xl mb-1">⭐</div>
            <div className="text-2xl font-bold text-yellow-700">
              +{starsEarned} sterren!
            </div>
            <div className="text-sm text-yellow-600 mt-1">
              {isTest ? 'Toets' : 'Oefening'}: {isTest ? DMT_CONSTANTS.STARS_TEST : DMT_CONSTANTS.STARS_PRACTICE}
              {isNewRecord && ` + Record: ${DMT_CONSTANTS.STARS_RECORD}`}
              {milestoneResult?.milestoneReached && ` + Mijlpaal: ${DMT_CONSTANTS.STARS_MILESTONE}`}
            </div>
          </div>
        )}

        {/* Actie knoppen */}
        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className="w-full py-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-lg font-bold rounded-2xl transition-colors shadow-lg shadow-sky-200"
          >
            Opnieuw Spelen
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 bg-white hover:bg-gray-50 text-gray-600 text-base font-semibold rounded-2xl transition-colors border border-gray-200"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default DMTResults
