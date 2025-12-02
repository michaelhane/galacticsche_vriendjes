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

export const ProfileSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [age, setAge] = useState(null)
  const [grade, setGrade] = useState(null)
  const [interests, setInterests] = useState(['dinosaurussen', 'ruimte', 'dieren'])
  const [loading, setLoading] = useState(false)
  const { updateProfile } = useAuth()

  const toggleInterest = (id) => {
    setInterests(prev => {
      if (prev.includes(id)) {
        // Don't allow removing if only 1 interest left
        if (prev.length <= 1) return prev
        return prev.filter(i => i !== id)
      }
      // Max 5 interests
      if (prev.length >= 5) return prev
      return [...prev, id]
    })
  }

  const handleComplete = async () => {
    setLoading(true)
    const { error } = await updateProfile({
      display_name: name || 'Astronaut',
      age: age || 7,
      grade: grade || 3,
      interests: interests,
      stars: 20 // Start sterren
    })

    if (!error) {
      onComplete?.()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-[3rem] p-8 md:p-12 max-w-lg w-full shadow-2xl">
        
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
              {[5, 6, 7, 8, 9].map((a) => (
                <button
                  key={a}
                  onClick={() => setAge(a)}
                  className={`w-16 h-16 rounded-2xl text-2xl font-bold transition transform hover:scale-110 border-4 ${
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

        {/* Stap 4: Interesses */}
        {step === 4 && (
          <div className="text-center animate-in fade-in duration-500">
            <div className="text-6xl mb-6">💖</div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Bijna klaar!</h2>
            <p className="text-lg text-gray-600 mb-2">Waar hou je van?</p>
            <p className="text-sm text-gray-400 mb-6">Kies 1-5 dingen</p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {INTEREST_OPTIONS.map(({ id, label, icon }) => {
                const isSelected = interests.includes(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggleInterest(id)}
                    className={`p-3 rounded-xl text-left transition border-3 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-pink-100 border-pink-400 border-2'
                        : 'bg-white border-gray-200 border-2 hover:border-pink-200'
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
                onClick={() => setStep(3)}
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
