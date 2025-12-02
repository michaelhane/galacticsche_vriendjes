import { useState, useEffect } from 'react'
import { ArrowLeft, Volume2, Info } from '../shared/Icons'
import { STARS_PER_WORD } from '../../data/codeKrakenLevels'

export const SyllableGame = ({ levelData, onBack, addStars, speak, onLevelComplete }) => {
  const [showIntro, setShowIntro] = useState(true)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [selectedParts, setSelectedParts] = useState([])
  const [scrambledParts, setScrambledParts] = useState([])
  const [completed, setCompleted] = useState(false)
  const [isWrong, setIsWrong] = useState(false)

  // Scramble parts wanneer woord verandert
  useEffect(() => {
    if (!completed && levelData?.words?.[currentWordIndex]) {
      const parts = [...levelData.words[currentWordIndex].parts]
      parts.sort(() => Math.random() - 0.5)
      setScrambledParts(parts)
      setSelectedParts([])
      setIsWrong(false)
    }
  }, [currentWordIndex, completed, levelData])

  const handlePartClick = (part, index) => {
    const newSelection = [...selectedParts, part]
    setSelectedParts(newSelection)
    speak(part.s)

    const newScrambled = [...scrambledParts]
    newScrambled.splice(index, 1)
    setScrambledParts(newScrambled)
    setIsWrong(false)

    // Check of woord compleet en correct is
    const currentWord = levelData.words[currentWordIndex]
    const targetWord = currentWord.parts.map(p => p.t).join('')
    const currentBuilt = newSelection.map(p => p.t).join('')

    if (currentBuilt === targetWord) {
      // Correct!
      setTimeout(() => {
        speak(`Super! ${currentWord.word.replace(/-/g, '')}`)
        addStars(STARS_PER_WORD)

        if (currentWordIndex < levelData.words.length - 1) {
          setCurrentWordIndex(c => c + 1)
        } else {
          setCompleted(true)
          onLevelComplete()
        }
      }, 1000)
    } else if (newSelection.length === currentWord.parts.length) {
      // Alle delen geselecteerd maar verkeerd
      setIsWrong(true)
    }
  }

  const handleRemovePart = (part, index) => {
    if (completed) return
    const newSelection = [...selectedParts]
    newSelection.splice(index, 1)
    setSelectedParts(newSelection)
    setScrambledParts([...scrambledParts, part])
    setIsWrong(false)
  }

  // Intro scherm
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl text-center">
        <div className="text-6xl mb-6">🚀🧩</div>
        <h2 className="text-3xl font-bold mb-4 text-emerald-800">Code Kraken</h2>
        <p className="text-xl mb-6 leading-relaxed">
          Het woord is gebroken!<br />
          Klik op de stukjes in de <strong>juiste volgorde</strong> om het woord te maken.
        </p>
        
        <button
          onClick={() => speak("Het woord is gebroken! Klik op de stukjes in de juiste volgorde.")}
          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold py-3 px-6 rounded-xl mb-8 flex items-center gap-2 mx-auto transition"
        >
          <Volume2 size={24} /> Luister Uitleg
        </button>

        <button
          onClick={() => {
            setShowIntro(false)
            speak("Succes astronaut!")
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-lg transition transform hover:scale-105"
        >
          Start Missie
        </button>
      </div>
    )
  }

  // Level voltooid
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="text-8xl mb-6 animate-bounce">🏆</div>
        <h2 className="text-4xl font-bold mb-4 text-indigo-900">Level Voltooid!</h2>
        <p className="text-xl mb-8 opacity-70">
          +{levelData.words.length * STARS_PER_WORD} sterren verdiend!
        </p>
        <button
          onClick={onBack}
          className="bg-emerald-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition shadow-xl"
        >
          Terug naar Menu
        </button>
      </div>
    )
  }

  const currentItem = levelData.words[currentWordIndex]

  return (
    <div className="flex flex-col items-center max-w-3xl mx-auto">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-8 bg-white/50 p-4 rounded-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 opacity-60 hover:opacity-100 font-bold transition"
        >
          <ArrowLeft size={20} /> Stop Missie
        </button>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl font-bold">
          <span>{levelData.title}</span>
          <span className="opacity-50">•</span>
          <span>{currentWordIndex + 1}/{levelData.words.length}</span>
          <button
            onClick={() => setShowIntro(true)}
            className="bg-white p-1 rounded-full ml-2"
          >
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Afbeelding */}
      <div className="text-9xl mb-12 drop-shadow-2xl transition-transform hover:scale-110 duration-500">
        {currentItem.image}
      </div>

      {/* Antwoord vak */}
      <div
        className={`
          flex flex-wrap gap-2 min-h-[100px] mb-12 p-6
          bg-white/60 rounded-3xl w-full justify-center items-center
          shadow-inner border-2 transition-colors duration-300
          ${isWrong ? 'border-red-400 bg-red-50 animate-shake' : 'border-indigo-100/50'}
        `}
      >
        {selectedParts.length === 0 && (
          <span className="opacity-40 italic font-medium">Klik op de blokjes...</span>
        )}
        {selectedParts.map((part, i) => (
          <button
            key={i}
            onClick={() => handleRemovePart(part, i)}
            className={`
              px-6 py-4 rounded-xl shadow-lg font-bold text-3xl
              transition-transform hover:scale-95 cursor-pointer
              ${isWrong
                ? 'bg-red-100 text-red-800 border-2 border-red-200'
                : 'bg-indigo-600 text-white shadow-indigo-200'
              }
            `}
            title="Klik om te verwijderen"
          >
            {part.t}
          </button>
        ))}
      </div>

      {/* Beschikbare delen */}
      <div className="flex flex-wrap gap-4 justify-center">
        {scrambledParts.map((part, i) => (
          <button
            key={i}
            onClick={() => handlePartClick(part, i)}
            className="
              bg-white hover:bg-emerald-50 text-indigo-900
              border-b-4 border-emerald-200
              px-8 py-5 rounded-2xl shadow-lg
              transform transition hover:-translate-y-1 active:scale-95
              text-3xl font-bold
            "
          >
            {part.t}
          </button>
        ))}
      </div>
    </div>
  )
}
