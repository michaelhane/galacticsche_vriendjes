import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

// Interest options for child personalization
const INTEREST_OPTIONS = [
  { id: 'dinosaurussen', label: 'Dinosaurussen', icon: '🦕' },
  { id: 'ruimte', label: 'Ruimte', icon: '🚀' },
  { id: 'dieren', label: 'Dieren', icon: '🦁' },
  { id: 'voetbal', label: 'Voetbal', icon: '⚽' },
  { id: 'autos', label: "Auto's", icon: '🚗' },
  { id: 'prinsessen', label: 'Prinsessen', icon: '👸' },
  { id: 'superhelden', label: 'Superhelden', icon: '🦸' },
  { id: 'natuur', label: 'Natuur', icon: '🌳' },
  { id: 'robots', label: 'Robots', icon: '🤖' },
  { id: 'piraten', label: 'Piraten', icon: '🏴‍☠️' }
]

// Pet options for personalization
const PET_OPTIONS = [
  { type: 'hond', label: 'Hond', icon: '🐕' },
  { type: 'kat', label: 'Kat', icon: '🐱' },
  { type: 'konijn', label: 'Konijn', icon: '🐰' },
  { type: 'hamster', label: 'Hamster', icon: '🐹' },
  { type: 'vis', label: 'Vis', icon: '🐠' },
  { type: 'vogel', label: 'Vogel', icon: '🐦' },
  { type: 'schildpad', label: 'Schildpad', icon: '🐢' },
  { type: 'geen', label: 'Geen huisdier', icon: '🚫' }
]

// Color options
const COLOR_OPTIONS = [
  { id: 'blauw', label: 'Blauw', class: 'bg-blue-500' },
  { id: 'paars', label: 'Paars', class: 'bg-purple-500' },
  { id: 'roze', label: 'Roze', class: 'bg-pink-500' },
  { id: 'rood', label: 'Rood', class: 'bg-red-500' },
  { id: 'oranje', label: 'Oranje', class: 'bg-orange-500' },
  { id: 'geel', label: 'Geel', class: 'bg-yellow-400' },
  { id: 'groen', label: 'Groen', class: 'bg-green-500' },
  { id: 'cyaan', label: 'Turquoise', class: 'bg-cyan-500' }
]

// Popular heroes/idols
const HERO_SUGGESTIONS = [
  'Spiderman', 'Batman', 'Elsa', 'Mario', 'Sonic',
  'Minecraft Steve', 'Pikachu', 'Iron Man', 'Wonder Woman'
]

