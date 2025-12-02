import { useState, useEffect, useRef } from 'react'
import { trollWords, TROLL_STARS_REWARD } from '../../data/trollWords'
import { ArrowLeft, Volume2, Info, Sparkles } from '../shared/Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Geluidseffecten met Web Audio API
const createFartSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Meerdere oscillators voor rijker scheetgeluid
    const createFartOsc = (freq, delay, duration) => {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      const filter = audioContext.createBiquadFilter()

      filter.type = 'lowpass'
      filter.frequency.value = 200

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(audioContext.destination)

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, audioContext.currentTime + delay)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, audioContext.currentTime + delay + duration)

      gain.gain.setValueAtTime(0, audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration)

      osc.start(audioContext.currentTime + delay)
      osc.stop(audioContext.currentTime + delay + duration)
    }

    // Bubbelig scheetgeluid
    createFartOsc(100, 0, 0.15)
    createFartOsc(80, 0.1, 0.2)
    createFartOsc(60, 0.25, 0.25)
    createFartOsc(90, 0.4, 0.15)
    createFartOsc(50, 0.5, 0.3)

  } catch (e) {
    console.log('Audio not supported')
  }
}

const createExplosionSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()

    // Explosie = witte ruis + lage dreun
    const bufferSize = audioContext.sampleRate * 0.8
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
    }

    const noise = audioContext.createBufferSource()
    noise.buffer = buffer

    const noiseGain = audioContext.createGain()
    noiseGain.gain.setValueAtTime(0.6, audioContext.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8)

    noise.connect(noiseGain)
    noiseGain.connect(audioContext.destination)

    // Lage dreun
    const oscillator = audioContext.createOscillator()
    const oscGain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + 0.5)
    oscGain.gain.setValueAtTime(0.7, audioContext.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.connect(oscGain)
    oscGain.connect(audioContext.destination)

    noise.start()
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.8)
  } catch (e) {
    console.log('Audio not supported')
  }
}

// Grappige trage mannenstem voor KABOEM
const speakSlowDeep = (text) => {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'nl-NL'
  utterance.rate = 0.4  // Heel langzaam
  utterance.pitch = 0.3 // Hele lage stem
  utterance.volume = 1

  // Probeer een mannenstem te vinden
  const voices = speechSynthesis.getVoices()
  const dutchMale = voices.find(v => v.lang.includes('nl') && v.name.toLowerCase().includes('male'))
  const anyMale = voices.find(v => v.name.toLowerCase().includes('male'))
  const dutchVoice = voices.find(v => v.lang.includes('nl'))

  utterance.voice = dutchMale || anyMale || dutchVoice || voices[0]

  speechSynthesis.speak(utterance)
}

// Explosie deeltjes component
const ExplosionParticles = () => {
  const particles = ['💥', '✨', '⭐', '💫', '🌟', '💚', '🟢', '🤢']
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * 360
        const particle = particles[i % particles.length]
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 text-2xl animate-explosion-particle"
            style={{
              '--angle': `${angle}deg`,
              '--delay': `${i * 0.02}s`,
              animationDelay: `${i * 0.02}s`,
            }}
          >
            {particle}
          </div>
        )
      })}
    </div>
  )
}

