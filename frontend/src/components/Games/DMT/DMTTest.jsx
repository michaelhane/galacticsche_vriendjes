import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { getWordsForTest, DMT_CONSTANTS } from './dmtWords'
import { SnowboardScene } from './SnowboardScene'
import { useDMT } from '../../../hooks/useDMT'
import { ArrowLeft, Info } from '../../shared/Icons'

/**
 * DMTTest - DMT Toetsmodus
 * Simuleert een echte Drie Minuten Toets met 3 woordkaarten.
 * Elke kaart bevat 150 woorden in een 5-kolom grid, 60 seconden per kaart.
 *
 * Twee modi:
 *   - Zonder ouder: kind tikt op woorden in volgorde
 *   - Met ouder: ouder markeert fouten en telt woorden
 */

const { WORDS_PER_CARD, COLUMNS_PER_CARD, ROWS_PER_CARD, CARD_TIME_MS } = DMT_CONSTANTS
const CARD_TIME_S = CARD_TIME_MS / 1000 // 60

/**
 * Herordent een platte array van woorden (opgeslagen kolom-voor-kolom)
 * naar een array die rij-voor-rij gelezen kan worden in een CSS grid.
 *
 * Opslag: index = col * ROWS + row  (kolom 0 eerst, dan kolom 1, ...)
 * Grid:   index = row * COLS + col  (rij 0 eerst, dan rij 1, ...)
 *
 * We bouwen een displayArray waar displayArray[row * COLS + col] = words[col * ROWS + row]
 */
const reorderForGrid = (words) => {
  const display = new Array(words.length)
  for (let col = 0; col < COLUMNS_PER_CARD; col++) {
    for (let row = 0; row < ROWS_PER_CARD; row++) {
      const storageIndex = col * ROWS_PER_CARD + row
      const displayIndex = row * COLUMNS_PER_CARD + col
      if (storageIndex < words.length) {
        display[displayIndex] = words[storageIndex]
      }
    }
  }
  return display
}

/**
 * Geeft de "leesindex" van een displayIndex.
 * Leesvolgorde is kolom-voor-kolom (top-to-bottom per kolom, links naar rechts).
 * displayIndex = row * COLS + col → readIndex = col * ROWS + row
 */
const displayToReadIndex = (displayIndex) => {
  const row = Math.floor(displayIndex / COLUMNS_PER_CARD)
  const col = displayIndex % COLUMNS_PER_CARD
  return col * ROWS_PER_CARD + row
}

// --- IntroScreen ---

