import { useState } from 'react'
import { SnowboardScene } from './SnowboardScene'
import { useDMT } from '../../../hooks/useDMT'
import { ArrowLeft } from '../../shared/Icons'

const AVI_LEVELS = [
  { value: 'start', label: 'Start' },
  { value: 'm3', label: 'M3' },
  { value: 'e3', label: 'E3' },
  { value: 'm4', label: 'M4' },
  { value: 'e4', label: 'E4' },
  { value: 'm5-e5', label: 'M5+' }
]

const WORD_COUNTS = [25, 50, 100]
const TIME_LIMITS = [
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' }
]

/**
 * DMTMenu - Hoofdmenu voor Snowboard Sprint
 * Kind kiest AVI niveau, oefenmodus of toets, en instellingen.
 */
export const DMTMenu = ({ speak, onBack, onStartPractice, onStartTest }) => {
  const { getMilestone, getBaseline, getSessionsForLevel } = useDMT()

  const [aviLevel, setAviLevel] = useState('e3')

  // Oefen instellingen
  const [practiceTab, setPracticeTab] = useState('words') // 'words' | 'time'
  const [wordCount, setWordCount] = useState(50)
  const [timeLimit, setTimeLimit] = useState(60)

  // Toets instellingen
  const [withParent, setWithParent] = useState(false)

  // Data ophalen
  const milestone = getMilestone(aviLevel)
  const baseline = getBaseline(aviLevel)
  const recentSessions = getSessionsForLevel(aviLevel)

  // Laatste sessie datum formattering
  const lastSession = recentSessions.length > 0 ? recentSessions[0] : null
  const lastDate = lastSession
    ? new Date(lastSession.createdAt).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short'
      })
    : null

  const handleStartPractice = () => {
    const settings = practiceTab === 'words'
      ? { wordCount }
      : { timeLimit }
    speak('Vrije Run')
    onStartPractice(aviLevel, settings)
  }

  const handleStartTest = () => {
    speak('DMT Toets')
    onStartTest(aviLevel, withParent)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={onBack}
          className="text-white/80 hover:text-white p-1 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">
          Snowboard Sprint
        </h1>
        <span className="text-3xl">🏂</span>
      </div>

      {/* Snowboard Scene (compact) */}
      <div className="px-4 mb-4">
        <SnowboardScene
          position={milestone?.snowboardPosition || 0}
          compact={true}
        />
      </div>

      {/* AVI Level selector */}
      <div className="px-4 mb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {AVI_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setAviLevel(level.value)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-semibold transition-all
                ${aviLevel === level.value
                  ? 'bg-sky-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-sky-300'
                }
              `}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode cards */}
      <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* --- Oefenen Card --- */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-4 flex items-center gap-3">
            <span className="text-3xl">⛷️</span>
            <div>
              <h2 className="text-lg font-bold text-white">Vrije Run</h2>
              <p className="text-sky-100 text-sm">Oefen op je eigen tempo</p>
            </div>
          </div>

          <div className="p-5">
            {/* Toggle: Woorden / Tijd */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setPracticeTab('words')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  practiceTab === 'words'
                    ? 'bg-white text-sky-700 shadow'
                    : 'text-gray-500'
                }`}
              >
                Aantal woorden
              </button>
              <button
                onClick={() => setPracticeTab('time')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  practiceTab === 'time'
                    ? 'bg-white text-sky-700 shadow'
                    : 'text-gray-500'
                }`}
              >
                Tijdslimiet
              </button>
            </div>

            {/* Woord count knoppen */}
            {practiceTab === 'words' && (
              <div className="flex gap-2 mb-4">
                {WORD_COUNTS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setWordCount(count)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      wordCount === count
                        ? 'bg-sky-500 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            )}

            {/* Tijdslimiet knoppen */}
            {practiceTab === 'time' && (
              <div className="flex gap-2 mb-4">
                {TIME_LIMITS.map((tl) => (
                  <button
                    key={tl.value}
                    onClick={() => setTimeLimit(tl.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      timeLimit === tl.value
                        ? 'bg-sky-500 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tl.label}
                  </button>
                ))}
              </div>
            )}

            {/* Start knop */}
            <button
              onClick={handleStartPractice}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
            >
              Start Oefenen
            </button>
          </div>
        </div>

        {/* --- DMT Toets Card --- */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 flex items-center gap-3">
            <span className="text-3xl">⏱️</span>
            <div>
              <h2 className="text-lg font-bold text-white">DMT Kaart</h2>
              <p className="text-purple-200 text-sm">Officiële leestoets</p>
            </div>
          </div>

          <div className="p-5">
            {/* Toggle: Zonder / Met ouder */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button
                onClick={() => setWithParent(false)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  !withParent
                    ? 'bg-white text-purple-700 shadow'
                    : 'text-gray-500'
                }`}
              >
                Zonder ouder
              </button>
              <button
                onClick={() => setWithParent(true)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  withParent
                    ? 'bg-white text-purple-700 shadow'
                    : 'text-gray-500'
                }`}
              >
                Met ouder
              </button>
            </div>

            {/* Beschrijving */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600 leading-relaxed">
              {withParent ? (
                <p>
                  Je ouder zit erbij en let op fouten. Lees de woorden hardop,
                  kolom voor kolom. 3 kaarten, 1 minuut per kaart.
                </p>
              ) : (
                <p>
                  Lees de woorden hardop en tik op elk woord dat je leest.
                  3 kaarten, 1 minuut per kaart.
                </p>
              )}
            </div>

            {/* Start knop */}
            <button
              onClick={handleStartTest}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
            >
              Start Toets
            </button>
          </div>
        </div>
      </div>

      {/* Stats sectie (alleen als er data is) */}
      {baseline !== null && (
        <div className="px-4 pb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <h3 className="text-white font-bold text-sm mb-3 uppercase tracking-wide">
              Jouw Statistieken
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Baseline */}
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">{baseline}</div>
                <div className="text-xs text-white/70">Baseline w/m</div>
              </div>

              {/* Best score */}
              {milestone?.bestScore && (
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-white">{milestone.bestScore}</div>
                  <div className="text-xs text-white/70">Beste score</div>
                </div>
              )}

              {/* Milestone */}
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {milestone?.currentMilestone || 0}/4
                </div>
                <div className="text-xs text-white/70">Mijlpaal</div>
              </div>

              {/* Laatste sessie */}
              {lastDate && (
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-white">{lastDate}</div>
                  <div className="text-xs text-white/70">Laatste keer</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DMTMenu