// SVG Troll component - van originele HTML, wordt groter als je ingedrukt houdt
const Troll = ({ children, inflation, isExploding, showFart, onStartHold, onEndHold }) => {
  const scale = 1 + (inflation / 100) * 0.8

  // Kleur verandert naarmate de trol opblaast
  const bodyColor = inflation > 80 ? '#ef4444' : inflation > 50 ? '#f97316' : '#84cc16'
  const bellyColor = inflation > 80 ? '#fca5a5' : inflation > 50 ? '#fdba74' : '#bef264'
  const earColor = inflation > 80 ? '#dc2626' : inflation > 50 ? '#ea580c' : '#65a30d'

  return (
    <div className="relative select-none flex flex-col items-center">
      {/* Explosie deeltjes */}
      {isExploding && <ExplosionParticles />}

      {/* Explosie flash */}
      {isExploding && (
        <div className="absolute inset-0 -m-8 bg-yellow-300 rounded-full animate-explosion-flash z-10" />
      )}

      <div
        onMouseDown={onStartHold}
        onMouseUp={onEndHold}
        onMouseLeave={onEndHold}
        onTouchStart={onStartHold}
        onTouchEnd={onEndHold}
        className={`
          relative cursor-pointer transition-transform duration-100
          ${isExploding ? 'animate-explode-dramatic' : ''}
          ${inflation > 80 ? 'animate-vibrate' : ''}
        `}
        style={{ transform: isExploding ? undefined : `scale(${scale})` }}
      >
        <svg viewBox="0 0 100 120" className="w-28 h-32">
          {/* Oren */}
          <ellipse cx="15" cy="30" rx="12" ry="18" fill={earColor}/>
          <ellipse cx="85" cy="30" rx="12" ry="18" fill={earColor}/>
          <ellipse cx="15" cy="30" rx="6" ry="10" fill="#fecaca"/>
          <ellipse cx="85" cy="30" rx="6" ry="10" fill="#fecaca"/>

          {/* Lichaam */}
          <ellipse cx="50" cy="75" rx="40" ry="38" fill={bodyColor}/>
          {/* Buik */}
          <ellipse cx="50" cy="80" rx="28" ry="25" fill={bellyColor}/>

          {/* Hoofd */}
          <ellipse cx="50" cy="40" rx="35" ry="32" fill={bodyColor}/>

          {/* Wenkbrauwen (boos) */}
          <path d="M 25 22 L 40 28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
          <path d="M 75 22 L 60 28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>

          {/* Ogen */}
          <circle cx="35" cy="38" r="10" fill="white"/>
          <circle cx="65" cy="38" r="10" fill="white"/>
          <circle cx="35" cy="40" r="5" fill="#1a1a1a"/>
          <circle cx="65" cy="40" r="5" fill="#1a1a1a"/>
          {/* Glans */}
          <circle cx="33" cy="37" r="2" fill="white"/>
          <circle cx="63" cy="37" r="2" fill="white"/>

          {/* Neus */}
          <ellipse cx="50" cy="48" rx="8" ry="6" fill={earColor}/>
          <circle cx="46" cy="48" r="2" fill="#1a1a1a"/>
          <circle cx="54" cy="48" r="2" fill="#1a1a1a"/>

          {/* Mond - wordt groter als opgeblazen */}
          {inflation > 50 ? (
            <ellipse cx="50" cy="62" rx="12" ry="8" fill="#1a1a1a"/>
          ) : (
            <path d="M 38 60 Q 50 70 62 60" stroke="#1a1a1a" strokeWidth="3" fill="none"/>
          )}

          {/* Tanden als bijna ontploffen */}
          {inflation > 70 && (
            <>
              <rect x="44" y="56" width="4" height="6" fill="white" rx="1"/>
              <rect x="52" y="56" width="4" height="6" fill="white" rx="1"/>
            </>
          )}

          {/* Armpjes */}
          <ellipse cx="15" cy="80" rx="10" ry="8" fill={bodyColor}/>
          <ellipse cx="85" cy="80" rx="10" ry="8" fill={bodyColor}/>

          {/* Voetjes */}
          <ellipse cx="35" cy="112" rx="12" ry="8" fill={bodyColor}/>
          <ellipse cx="65" cy="112" rx="12" ry="8" fill={bodyColor}/>
        </svg>
      </div>

      {/* Lettergreep label onder de trol */}
      <div className="mt-2 bg-white/90 px-4 py-2 rounded-xl font-bold text-xl text-purple-900 shadow-md">
        {children}
      </div>

      {/* Scheet animatie */}
      {showFart && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-3xl animate-poof">
          💨
        </div>
      )}
    </div>
  )
}

