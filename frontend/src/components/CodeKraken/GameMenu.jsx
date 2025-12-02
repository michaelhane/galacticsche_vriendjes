import { useState, useEffect } from 'react'
import { codeKrakenLevels, STARS_PER_WORD, STARS_LEVEL_BONUS } from '../../data/codeKrakenLevels'
import { ArrowLeft, Lock, Sparkles } from '../shared/Icons'
import { SyllableGame } from './SyllableGame'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Thema opties voor nieuwe levels
const THEMES = [
  { id: 'dieren', label: 'Dieren', icon: '🦁' },
  { id: 'eten', label: 'Eten', icon: '🍕' },
  { id: 'sport', label: 'Sport', icon: '⚽' },
  { id: 'natuur', label: 'Natuur', icon: '🌳' },
  { id: 'school', label: 'School', icon: '📚' },
  { id: 'vakantie', label: 'Vakantie', icon: '🏖️' }
]

export const GameMenu = ({
  onBack,
  speak,
  addStars,
  completedLevels,
  isLevelUnlocked,
  onLevelComplete
}) => {
  const [activeLevel, setActiveLevel] = useState(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedLevels, setGeneratedLevels] = useState([])
  const [generating, setGenerating] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [syllableCount, setSyllableCount] = useState(2)
  const [error, setError] = useState(null)

  // Load generated levels from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('generatedCodeKrakenLevels')
    if (saved) {
      setGeneratedLevels(JSON.parse(saved))
    }
  }, [])

  // Save generated levels to localStorage
  const saveGeneratedLevels = (levels) => {
    localStorage.setItem('generatedCodeKrakenLevels', JSON.stringify(levels))
    setGeneratedLevels(levels)
  }

  // Check if all base levels are completed
  const allBaseLevelsCompleted = codeKrakenLevels.every(level =>
    completedLevels.includes(level.id)
  )

  // Generate new level
  const generateNewLevel = async () => {
    if (!selectedTheme) return

    setGenerating(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/generate-syllable-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllableCount,
          theme: selectedTheme,
          gradeLevel: 3,
          quantity: 5
        })
      })

      if (!response.ok) throw new Error('Genereren mislukt')

      const data = await response.json()

      const newLevel = {
        id: `gen-${Date.now()}`,
        title: `Bonus: ${THEMES.find(t => t.id === selectedTheme)?.label}`,
        desc: `${syllableCount} Lettergrepen (AI)`,
        words: data.words,
        generated: true
      }

      const updated = [...generatedLevels, newLevel]
      saveGeneratedLevels(updated)
      setShowGenerator(false)
      setSelectedTheme(null)
      speak(`Nieuw level gemaakt! ${newLevel.title}`)
    } catch (err) {
      setError('Oeps! Probeer opnieuw.')
      console.error(err)
    }

    setGenerating(false)
  }

  // Delete generated level
  const deleteGeneratedLevel = (levelId) => {
    const updated = generatedLevels.filter(l => l.id !== levelId)
    saveGeneratedLevels(updated)
  }

  const handleLevelComplete = (levelId) => {
    const starsEarned = STARS_LEVEL_BONUS
    onLevelComplete(levelId, starsEarned)
    addStars(starsEarned)
  }

  // Find level data (base or generated)
  const findLevelData = (levelId) => {
    if (typeof levelId === 'number') {
      return codeKrakenLevels[levelId]
    }
    return generatedLevels.find(l => l.id === levelId)
  }

  // Als een level actief is, toon de game
  if (activeLevel !== null) {
    const levelData = findLevelData(activeLevel)
    return (
      <SyllableGame
        levelData={levelData}
        onBack={() => setActiveLevel(null)}
        addStars={addStars}
        speak={speak}
        onLevelComplete={() => handleLevelComplete(activeLevel)}
      />
    )
  }

  // Generator UI
  if (showGenerator) {
    return (
      <div className="page-transition">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowGenerator(false)}
            className="bg-white/50 p-2 rounded-full hover:bg-white/70 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">Nieuw Level Maken</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-bold mb-4">Kies een thema:</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-xl text-left transition flex items-center gap-3 ${
                  selectedTheme === theme.id
                    ? 'bg-emerald-100 border-2 border-emerald-400'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <span className="text-2xl">{theme.icon}</span>
                <span className="font-bold">{theme.label}</span>
              </button>
            ))}
          </div>

          <h3 className="font-bold mb-4">Aantal lettergrepen:</h3>
          <div className="flex gap-3 mb-6">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => setSyllableCount(num)}
                className={`px-6 py-3 rounded-xl font-bold transition ${
                  syllableCount === num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}

          <button
            onClick={generateNewLevel}
            disabled={!selectedTheme || generating}
            className={`w-full py-4 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 ${
              !selectedTheme || generating
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {generating ? (
              <>
                <span className="animate-spin">🌀</span>
                Bezig met maken...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Maak Level!
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-transition">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="bg-white/50 p-2 rounded-full hover:bg-white/70 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Kies je Missie</h2>
      </div>

      <div className="grid gap-4">
        {/* Base levels */}
        {codeKrakenLevels.map((level) => {
          const unlocked = isLevelUnlocked(level.id)
          const completed = completedLevels.includes(level.id)

          return (
            <button
              key={level.id}
              onClick={() => unlocked && setActiveLevel(level.id)}
              disabled={!unlocked}
              className={`
                p-6 rounded-2xl text-left transition
                flex items-center justify-between group
                ${unlocked
                  ? 'bg-white hover:bg-emerald-50 shadow-sm border-2 border-emerald-100 hover:border-emerald-300'
                  : 'bg-gray-100 opacity-60 border-2 border-transparent cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {completed && <span className="text-2xl">✅</span>}
                <div>
                  <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                    {level.title}
                    {!unlocked && <Lock size={16} />}
                  </h3>
                  <p className="opacity-70">{level.desc}</p>
                </div>
              </div>
              {unlocked && !completed && (
                <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                  Start
                </div>
              )}
            </button>
          )
        })}

        {/* Generated levels */}
        {generatedLevels.map((level) => (
          <div
            key={level.id}
            className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm border-2 border-purple-200 flex items-center justify-between"
          >
            <button
              onClick={() => setActiveLevel(level.id)}
              className="flex items-center gap-4 text-left flex-1"
            >
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-bold text-xl mb-1">{level.title}</h3>
                <p className="opacity-70">{level.desc}</p>
              </div>
            </button>
            <button
              onClick={() => deleteGeneratedLevel(level.id)}
              className="text-red-400 hover:text-red-600 p-2"
              title="Verwijder level"
            >
              🗑️
            </button>
          </div>
        ))}

        {/* Generate more button - shown when all base levels completed */}
        {allBaseLevelsCompleted && (
          <button
            onClick={() => setShowGenerator(true)}
            className="p-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-white shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
          >
            <Sparkles size={24} />
            <span className="font-bold text-xl">Maak Nieuw Level!</span>
          </button>
        )}
      </div>
    </div>
  )
}
