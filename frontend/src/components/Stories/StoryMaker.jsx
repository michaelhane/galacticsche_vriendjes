import { useState, useEffect } from 'react'
import { ArrowLeft, Sparkles } from '../shared/Icons'
import { supabase } from '../../supabaseClient'
import { useAuth } from '../../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || ''

export const StoryMaker = ({ onBack, speak, unlockedItems, gradeLevel, onStoryGenerated }) => {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [savedStories, setSavedStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)

  // Laad opgeslagen verhalen
  useEffect(() => {
    const loadSavedStories = async () => {
      if (!user?.id) {
        setLoadingStories(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('generated_stories')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (!error && data) {
          setSavedStories(data)
        }
      } catch (err) {
        console.error('Verhalen laden mislukt:', err)
      }
      setLoadingStories(false)
    }
    loadSavedStories()
  }, [user?.id])
  const [hero, setHero] = useState('')
  const [place, setPlace] = useState('')
  const [item, setItem] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rolling, setRolling] = useState(false)

  // Check of gebruiker de ToVer-Dobbelsteen heeft
  const hasDice = unlockedItems?.includes('randomizer')

  const heroes = ['👦 Jongen', '👧 Meisje', '🐕 Hond', '🐱 Kat', '🤖 Robot', '👽 Alien']
  const places = ['🌙 Maan', '🏰 Kasteel', '🌲 Bos', '🏖️ Strand', '🚀 Ruimte', '🎪 Circus']
  const items = ['🔮 Toverstaf', '🗝️ Sleutel', '📦 Doos', '🎈 Ballon', '⭐ Ster', '🍪 Koekje']

  const generateStory = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/generate-story`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero: hero.split(' ')[1],
          place: place.split(' ')[1],
          item: item.split(' ')[1],
          gradeLevel
        })
      })

      if (!response.ok) throw new Error('Verhaal maken mislukt')

      const story = await response.json()
      onStoryGenerated(story)
    } catch (err) {
      setError('Oeps! Het verhaal maken lukte niet. Probeer opnieuw.')
      console.error(err)
    }

    setLoading(false)
  }

  // Dobbel een willekeurige keuze
  const rollDice = (options, onSelect) => {
    setRolling(true)
    speak('Dobbelen!')
    let count = 0
    const interval = setInterval(() => {
      const randomOption = options[Math.floor(Math.random() * options.length)]
      onSelect(randomOption)
      count++
      if (count >= 10) {
        clearInterval(interval)
        setRolling(false)
        const finalOption = options[Math.floor(Math.random() * options.length)]
        onSelect(finalOption)
        speak(finalOption.split(' ')[1])
      }
    }, 100)
  }

  const ChoiceGrid = ({ options, selected, onSelect, label }) => (
    <div>
      <p className="text-lg font-bold mb-4 text-center">{label}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {options.map(option => (
          <button
            key={option}
            onClick={() => {
              onSelect(option)
              speak(option.split(' ')[1])
            }}
            className={`
              p-4 rounded-2xl text-2xl transition transform hover:scale-105
              ${selected === option
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white hover:bg-indigo-50 border-2 border-indigo-100'
              }
            `}
          >
            {option}
          </button>
        ))}
        {hasDice && (
          <button
            onClick={() => rollDice(options, onSelect)}
            disabled={rolling}
            className={`
              p-4 rounded-2xl text-2xl transition transform hover:scale-105
              bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-2 border-yellow-300
              ${rolling ? 'animate-spin' : 'hover:from-yellow-500 hover:to-orange-600'}
            `}
          >
            🎲 Dobbel!
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="page-transition max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="bg-white/50 p-2 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Verhalen Fabriek</h2>
      </div>

      {/* Opgeslagen verhalen */}
      {savedStories.length > 0 && (
        <div className="bg-white/80 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-lg mb-3">Mijn Verhalen</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {savedStories.map(story => (
              <button
                key={story.id}
                onClick={() => onStoryGenerated(story)}
                className="flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-xl hover:shadow-md transition min-w-[120px]"
              >
                <div className="text-2xl mb-1">{story.hero?.includes('Hond') ? '🐕' : story.hero?.includes('Kat') ? '🐱' : story.hero?.includes('Robot') ? '🤖' : '👦'}</div>
                <div className="text-sm font-medium truncate">{story.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition ${
                s <= step ? 'bg-indigo-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <ChoiceGrid
            options={heroes}
            selected={hero}
            onSelect={setHero}
            label="Kies je hoofdpersoon:"
          />
        )}

        {step === 2 && (
          <ChoiceGrid
            options={places}
            selected={place}
            onSelect={setPlace}
            label="Waar speelt het verhaal?"
          />
        )}

        {step === 3 && (
          <ChoiceGrid
            options={items}
            selected={item}
            onSelect={setItem}
            label="Wat vindt de hoofdpersoon?"
          />
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
            >
              ← Terug
            </button>
          )}

          <div className="ml-auto">
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={
                  (step === 1 && !hero) ||
                  (step === 2 && !place)
                }
                className={`
                  px-6 py-3 rounded-xl font-bold transition
                  ${(step === 1 && hero) || (step === 2 && place)
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                Volgende →
              </button>
            ) : (
              <button
                onClick={generateStory}
                disabled={!item || loading}
                className={`
                  px-8 py-4 rounded-2xl font-bold text-lg transition flex items-center gap-2
                  ${item && !loading
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {loading ? (
                  <>
                    <span className="animate-spin">🌀</span>
                    Verhaal maken...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Maak Verhaal!
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