export const TrollGame = ({ onBack, speak, addStars }) => {
  const [showIntro, setShowIntro] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [heldIndex, setHeldIndex] = useState(null)
  const [inflations, setInflations] = useState({})
  const [explodedIndex, setExplodedIndex] = useState(null)
  const [fartingIndex, setFartingIndex] = useState(null)
  const timerRef = useRef(null)

  // Generated words state
  const [generatedWords, setGeneratedWords] = useState([])
  const [showGenerator, setShowGenerator] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [syllableCount, setSyllableCount] = useState(2)
  const [error, setError] = useState(null)
  const [playingGenerated, setPlayingGenerated] = useState(false)
  const [generatedIndex, setGeneratedIndex] = useState(0)

  // Load generated words from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('generatedTrollWords')
    if (saved) {
      setGeneratedWords(JSON.parse(saved))
    }
  }, [])

  // Current active words list
  const activeWords = playingGenerated ? generatedWords : trollWords
  const activeIndex = playingGenerated ? generatedIndex : currentIndex

  // Generate new words
  const generateNewWords = async () => {
    setGenerating(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/generate-stress-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllableCount,
          gradeLevel: 3,
          quantity: 10
        })
      })

      if (!response.ok) throw new Error('Genereren mislukt')

      const data = await response.json()

      localStorage.setItem('generatedTrollWords', JSON.stringify(data.words))
      setGeneratedWords(data.words)
      setShowGenerator(false)
      speak('Nieuwe woorden gemaakt!')
    } catch (err) {
      setError('Oeps! Probeer opnieuw.')
      console.error(err)
    }

    setGenerating(false)
  }

  // Start playing generated words
  const startGeneratedRound = () => {
    setPlayingGenerated(true)
    setGeneratedIndex(0)
    setCompleted(false)
    setShowIntro(false)
  }

  // Clear generated words
  const clearGeneratedWords = () => {
    localStorage.removeItem('generatedTrollWords')
    setGeneratedWords([])
  }

  // Spreek woord uit bij nieuw woord
  useEffect(() => {
    setInflations({})
    setExplodedIndex(null)
    setFartingIndex(null)

    if (!showIntro && !completed && activeWords.length > 0) {
      const word = activeWords[activeIndex]?.word?.replace(/-/g, '') || ''
      if (word) {
        setTimeout(() => {
          speak(`Zeg mij na: ${word}. ... Houd de sterkste trol vast!`)
        }, 500)
      }
    }
  }, [currentIndex, generatedIndex, showIntro, completed, playingGenerated])

  // Inflation timer
  useEffect(() => {
    if (heldIndex !== null) {
      timerRef.current = setInterval(() => {
        setInflations(prev => {
          const currentVal = prev[heldIndex] || 0
          const currentWord = activeWords[activeIndex]
          if (!currentWord) return prev
          const isCorrect = heldIndex === currentWord.stressIndex

          let newVal = currentVal + 2
          if (!isCorrect && newVal > 40) newVal = 40

          if (isCorrect && newVal >= 100) {
            clearInterval(timerRef.current)
            handleSuccess(heldIndex)
            return prev
          }

          return { ...prev, [heldIndex]: newVal }
        })
      }, 30)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [heldIndex, currentIndex, generatedIndex, playingGenerated])

  const handleStartHold = (index) => {
    if (explodedIndex !== null) return
    setHeldIndex(index)
    setFartingIndex(null)
  }

  const handleEndHold = () => {
    if (heldIndex === null) return

    const currentWord = activeWords[activeIndex]
    if (!currentWord) return
    const isCorrect = heldIndex === currentWord.stressIndex
    const currentInflation = inflations[heldIndex] || 0

    if (!isCorrect && currentInflation > 10) {
      setFartingIndex(heldIndex)
      createFartSound() // Scheetgeluid!
      setInflations(prev => ({ ...prev, [heldIndex]: 0 }))
    } else if (isCorrect && currentInflation < 100) {
      setInflations(prev => ({ ...prev, [heldIndex]: 0 }))
    }

    setHeldIndex(null)
  }

  const handleSuccess = (index) => {
    setExplodedIndex(index)
    createExplosionSound() // BOEM!

    // Grappige trage mannenstem
    const sounds = ["KABOEEEEEM", "BOOOOEM", "SPLAAAATS", "PRRRRATS"]
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)]
    setTimeout(() => speakSlowDeep(randomSound), 100)
    setTimeout(() => speak("Goed zo!"), 1200)

    setTimeout(() => {
      setExplodedIndex(null)
      if (playingGenerated) {
        if (generatedIndex < generatedWords.length - 1) {
          setGeneratedIndex(i => i + 1)
        } else {
          setCompleted(true)
          addStars(TROLL_STARS_REWARD)
        }
      } else {
        if (currentIndex < trollWords.length - 1) {
          setCurrentIndex(c => c + 1)
        } else {
          setCompleted(true)
          addStars(TROLL_STARS_REWARD)
        }
      }
    }, 2000)
  }

  // SVG Trol voor intro scherm
  const IntroTroll = () => (
    <svg viewBox="0 0 100 120" className="w-24 h-28">
      <ellipse cx="15" cy="30" rx="12" ry="18" fill="#65a30d"/>
      <ellipse cx="85" cy="30" rx="12" ry="18" fill="#65a30d"/>
      <ellipse cx="15" cy="30" rx="6" ry="10" fill="#fecaca"/>
      <ellipse cx="85" cy="30" rx="6" ry="10" fill="#fecaca"/>
      <ellipse cx="50" cy="75" rx="40" ry="38" fill="#84cc16"/>
      <ellipse cx="50" cy="80" rx="28" ry="25" fill="#bef264"/>
      <ellipse cx="50" cy="40" rx="35" ry="32" fill="#84cc16"/>
      <path d="M 25 22 L 40 28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
      <path d="M 75 22 L 60 28" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="35" cy="38" r="10" fill="white"/>
      <circle cx="65" cy="38" r="10" fill="white"/>
      <circle cx="35" cy="40" r="5" fill="#1a1a1a"/>
      <circle cx="65" cy="40" r="5" fill="#1a1a1a"/>
      <circle cx="33" cy="37" r="2" fill="white"/>
      <circle cx="63" cy="37" r="2" fill="white"/>
      <ellipse cx="50" cy="48" rx="8" ry="6" fill="#65a30d"/>
      <circle cx="46" cy="48" r="2" fill="#1a1a1a"/>
      <circle cx="54" cy="48" r="2" fill="#1a1a1a"/>
      <path d="M 38 60 Q 50 70 62 60" stroke="#1a1a1a" strokeWidth="3" fill="none"/>
      <ellipse cx="15" cy="80" rx="10" ry="8" fill="#84cc16"/>
      <ellipse cx="85" cy="80" rx="10" ry="8" fill="#84cc16"/>
      <ellipse cx="35" cy="112" rx="12" ry="8" fill="#84cc16"/>
      <ellipse cx="65" cy="112" rx="12" ry="8" fill="#84cc16"/>
    </svg>
  )

  // Intro scherm
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl text-center">
        <div className="mb-6 flex justify-center animate-bounce">
          <IntroTroll />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-purple-900">De Groensnot Brutelaars</h2>
        <p className="text-xl mb-6 leading-relaxed">
          Houd je vinger op de trol die het <strong>hardst</strong> klinkt.<br />
          Hij wordt dikker en dikker...<br />
          Tot hij <strong>ONTPLOFT!</strong><br />
          <span className="text-sm opacity-70">(De verkeerde laat alleen een scheetje)</span>
        </p>

        <button
          onClick={() => speak("Lopen. Je zegt LOOO-pen. De nadruk ligt op LO.")}
          className="bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold py-3 px-6 rounded-xl mb-8 flex items-center gap-2 mx-auto transition"
        >
          <Volume2 size={20} /> Voorbeeld: LO-pen
        </button>

        <button
          onClick={() => setShowIntro(false)}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-lg transition transform hover:scale-105"
        >
          Ik snap het!
        </button>
      </div>
    )
  }

  // Generator scherm
  if (showGenerator) {
    return (
      <div className="max-w-2xl mx-auto page-transition">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowGenerator(false)}
            className="bg-white/50 p-2 rounded-full hover:bg-white/70 transition"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold">Nieuwe Woorden Maken</h2>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold mb-4">Aantal lettergrepen:</h3>
          <div className="flex gap-3 mb-6">
            {[2, 3].map(num => (
              <button
                key={num}
                onClick={() => setSyllableCount(num)}
                className={`px-8 py-4 rounded-xl font-bold text-xl transition ${
                  syllableCount === num
                    ? 'bg-purple-500 text-white'
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
            onClick={generateNewWords}
            disabled={generating}
            className={`w-full py-4 rounded-xl font-bold text-white transition flex items-center justify-center gap-2 ${
              generating
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-500 hover:bg-purple-600'
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
                Maak 10 Nieuwe Woorden!
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Klaar scherm
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="text-8xl mb-6 animate-bounce">💥</div>
        <h2 className="text-4xl font-bold mb-4 text-purple-600">Alle Trollen Gevangen!</h2>
        <p className="text-xl mb-6 opacity-70">+{TROLL_STARS_REWARD} sterren verdiend!</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={onBack}
            className="bg-purple-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition shadow-xl"
          >
            Terug naar Menu
          </button>

          {/* Show generate option */}
          <button
            onClick={() => setShowGenerator(true)}
            className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Nieuwe Woorden Maken!
          </button>

          {/* Show play generated if available */}
          {generatedWords.length > 0 && !playingGenerated && (
            <button
              onClick={startGeneratedRound}
              className="bg-white border-2 border-purple-300 text-purple-700 px-8 py-4 rounded-2xl font-bold hover:bg-purple-50 transition flex items-center justify-center gap-2"
            >
              ✨ Speel Gemaakte Woorden ({generatedWords.length})
            </button>
          )}
        </div>
      </div>
    )
  }

  const currentWord = activeWords[activeIndex]

  if (!currentWord) {
    return (
      <div className="text-center p-8">
        <p>Geen woorden beschikbaar</p>
        <button onClick={onBack} className="mt-4 bg-purple-500 text-white px-6 py-3 rounded-xl">
          Terug
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8 bg-white/50 p-4 rounded-2xl">
        <button onClick={onBack} className="flex items-center gap-2 opacity-60 font-bold">
          <ArrowLeft size={20} /> Stop
        </button>
        <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-xl font-bold">
          {playingGenerated && <span className="text-pink-500">✨</span>}
          <span>👾 {activeIndex + 1} / {activeWords.length}</span>
          <button onClick={() => setShowIntro(true)} className="ml-2 bg-white p-1 rounded-full">
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Woord */}
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-purple-900 mb-2">
          Zeg na: "{currentWord.word.replace(/-/g, '')}"
        </h2>
        <p className="opacity-60 mb-6">Houd de sterkste trol ingedrukt!</p>
        <button
          onClick={() => speak(`Zeg mij na: ${currentWord.word.replace(/-/g, '')}`)}
          className="bg-white text-purple-800 p-4 rounded-full hover:bg-purple-50 transition shadow-sm border-2 border-purple-100"
        >
          <Volume2 size={32} />
        </button>
      </div>

      {/* Trollen */}
      <div className="flex flex-wrap gap-12 justify-center items-end min-h-[200px]">
        {currentWord.parts.map((part, i) => (
          <Troll
            key={i}
            inflation={inflations[i] || 0}
            isExploding={explodedIndex === i}
            showFart={fartingIndex === i}
            onStartHold={() => handleStartHold(i)}
            onEndHold={handleEndHold}
          >
            {part}
          </Troll>
        ))}
      </div>
    </div>
  )
}