const IntroScreen = ({ withParent, currentCard, onStart, onBack }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
    {/* Terug-knop linksboven */}
    <button
      onClick={onBack}
      className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
      aria-label="Terug"
    >
      <ArrowLeft size={24} />
    </button>

    <div className="max-w-md w-full text-center space-y-6">
      <div className="text-5xl">⏱️</div>
      <h1 className="text-2xl font-bold text-gray-800">DMT Toets</h1>

      {/* Modus badge */}
      <div className="flex justify-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
          withParent
            ? 'bg-purple-100 text-purple-700'
            : 'bg-sky-100 text-sky-700'
        }`}>
          {withParent ? '👨‍👩‍👧 Met ouder' : '👤 Zonder ouder'}
        </span>
      </div>

      {/* Uitleg */}
      <div className="bg-gray-50 rounded-xl p-4 text-left text-gray-700 text-sm leading-relaxed space-y-2">
        {withParent ? (
          <>
            <p>Lees alle woorden hardop. Je ouder let op fouten.</p>
            <p>Je hebt <strong>1 minuut per kaart</strong>.</p>
            <p className="text-gray-500">Er zijn 3 kaarten in totaal.</p>
          </>
        ) : (
          <>
            <p>Je ziet straks veel woorden. Lees ze hardop en tik op elk woord dat je leest.</p>
            <p>Je hebt <strong>1 minuut per kaart</strong>.</p>
            <p className="text-gray-500">Er zijn 3 kaarten in totaal.</p>
          </>
        )}
      </div>

      {/* Start knop */}
      <button
        onClick={onStart}
        className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-emerald-200"
      >
        Start Kaart {currentCard}
      </button>
    </div>
  </div>
)

// --- Timer Display ---

const TimerDisplay = ({ secondsLeft }) => {
  let colorClass = 'text-sky-600'
  let pulseClass = ''

  if (secondsLeft <= 5) {
    colorClass = 'text-red-600'
    pulseClass = 'animate-pulse'
  } else if (secondsLeft <= 15) {
    colorClass = 'text-orange-500'
  }

  return (
    <span className={`text-3xl font-mono font-bold tabular-nums ${colorClass} ${pulseClass}`}>
      {secondsLeft}
    </span>
  )
}

// --- BetweenScreen ---

const BetweenScreen = ({ cardNumber, wordsRead, onNext, onQuit }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
    {/* Terug/stoppen knop */}
    <button
      onClick={onQuit}
      className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
      aria-label="Stoppen"
    >
      <ArrowLeft size={24} />
    </button>

    <div className="max-w-md w-full text-center space-y-6">
      <div className="text-4xl">📋</div>
      <h2 className="text-xl font-bold text-gray-800">
        Kaart {cardNumber} klaar!
      </h2>
      <div className="bg-emerald-50 rounded-xl p-4">
        <p className="text-emerald-700 text-lg">
          <span className="font-bold text-2xl">{wordsRead}</span>{' '}
          woorden gelezen
        </p>
      </div>

      {cardNumber < 3 && (
        <div className="space-y-3">
          <p className="text-gray-600">Klaar voor Kaart {cardNumber + 1}?</p>
          <button
            onClick={onNext}
            className="w-full py-4 px-6 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-sky-200"
          >
            Start Kaart {cardNumber + 1}
          </button>
        </div>
      )}

      {/* Stoppen knop */}
      <button
        onClick={onQuit}
        className="w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-500 text-sm font-medium rounded-xl transition-colors border border-gray-200"
      >
        Stoppen en terug naar menu
      </button>
    </div>
  </div>
)

// --- ParentToolbar ---

const ParentToolbar = ({ wordsRead, onWordsReadChange, onError, onStop }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 z-50">
    <div className="max-w-lg mx-auto flex items-center gap-3">
      {/* Fout knop */}
      <button
        onClick={onError}
        className="flex-shrink-0 px-4 py-2.5 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold rounded-lg transition-colors text-sm"
      >
        ✕ Fout
      </button>

      {/* Woorden teller */}
      <div className="flex-1 flex items-center justify-center gap-2">
        <span className="text-xs text-gray-500 whitespace-nowrap">Woorden gelezen:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onWordsReadChange(Math.max(0, wordsRead - 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-600 transition-colors"
            aria-label="Min 1"
          >
            −
          </button>
          <span className="w-10 text-center font-mono font-bold text-lg text-gray-800">
            {wordsRead}
          </span>
          <button
            onClick={() => onWordsReadChange(Math.min(WORDS_PER_CARD, wordsRead + 1))}
            className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-gray-600 transition-colors"
            aria-label="Plus 1"
          >
            +
          </button>
        </div>
      </div>

      {/* Stop knop */}
      <button
        onClick={onStop}
        className="flex-shrink-0 px-4 py-2.5 bg-gray-700 hover:bg-gray-800 active:bg-gray-900 text-white font-bold rounded-lg transition-colors text-sm"
      >
        ■ Stop
      </button>
    </div>
  </div>
)

// --- InfoModal ---

const InfoModal = ({ withParent, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div
      className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="font-bold text-gray-800 text-lg">ℹ️ Hoe werkt het?</h3>
      {withParent ? (
        <div className="text-sm text-gray-600 space-y-2">
          <p>Het kind leest de woorden hardop, kolom voor kolom (van boven naar beneden).</p>
          <p><strong>Fout-knop:</strong> Tik als het kind een woord fout leest.</p>
          <p><strong>Woorden gelezen:</strong> Pas het aantal aan als de minuut voorbij is.</p>
          <p><strong>Stop:</strong> Stop de kaart eerder als het kind alle woorden heeft gelezen.</p>
        </div>
      ) : (
        <div className="text-sm text-gray-600 space-y-2">
          <p>Lees de woorden hardop, van boven naar beneden per kolom.</p>
          <p>Tik op elk woord dat je gelezen hebt. Het volgende woord licht blauw op.</p>
          <p>Je hebt 1 minuut per kaart. Lees zo veel mogelijk woorden!</p>
        </div>
      )}
      <button
        onClick={onClose}
        className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg transition-colors"
      >
        Begrepen!
      </button>
    </div>
  </div>
)

// --- Hoofd Component ---

export const DMTTest = ({ speak, onBack, onComplete, aviLevel, withParent }) => {
  const { getMilestone } = useDMT()
  const milestone = getMilestone(aviLevel)

  // --- State Machine ---
  const [phase, setPhase] = useState('intro') // intro | playing | between | done
  const [currentCard, setCurrentCard] = useState(1)

  // --- Woorden ---
  const allCards = useMemo(() => getWordsForTest(aviLevel), [aviLevel])

  // Huidige kaart woorden, herordend voor grid display
  const currentWords = useMemo(() => {
    const cardKey = `card${currentCard}`
    const rawWords = allCards[cardKey] || []
    return reorderForGrid(rawWords)
  }, [allCards, currentCard])

  // --- Timer ---
  const [secondsLeft, setSecondsLeft] = useState(CARD_TIME_S)
  const timerRef = useRef(null)

  // --- Zonder-ouder modus: woord tracking ---
  // readState[displayIndex] = 'read' | 'error' | undefined
  const [readState, setReadState] = useState({})
  // nextReadIndex is de "leesindex" (kolom-voor-kolom) van het volgende te lezen woord
  const [nextReadOrder, setNextReadOrder] = useState(0)

  // --- Met-ouder modus ---
  const [parentWordsRead, setParentWordsRead] = useState(0)
  const [parentErrors, setParentErrors] = useState([])

  // --- UI ---
  const [showInfo, setShowInfo] = useState(false)

  // --- Resultaten opslag ---
  const cardResultsRef = useRef([])

  // --- Grid container ref voor scroll ---
  const gridRef = useRef(null)

  // Bereken welk displayIndex het "current" woord is (voor highlight)
  const currentDisplayIndex = useMemo(() => {
    // Zoek het displayIndex waarvan de readIndex === nextReadOrder
    for (let di = 0; di < currentWords.length; di++) {
      if (displayToReadIndex(di) === nextReadOrder) {
        return di
      }
    }
    return -1
  }, [nextReadOrder, currentWords.length])

  // --- Timer starten/stoppen ---
  const startTimer = useCallback(() => {
    setSecondsLeft(CARD_TIME_S)

    // Clear bestaand interval
    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          timerRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // --- Kaart beëindigen ---
  const finishCard = useCallback(() => {
    stopTimer()

    // Tel gelezen woorden
    let wordsRead
    let errors = []

    if (withParent) {
      wordsRead = parentWordsRead
      errors = [...parentErrors]
    } else {
      wordsRead = Object.values(readState).filter((s) => s === 'read').length
    }

    // Sla resultaat op
    cardResultsRef.current.push({
      cardNumber: currentCard,
      wordsRead,
      totalWords: WORDS_PER_CARD,
      errors
    })

    if (currentCard >= 3) {
      // Alle 3 kaarten klaar → done
      setPhase('done')
    } else {
      setPhase('between')
    }
  }, [stopTimer, withParent, parentWordsRead, parentErrors, readState, currentCard])

  // Timer afgelopen → kaart beëindigen
  useEffect(() => {
    if (phase === 'playing' && secondsLeft === 0) {
      finishCard()
    }
  }, [secondsLeft, phase, finishCard])

  // --- Kaart starten ---
  const startCard = useCallback(() => {
    setReadState({})
    setNextReadOrder(0)
    setParentWordsRead(0)
    setParentErrors([])
    setPhase('playing')
    startTimer()

    // Scroll grid naar boven
    if (gridRef.current) {
      gridRef.current.scrollTop = 0
    }
  }, [startTimer])

  // --- Done: resultaten doorsturen ---
  useEffect(() => {
    if (phase !== 'done') return

    const cards = cardResultsRef.current
    const totalWords = cards.reduce((sum, c) => sum + c.wordsRead, 0)
    const totalTimeMs = 3 * CARD_TIME_MS // altijd 3x60s

    onComplete({
      totalWords,
      totalTimeMs,
      wordsPerMinute: Math.round((totalWords / 3) * 10) / 10,
      cards
    })
  }, [phase, onComplete])

  // --- Volgende kaart ---
  const nextCard = useCallback(() => {
    setCurrentCard((prev) => prev + 1)
    setPhase('intro')
  }, [])

  // --- Zonder-ouder: woord tappen ---
  const handleWordTap = useCallback((displayIndex) => {
    if (withParent) return
    if (phase !== 'playing') return

    // Alleen het huidige woord mag getapt worden
    const readIndex = displayToReadIndex(displayIndex)
    if (readIndex !== nextReadOrder) return

    setReadState((prev) => ({ ...prev, [displayIndex]: 'read' }))
    setNextReadOrder((prev) => prev + 1)
  }, [withParent, phase, nextReadOrder])

  // --- Met-ouder: fout markeren ---
  const handleParentError = useCallback(() => {
    setParentErrors((prev) => [...prev, { wordIndex: parentWordsRead, timestamp: Date.now() }])
  }, [parentWordsRead])

  // --- Met-ouder: stop knop ---
  const handleParentStop = useCallback(() => {
    finishCard()
  }, [finishCard])

  // --- Render per fase ---

  if (phase === 'intro') {
    return (
      <IntroScreen
        withParent={withParent}
        currentCard={currentCard}
        onStart={startCard}
        onBack={onBack}
      />
    )
  }

  if (phase === 'between') {
    const lastResult = cardResultsRef.current[cardResultsRef.current.length - 1]
    return (
      <BetweenScreen
        cardNumber={lastResult.cardNumber}
        wordsRead={lastResult.wordsRead}
        onNext={nextCard}
        onQuit={onBack}
      />
    )
  }

  if (phase === 'done') {
    // Wordt afgehandeld door de useEffect hierboven die onComplete aanroept.
    // Render een loading state voor het geval onComplete even duurt.
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-lg">Resultaten berekenen...</p>
      </div>
    )
  }

  // --- phase === 'playing' ---
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-40">
        <span className="text-sm font-medium text-gray-600">
          Kaart {currentCard} van 3
        </span>

        <TimerDisplay secondsLeft={secondsLeft} />

        <button
          onClick={() => setShowInfo(true)}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Info"
        >
          <Info size={20} />
        </button>
      </div>

      {/* Compact bergje als motivatie */}
      <div className="px-4 pt-1">
        <SnowboardScene
          position={milestone?.snowboardPosition || 0}
          compact={true}
        />
      </div>

      {/* Woorden Grid */}
      <div
        ref={gridRef}
        className={`flex-1 overflow-y-auto ${withParent ? 'pb-20' : 'pb-4'}`}
        style={{ maxHeight: withParent ? 'calc(100vh - 180px)' : 'calc(100vh - 120px)' }}
      >
        <div className="grid grid-cols-5 gap-x-3 gap-y-1 p-4">
          {currentWords.map((wordObj, displayIndex) => {
            if (!wordObj) return null

            const state = readState[displayIndex]
            const isCurrent = !withParent && displayIndex === currentDisplayIndex
            const isRead = state === 'read'

            // Stijl bepalen
            let wordClasses = 'text-sm md:text-base font-medium py-0.5 px-1 rounded cursor-pointer transition-colors select-none'

            if (isRead) {
              wordClasses += ' text-emerald-600 bg-emerald-50'
            } else if (isCurrent) {
              wordClasses += ' bg-sky-50 ring-1 ring-sky-300 text-gray-900'
            } else {
              wordClasses += ' text-gray-900'
            }

            // In met-ouder modus geen interactie nodig op woorden
            if (withParent) {
              wordClasses = 'text-sm md:text-base font-medium py-0.5 px-1 text-gray-900 select-none'
            }

            return (
              <span
                key={`${displayIndex}-${wordObj.word}`}
                className={wordClasses}
                onClick={() => handleWordTap(displayIndex)}
                role={withParent ? undefined : 'button'}
                tabIndex={isCurrent ? 0 : -1}
              >
                {wordObj.word}
              </span>
            )
          })}
        </div>
      </div>

      {/* Parent toolbar (alleen met-ouder modus) */}
      {withParent && (
        <ParentToolbar
          wordsRead={parentWordsRead}
          onWordsReadChange={setParentWordsRead}
          onError={handleParentError}
          onStop={handleParentStop}
        />
      )}

      {/* Info modal */}
      {showInfo && (
        <InfoModal
          withParent={withParent}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  )
}

export default DMTTest