export const ProfileSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState(null)
  const [grade, setGrade] = useState(null)
  const [interests, setInterests] = useState(['dinosaurussen', 'ruimte', 'dieren'])
  const [petType, setPetType] = useState(null)
  const [petName, setPetName] = useState('')
  const [favoriteColor, setFavoriteColor] = useState(null)
  const [idol, setIdol] = useState('')
  const [loading, setLoading] = useState(false)
  const { updateProfile } = useAuth()

  const totalSteps = 7

  const toggleInterest = (id) => {
    setInterests(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev
        return prev.filter(i => i !== id)
      }
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleComplete = async () => {
    setLoading(true)

    // Build pet_info object
    const petInfo = petType && petType !== 'geen' ? {
      type: petType,
      name: petName || PET_OPTIONS.find(p => p.type === petType)?.label || 'Huisdier'
    } : null

    const { error } = await updateProfile({
      display_name: name || 'Astronaut',
      age: age || 7,
      grade: grade || 3,
      interests: interests,
      pet_info: petInfo,
      favorite_color: favoriteColor,
      idol: idol || null,
      stars: 20 // Start sterren
    })

    if (!error) {
      onComplete?.()
    }
    setLoading(false)
  }

  // Progress indicator
  const ProgressBar = () => (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-gray-200'
          }`}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-[3rem] p-8 md:p-12 max-w-lg w-full shadow-2xl">
        <ProgressBar />

        {/* Stap 1: Naam */}
        {step === 1 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-8xl mb-6 animate-float">👋</div>
            <h1 className="text-3xl font-bold text-indigo-900 mb-4">
              Welkom Astronaut!
            </h1>
            <p className="text-lg text-gray-600 mb-8">Wat is je naam?</p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Typ je naam..."
              className="w-full text-2xl p-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-center mb-6"
              maxLength={20}
              autoFocus
            />

            <button
              onClick={() => setStep(2)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-lg transition transform hover:scale-105"
            >
              Volgende →
            </button>
          </div>
        )}

        {/* Stap 2: Leeftijd */}
        {step === 2 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">🎂</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">
              Hoi {name || 'Astronaut'}!
            </h2>
            <p className="text-lg text-gray-600 mb-8">Hoe oud ben je?</p>

            <div className="flex justify-center gap-4 mb-8">
              {[5, 6, 7, 8, 9, 10].map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className={`w-14 h-14 rounded-2xl text-xl font-bold transition transform hover:scale-110 border-4 ${
                    age === a
                      ? 'bg-indigo-500 text-white border-indigo-600 scale-110'
                      : 'bg-white border-indigo-200 text-indigo-900 hover:border-indigo-400'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep(1)}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!age}
                className={`px-8 py-3 rounded-xl font-bold transition ${
                  age
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Stap 3: Groep */}
        {step === 3 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">🏫</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Super!</h2>
            <p className="text-lg text-gray-600 mb-8">In welke groep zit je?</p>

            <div className="flex flex-col gap-4 mb-8">
              {[
                { g: 3, label: 'Groep 3', desc: 'Net beginnen met lezen', icon: '🌱' },
                { g: 4, label: 'Groep 4', desc: 'Al best goed!', icon: '🌿' },
                { g: 5, label: 'Groep 5+', desc: 'Leeskampioen', icon: '🌳' }
              ].map(({ g, label, desc, icon }) => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`p-4 rounded-2xl text-left transition border-4 flex items-center gap-4 ${
                    grade === g
                      ? 'bg-indigo-100 border-indigo-500'
                      : 'bg-white border-indigo-100 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-4xl">{icon}</span>
                  <div>
                    <div className="font-bold text-xl text-indigo-900">{label}</div>
                    <div className="text-sm text-gray-500">{desc}</div>
                  </div>
                  {grade === g && (
                    <span className="ml-auto text-2xl">✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep(2)}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!grade}
                className={`px-8 py-3 rounded-xl font-bold transition ${
                  grade
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Stap 4: Favoriete kleur */}
        {step === 4 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Mooi!</h2>
            <p className="text-lg text-gray-600 mb-8">Wat is je favoriete kleur?</p>

            <div className="grid grid-cols-4 gap-3 mb-8">
              {COLOR_OPTIONS.map(({ id, label, class: colorClass }) => (
                <button
                  key={id}
                  onClick={() => setFavoriteColor(id)}
                  className={`aspect-square rounded-2xl transition transform hover:scale-110 ${colorClass} ${
                    favoriteColor === id
                      ? 'ring-4 ring-offset-2 ring-indigo-500 scale-110'
                      : ''
                  }`}
                  title={label}
                />
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep(3)}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(5)}
                disabled={!favoriteColor}
                className={`px-8 py-3 rounded-xl font-bold transition ${
                  favoriteColor
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Stap 5: Huisdier */}
        {step === 5 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">🐾</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Leuk!</h2>
            <p className="text-lg text-gray-600 mb-6">Heb je een huisdier?</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {PET_OPTIONS.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => setPetType(type)}
                  className={`p-3 rounded-xl transition border-2 flex flex-col items-center gap-1 ${
                    petType === type
                      ? 'bg-pink-100 border-pink-400'
                      : 'bg-white border-gray-200 hover:border-pink-200'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>

            {petType && petType !== 'geen' && (
              <div className="mb-6 animate-in fade-in duration-300">
                <p className="text-sm text-gray-600 mb-2">Hoe heet je {PET_OPTIONS.find(p => p.type === petType)?.label.toLowerCase()}?</p>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Naam van je huisdier..."
                  className="w-full text-lg p-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-center"
                  maxLength={20}
                />
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep(4)}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(6)}
                disabled={!petType}
                className={`px-8 py-3 rounded-xl font-bold transition ${
                  petType
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Stap 6: Held/Idool */}
        {step === 6 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">🦸</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Cool!</h2>
            <p className="text-lg text-gray-600 mb-6">Wie is je favoriete held of personage?</p>

            <input
              type="text"
              value={idol}
              onChange={(e) => setIdol(e.target.value)}
              placeholder="bijv. Spiderman, Elsa..."
              className="w-full text-lg p-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none text-center mb-4"
              maxLength={30}
            />

            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {HERO_SUGGESTIONS.map(hero => (
                <button
                  key={hero}
                  onClick={() => setIdol(hero)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    idol === hero
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {hero}
                </button>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep(5)}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ← Terug
              </button>
              <button
                onClick={() => setStep(7)}
                className="px-8 py-3 rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 text-white transition"
              >
                Volgende →
              </button>
            </div>
          </div>
        )}

        {/* Stap 7: Interesses */}
        {step === 7 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">💖</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Laatste vraag!</h2>
            <p className="text-lg text-gray-600 mb-2">Waar hou je van?</p>
            <p className="text-sm text-gray-400 mb-6">Kies 1-5 dingen</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {INTEREST_OPTIONS.map(({ id, label, icon }) => {
                const isSelected = interests.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggleInterest(id)}
                    className={`p-3 rounded-xl text-left transition border-2 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-pink-100 border-pink-400'
                        : 'bg-white border-gray-200 hover:border-pink-200'
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <span className={`font-bold text-sm ${isSelected ? 'text-pink-700' : 'text-gray-700'}`}>
                      {label}
                    </span>
                    {isSelected && <span className="ml-auto">✓</span>}
                  </button>
                )
              })}
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Geselecteerd: {interests.length}/5
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setStep(6)}
                className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              >
                ← Terug
              </button>
              <button
                onClick={handleComplete}
                disabled={interests.length === 0 || loading}
                className={`px-8 py-4 rounded-2xl text-xl font-bold transition transform hover:scale-105 ${
                  interests.length > 0 && !loading
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? '🌀 Even wachten...' : '🚀 Start Avontuur!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
