import { useState, useEffect, useRef, useCallback } from 'react'
import { getSmartWordsForPractice, getWordsForPractice, calculateWPM } from './dmtWords'
import { SnowboardScene } from './SnowboardScene'
import { recordAttempt } from '../../../services/spacedRepetition'
import { useAuth } from '../../../hooks/useAuth'
import { useDMT } from '../../../hooks/useDMT'
import { ArrowLeft, Volume2, Info } from '../../shared/Icons'

/**
 * DMTPractice - Oefenmodus voor het DMT Snowboard Sprint spel
 *
 * Kinderen lezen woorden een voor een hardop voor en drukken op Volgende.
 * Ondersteunt twee modi:
 *   - Woord modus: vast aantal woorden (25/50/100)
 *   - Tijd modus: vast tijdslimiet (60/120/180 seconden)
 *
 * @param {function} speak - TTS functie
 * @param {function} onBack - Terug naar DMT menu
 * @param {function} onComplete - Sessie resultaat callback
 * @param {string} aviLevel - AVI niveau (bijv. 'e3', 'm4')
 * @param {object} settings - { wordCount } of { timeLimit }
 */
export const DMTPractice = ({ speak, onBack, onComplete, aviLevel, settings }) => {
  const { user } = useAuth()
  const { getMilestone } = useDMT()
  const milestone = getMilestone(aviLevel)

  // --- State ---
  const [showIntro, setShowIntro] = useState(true)
  const [words, setWords] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wordTimes, setWordTimes] = useState([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(settings.timeLimit || 0)
  const [isFinished, setIsFinished] = useState(false)

  // Animatie state
  const [slideDirection, setSlideDirection] = useState(null) // 'out' | 'in' | null
  const [displayWord, setDisplayWord] = useState('')

  // --- Refs ---
  const wordStartTime = useRef(null)
  const gameStartTime = useRef(null)
  const timerInterval = useRef(null)
  const isTimeMode = useRef(!!settings.timeLimit)
  const handleNextRef = useRef(null)
  const finishGameRef = useRef(null)

  // --- Afgeleiden ---
  const totalTarget = isTimeMode.current ? Infinity : (settings.wordCount || 50)
  const progress = isTimeMode.current
    ? 1 - (remainingSeconds / settings.timeLimit)
    : currentIndex / totalTarget

  // --- Woorden laden (slim: langzame woorden komen vaker terug) ---
  useEffect(() => {
    const count = isTimeMode.current ? 200 : (settings.wordCount || 50)

    const loadWords = async () => {
      let loaded
      try {
        loaded = await getSmartWordsForPractice(user?.id, aviLevel, count)
      } catch {
        loaded = getWordsForPractice(aviLevel, count)
      }
      setWords(loaded)
      if (loaded.length > 0) {
        setDisplayWord(loaded[0].word)
      }
    }

    loadWords()
  }, [aviLevel, settings.wordCount, user?.id])

  // --- Timer ---
  useEffect(() => {
    if (showIntro || isFinished) return

    timerInterval.current = setInterval(() => {
      const now = Date.now()
      const elapsed = now - gameStartTime.current
      setElapsedMs(elapsed)

      if (isTimeMode.current) {
        const remaining = Math.max(0, settings.timeLimit - Math.floor(elapsed / 1000))
        setRemainingSeconds(remaining)

        if (remaining <= 0) {
          finishGameRef.current?.()
        }
      }
    }, 200)

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }
    }
  }, [showIntro, isFinished])

  // --- Game functies ---

  const startGame = useCallback(() => {
    setShowIntro(false)
    gameStartTime.current = Date.now()
    wordStartTime.current = Date.now()

    if (isTimeMode.current) {
      setRemainingSeconds(settings.timeLimit)
    }
  }, [settings.timeLimit])

  const finishGame = useCallback(() => {
    if (isFinished) return
    setIsFinished(true)

    if (timerInterval.current) {
      clearInterval(timerInterval.current)
      timerInterval.current = null
    }

    const totalTimeMs = Date.now() - gameStartTime.current
    const wordsRead = wordTimes.length
    const wpm = calculateWPM(wordsRead, totalTimeMs)

    onComplete({
      totalWords: wordsRead,
      totalTimeMs,
      wordsPerMinute: wpm,
      wordTimes: wordTimes
    })
  }, [isFinished, wordTimes, onComplete])

  // Houd ref in sync met nieuwste finishGame
  useEffect(() => {
    finishGameRef.current = finishGame
  }, [finishGame])

  const handleNext = useCallback(() => {
    if (isFinished || words.length === 0) return

    const now = Date.now()
    const timeForWord = now - wordStartTime.current
    const currentWord = words[currentIndex]

    // Registreer tijd voor dit woord
    const newWordTimes = [...wordTimes, { word: currentWord.word, timeMs: timeForWord }]
    setWordTimes(newWordTimes)

    // Spaced repetition: woorden > 3000ms zijn "langzaam"
    recordAttempt(user?.id, currentWord.word, timeForWord < 3000, 'dmt_practice', timeForWord)

    const nextIndex = currentIndex + 1

    // Einde check (woord modus)
    if (!isTimeMode.current && nextIndex >= totalTarget) {
      // Laatste woord: direct afronden
      const totalTimeMs = now - gameStartTime.current
      const wordsRead = newWordTimes.length
      const wpm = calculateWPM(wordsRead, totalTimeMs)

      setIsFinished(true)
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }

      onComplete({
        totalWords: wordsRead,
        totalTimeMs,
        wordsPerMinute: wpm,
        wordTimes: newWordTimes
      })
      return
    }

    // Einde check (tijd modus - woorden op)
    if (nextIndex >= words.length) {
      const totalTimeMs = now - gameStartTime.current
      const wordsRead = newWordTimes.length
      const wpm = calculateWPM(wordsRead, totalTimeMs)

      setIsFinished(true)
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
        timerInterval.current = null
      }

      onComplete({
        totalWords: wordsRead,
        totalTimeMs,
        wordsPerMinute: wpm,
        wordTimes: newWordTimes
      })
      return
    }

    // Slide animatie: huidig woord glijdt weg
    setSlideDirection('out')

    setTimeout(() => {
      setCurrentIndex(nextIndex)
      setDisplayWord(words[nextIndex].word)
      wordStartTime.current = Date.now()
      setSlideDirection('in')

      // Reset animatie na transitie
      setTimeout(() => {
        setSlideDirection(null)
      }, 250)
    }, 200)
  }, [isFinished, words, currentIndex, wordTimes, totalTarget, user?.id, onComplete])

  // Houd ref in sync met nieuwste handleNext
  useEffect(() => {
    handleNextRef.current = handleNext
  }, [handleNext])

  // --- Keyboard support ---
  useEffect(() => {
    if (showIntro || isFinished) return

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleNextRef.current?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showIntro, isFinished])

  // --- Timer formattering ---
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatElapsed = (ms) => {
    const totalSec = Math.floor(ms / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // --- Timer kleur (tijd modus) ---
  const getTimerColor = () => {
    if (!isTimeMode.current) return 'text-slate-400'
    if (remainingSeconds <= 5) return 'text-red-500 animate-pulse'
    if (remainingSeconds <= 15) return 'text-orange-500'
    return 'text-sky-700'
  }

  // === INTRO SCHERM ===
  if (showIntro) {
    return (
      <div className="bg-gradient-to-b from-sky-100 to-blue-50 min-h-screen flex flex-col">
        {/* Terug knop */}
        <div className="p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sky-700 hover:text-sky-900 transition-colors"
          >
            <ArrowLeft size={24} />
            <span className="text-lg">Terug</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
          {/* Snowboard emoji */}
          <div className="text-7xl mb-4 animate-bounce">
            🏂
          </div>

          {/* Titel */}
          <h1 className="text-3xl font-bold text-sky-800 mb-4">
            Vrije Run
          </h1>

          {/* Uitleg */}
          <div className="bg-white/80 rounded-2xl p-6 max-w-sm text-center shadow-lg mb-6">
            <p className="text-lg text-slate-700 leading-relaxed">
              Lees elk woord hardop en druk op <span className="font-bold text-sky-600">Volgende</span>. Probeer steeds sneller te worden!
            </p>

            {/* Info over modus */}
            <div className="mt-3 text-sm text-slate-500">
              {isTimeMode.current
                ? `⏱️ ${formatTime(settings.timeLimit)} - Lees zo veel mogelijk woorden!`
                : `📖 ${settings.wordCount || 50} woorden`
              }
            </div>
          </div>

          {/* Geluid knop */}
          <button
            onClick={() => speak('Lees elk woord hardop en druk op volgende. Probeer steeds sneller te worden!')}
            className="flex items-center gap-2 text-sky-600 hover:text-sky-800 mb-8 bg-white/60 rounded-full px-5 py-2 shadow transition-colors"
          >
            <Volume2 size={20} />
            <span>Luister</span>
          </button>

          {/* Start knop */}
          <button
            onClick={startGame}
            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-2xl font-bold py-5 px-16 rounded-2xl shadow-lg transform hover:scale-105 active:scale-95 transition-all"
          >
            Start! 🚀
          </button>
        </div>
      </div>
    )
  }

  // === GAME SCHERM ===
  return (
    <div className="bg-gradient-to-b from-sky-100 to-blue-50 min-h-screen flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Terug */}
        <button
          onClick={onBack}
          className="text-sky-700 hover:text-sky-900 p-2 -ml-2 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Midden: teller of timer */}
        <div className="text-center">
          {isTimeMode.current ? (
            <span className={`text-2xl font-bold tabular-nums ${getTimerColor()}`}>
              {formatTime(remainingSeconds)}
            </span>
          ) : (
            <span className="text-lg font-semibold text-sky-800 tabular-nums">
              {currentIndex + 1} / {totalTarget}
            </span>
          )}
        </div>

        {/* Info knop */}
        <button
          onClick={() => setShowIntro(true)}
          className="text-sky-500 hover:text-sky-700 p-2 -mr-2 transition-colors"
        >
          <Info size={22} />
        </button>
      </div>

      {/* Progressie balk */}
      <div className="h-2 bg-sky-200/50 mx-4 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {/* Verstreken tijd (woord modus) - subtiel rechtsboven */}
      {!isTimeMode.current && (
        <div className="text-right pr-5 pt-1">
          <span className="text-sm text-slate-400 tabular-nums">
            ⏱ {formatElapsed(elapsedMs)}
          </span>
        </div>
      )}

      {/* Compact bergje als motivatie */}
      <div className="px-6 pt-2">
        <SnowboardScene
          position={milestone?.snowboardPosition || 0}
          compact={true}
        />
      </div>

      {/* Woord display - klik/tap op het woord gaat ook naar volgende */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div
          onClick={handleNext}
          className={`
            bg-white rounded-3xl shadow-xl p-8 min-h-[200px] w-full max-w-md
            flex items-center justify-center cursor-pointer
            transition-all duration-200 ease-out
            ${slideDirection === 'out' ? 'opacity-0 -translate-x-16' : ''}
            ${slideDirection === 'in' ? 'opacity-0 translate-x-16' : ''}
            ${slideDirection === null ? 'opacity-100 translate-x-0' : ''}
          `}
        >
          <span className="text-5xl font-bold text-slate-800 select-none">
            {displayWord}
          </span>
        </div>

        {/* Woord nummer indicator (tijd modus) */}
        {isTimeMode.current && (
          <div className="mt-3 text-sm text-slate-400">
            Woord {currentIndex + 1}
          </div>
        )}
      </div>

      {/* Volgende knop */}
      <div className="px-6 pb-8 pt-4">
        <button
          onClick={handleNext}
          className="
            w-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700
            text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-lg
            transform hover:scale-[1.02] active:scale-95 transition-all
            min-h-[60px]
          "
        >
          Volgende →
        </button>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-slate-400 mt-2">
          of druk op <kbd className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-500">spatie</kbd>
        </p>
      </div>
    </div>
  )
}

export default DMTPractice
