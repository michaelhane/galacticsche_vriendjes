import { useState, useEffect, useRef } from 'react'
import { jumperStories, JUMPER_STARS_PER_STORY } from '../../data/jumperStories'
import { ArrowLeft, Volume2, Info, Lock } from '../shared/Icons'

// SVG Kikker zittend - van originele HTML
const FrogSit = () => (
  <svg viewBox="0 0 100 80" className="w-24 h-20">
    {/* Achterpoten */}
    <ellipse cx="20" cy="65" rx="18" ry="12" fill="#2d5a27"/>
    <ellipse cx="80" cy="65" rx="18" ry="12" fill="#2d5a27"/>
    {/* Lichaam */}
    <ellipse cx="50" cy="50" rx="35" ry="28" fill="#4ade80"/>
    {/* Buik */}
    <ellipse cx="50" cy="55" rx="25" ry="18" fill="#86efac"/>
    {/* Voorpoten */}
    <ellipse cx="25" cy="60" rx="8" ry="5" fill="#4ade80"/>
    <ellipse cx="75" cy="60" rx="8" ry="5" fill="#4ade80"/>
    {/* Hoofd */}
    <ellipse cx="50" cy="30" rx="28" ry="22" fill="#4ade80"/>
    {/* Ogen (groot en uitpuilend) */}
    <circle cx="35" cy="18" r="12" fill="white"/>
    <circle cx="65" cy="18" r="12" fill="white"/>
    <circle cx="35" cy="18" r="6" fill="#1a1a1a"/>
    <circle cx="65" cy="18" r="6" fill="#1a1a1a"/>
    {/* Glans in ogen */}
    <circle cx="33" cy="15" r="2" fill="white"/>
    <circle cx="63" cy="15" r="2" fill="white"/>
    {/* Neusgaten */}
    <circle cx="45" cy="32" r="2" fill="#2d5a27"/>
    <circle cx="55" cy="32" r="2" fill="#2d5a27"/>
    {/* Glimlach */}
    <path d="M 35 42 Q 50 52 65 42" stroke="#2d5a27" strokeWidth="2" fill="none"/>
    {/* Wangen (blush) */}
    <ellipse cx="28" cy="38" rx="6" ry="4" fill="#f9a8d4" opacity="0.5"/>
    <ellipse cx="72" cy="38" rx="6" ry="4" fill="#f9a8d4" opacity="0.5"/>
  </svg>
)

// SVG Kikker springend - van originele HTML
const FrogJump = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24">
    {/* Gestrekte achterpoten */}
    <path d="M 30 80 Q 10 90 5 95" stroke="#2d5a27" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 70 80 Q 90 90 95 95" stroke="#2d5a27" strokeWidth="8" fill="none" strokeLinecap="round"/>
    {/* Voeten */}
    <ellipse cx="5" cy="95" rx="6" ry="4" fill="#2d5a27"/>
    <ellipse cx="95" cy="95" rx="6" ry="4" fill="#2d5a27"/>
    {/* Lichaam (meer gestrekt) */}
    <ellipse cx="50" cy="50" rx="30" ry="35" fill="#4ade80"/>
    {/* Buik */}
    <ellipse cx="50" cy="55" rx="20" ry="22" fill="#86efac"/>
    {/* Voorpoten omhoog */}
    <path d="M 30 35 Q 15 25 10 20" stroke="#4ade80" strokeWidth="8" fill="none" strokeLinecap="round"/>
    <path d="M 70 35 Q 85 25 90 20" stroke="#4ade80" strokeWidth="8" fill="none" strokeLinecap="round"/>
    {/* Handjes */}
    <ellipse cx="10" cy="18" rx="5" ry="4" fill="#4ade80"/>
    <ellipse cx="90" cy="18" rx="5" ry="4" fill="#4ade80"/>
    {/* Hoofd */}
    <ellipse cx="50" cy="25" rx="25" ry="20" fill="#4ade80"/>
    {/* Ogen (groot en blij) */}
    <circle cx="38" cy="15" r="10" fill="white"/>
    <circle cx="62" cy="15" r="10" fill="white"/>
    <circle cx="38" cy="15" r="5" fill="#1a1a1a"/>
    <circle cx="62" cy="15" r="5" fill="#1a1a1a"/>
    {/* Glans */}
    <circle cx="36" cy="12" r="2" fill="white"/>
    <circle cx="60" cy="12" r="2" fill="white"/>
    {/* Blije mond */}
    <path d="M 38 32 Q 50 42 62 32" stroke="#2d5a27" strokeWidth="2" fill="none"/>
    {/* Wangen */}
    <ellipse cx="30" cy="28" rx="5" ry="3" fill="#f9a8d4" opacity="0.5"/>
    <ellipse cx="70" cy="28" rx="5" ry="3" fill="#f9a8d4" opacity="0.5"/>
  </svg>
)

// Blok stepping stone component - van originele HTML
const SteppingStone = ({ syllable, index, isActive, isCompleted, isCurrent, isPrevious, onClick }) => {
  const stoneColors = [
    { bg: 'bg-emerald-500', text: 'text-white', shadow: '#065f46' },
    { bg: 'bg-lime-500', text: 'text-white', shadow: '#4d7c0f' },
    { bg: 'bg-green-500', text: 'text-white', shadow: '#166534' },
    { bg: 'bg-teal-500', text: 'text-white', shadow: '#115e59' },
    { bg: 'bg-cyan-500', text: 'text-white', shadow: '#0e7490' }
  ]

  const color = stoneColors[index % stoneColors.length]
  // Vorige blok is klikbaar om terug te springen
  const isClickable = isActive || isPrevious

  return (
    <button
      onClick={onClick}
      disabled={!isClickable && (isCompleted || isCurrent)}
      className={`
        relative min-w-[80px] px-5 py-4 rounded-xl font-bold text-xl
        transition-all duration-300 transform select-none
        ${color.bg} ${color.text}
        ${isActive
          ? 'ring-4 ring-yellow-400 ring-offset-2 scale-110 shadow-xl animate-pulse cursor-pointer'
          : ''
        }
        ${isPrevious
          ? 'ring-2 ring-blue-400 hover:ring-4 hover:scale-105 cursor-pointer'
          : ''
        }
        ${isCurrent
          ? 'ring-2 ring-green-300 scale-100'
          : ''
        }
        ${isCompleted && !isPrevious
          ? 'opacity-40 scale-90 grayscale'
          : ''
        }
        ${!isCompleted && !isCurrent && !isActive && !isPrevious ? 'opacity-70' : ''}
      `}
      style={{
        boxShadow: (isCompleted && !isPrevious) ? 'none' : `0 4px 0 ${color.shadow}`,
      }}
    >
      {syllable}
      {isPrevious && <span className="absolute -top-2 -right-2 text-xs">🔄</span>}
    </button>
  )
}

// Story selector component
const StorySelector = ({ stories, completedStories, onSelect, onBack }) => {
  const isUnlocked = (storyId) => {
    if (storyId === 0) return true  // Eerste verhaal altijd open
    return completedStories.includes(storyId - 1)
  }

  return (
    <div className="page-transition">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="bg-white/50 p-2 rounded-full hover:bg-white/70 transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Kies een Verhaal</h2>
      </div>

      <div className="grid gap-4">
        {stories.map((story) => {
          const unlocked = isUnlocked(story.id)
          const completed = completedStories.includes(story.id)

          return (
            <button
              key={story.id}
              onClick={() => unlocked && onSelect(story)}
              disabled={!unlocked}
              className={`
                p-6 rounded-2xl text-left transition
                flex items-center justify-between group
                ${unlocked
                  ? 'bg-white hover:bg-lime-50 shadow-sm border-2 border-lime-100 hover:border-lime-300'
                  : 'bg-gray-100 opacity-60 border-2 border-transparent cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{story.icon}</span>
                <div>
                  <h3 className="font-bold text-xl mb-1 flex items-center gap-2">
                    {story.title}
                    {!unlocked && <Lock size={16} />}
                    {completed && <span className="text-green-500">✓</span>}
                  </h3>
                  <p className="opacity-60 text-sm">
                    {story.sentences.length} zinnen •
                    {' '}{'⭐'.repeat(story.difficulty)}
                  </p>
                </div>
              </div>
              {unlocked && !completed && (
                <div className="bg-lime-100 text-lime-800 px-3 py-1 rounded-full text-sm font-bold">
                  Spring!
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Woorden die al goed klinken in TTS (bestaande Nederlandse woorden)
const GOOD_WORDS = [
  'de', 'te', 'me', 'ze', 'we', 'je', 'he',  // functiewoorden
  'ra', 'la', 'do', 're', 'mi', 'fa', 'so',  // muzieknoten
  'ja', 'na', 'nu', 'zo', 'al',              // bestaande woorden
  'op', 'om', 'in', 'en', 'of', 'is', 'er',  // korte woorden
  'het', 'die', 'dat', 'wat', 'wie',         // lidwoorden etc (niet "een"!)
  'blad', 'heel', 'naar', 'door', 'zijn',    // werkende woorden
]

// Voorvoegsels die hele-woord aanpak nodig hebben (spreken + stoppen)
const PREFIX_SYLLABLES = ['be', 'ge', 've']

// Lettergrepen die Engels klinken → fonetische fix
// TTS spreekt deze als Nederlandse klanken
const PHONETIC_FIXES = {
  // Open lettergrepen eindigend op 'e' (klinken als Engelse "ee" of "eh")
  'le': 'leu',      // le-lie-blad → "leu" niet "lee/leh"
  'me': 'meu',      // me-ter
  'ke': 'keu',      // fon-ke-len
  'ne': 'neu',      //
  'te': 'teu',      // ruim-te (maar "te" als los woord is goed)
  'de': 'deu',      // bla-de-ren (maar "de" als los woord is goed)
  're': 'reu',      // reu-zen
  'vre': 'vreu',    // te-vre-den

  // "ie" klinkt als Engels "lie"
  'lie': 'lie.',    // punt voorkomt Engels
  'vie': 'vie.',
  'bie': 'bie.',

  // "een" als lettergreep (niet als lidwoord) klinkt Engels
  'een': 'eun',     // vlie-gen-de → maar lidwoord "een" moet apart

  // Andere Engels-klinkende
  'flad': 'flad.',
  'dert': 'durt',
  'gels': 'guls',
  'bui': 'bui.',
  'delt': 'dult',
  'sche': 'schu',
}

// Lettergrepen die stomme e krijgen als ze GEEN klemtoon hebben
// UITGESCHAKELD - Nederlandse TTS zou dit correct moeten uitspreken
// Alleen voorvoegsels be-/ge- hebben speciale behandeling (via PREFIX_SYLLABLES)
const SCHWA_REPLACEMENTS = {
  // Voorlopig leeg - laat TTS de originele lettergrepen uitspreken
}

// Lettergrepen die "h" nodig hebben (worden als afkorting gelezen)
const PROBLEM_SYLLABLES = [
  'mo', 'ko', 'bo', 'lo', 'to', 'ro', 'vo', 'po',  // eindigen op o
  'ka', 'ba', 'pa', 'ta', 'ma', 'sa', 'va',         // eindigen op a
  'pla', 'a',                                        // afkortings-gevoelig
]

// Haal woord context op voor een lettergreep, inclusief klemtoon
const getWordContext = (sentence, syllableIndex) => {
  const syllable = sentence.syllables[syllableIndex]
  if (!syllable) return null

  const words = sentence.text.split(' ')
  let syllableCounter = 0

  for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
    const wordWithDashes = words[wordIdx]
    const wordParts = wordWithDashes.split('-').filter(Boolean)

    for (let sylIdx = 0; sylIdx < wordParts.length; sylIdx++) {
      if (syllableCounter === syllableIndex) {
        // Bepaal klemtoon: meestal op eerste lettergreep, BEHALVE bij be-, ge-, ver-
        const firstPart = wordParts[0]?.toLowerCase()
        const hasPrefix = PREFIX_SYLLABLES.includes(firstPart)

        // Als woord begint met voorvoegsel, ligt klemtoon op 2e lettergreep
        // Anders op de eerste
        const stressPosition = hasPrefix && wordParts.length > 1 ? 1 : 0
        const hasStress = sylIdx === stressPosition

        return {
          syllable,
          wordParts,
          syllablePosition: sylIdx,
          totalSyllables: wordParts.length,
          hasStress,
          stressPosition
        }
      }
      syllableCounter++
    }
  }
  return null
}

// Bouw fonetische versie van woord: be-gint -> buh gint, lo-pen -> loh pen
const buildPhoneticWord = (wordParts, targetSyllableIndex = 0) => {
  return wordParts.map((part, i) => {
    const s = part.toLowerCase()
    // Target lettergreep: voorvoegsel krijgt "uh", probleemlettergrepen krijgen "h"
    if (i === targetSyllableIndex) {
      if (PREFIX_SYLLABLES.includes(s)) return s.slice(0, -1) + 'uh' // be -> buh
      if (PROBLEM_SYLLABLES.includes(s)) return part + 'h' // mo -> moh, lo -> loh
    }
    return part
  }).join(' ')
}

// Helper om lettergreep spraak-klaar te maken
// hasStress = true betekent dat deze lettergreep de klemtoon heeft
const getSpeakableSyllable = (syllable, hasStress = true) => {
  if (!syllable) return syllable

  const s = syllable.toLowerCase().trim()

  // Als het een bekend goed woord is, niet aanpassen
  if (GOOD_WORDS.includes(s)) {
    return syllable
  }

  // Als GEEN klemtoon: check of het een schwa-vervanging nodig heeft
  // gen → gun, men → mun, be → buh, etc.
  if (!hasStress && SCHWA_REPLACEMENTS[s]) {
    return SCHWA_REPLACEMENTS[s]
  }

  // Check fonetische fixes (Engels-klinkende lettergrepen)
  if (PHONETIC_FIXES[s]) {
    return PHONETIC_FIXES[s]
  }

  // Als het een bekend probleemwoord is (afkorting-bug), voeg "h" toe
  if (PROBLEM_SYLLABLES.includes(s)) {
    return syllable + 'h'
  }

  return syllable
}

// localStorage keys
const MARKS_STORAGE_KEY = 'tts-syllable-marks'
const TIMINGS_STORAGE_KEY = 'tts-syllable-timings'

// Default timings per lettergreep-type (ms)
const DEFAULT_TIMINGS = {
  'be': 500, 'ge': 500, 've': 500,  // prefixes
  'mo': 600, 'ko': 600, 'bo': 600, 'lo': 600, 'to': 600, 'ro': 600, 'vo': 600, 'po': 600,  // -o
  'ka': 600, 'ba': 600, 'pa': 600, 'ta': 600, 'ma': 600, 'sa': 600, 'va': 600,  // -a
  'pla': 600, 'a': 600,  // andere
}

export const JumpGame = ({ onBack, speak, addStars, completeLevel }) => {
  const [showIntro, setShowIntro] = useState(true)
  const [selectedStory, setSelectedStory] = useState(null)

  // Auto-play mode
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(1200)
  const [syllableTimings, setSyllableTimings] = useState(() => {
    const saved = localStorage.getItem(TIMINGS_STORAGE_KEY)
    return saved ? { ...DEFAULT_TIMINGS, ...JSON.parse(saved) } : { ...DEFAULT_TIMINGS }
  })
  const syllableTimingsRef = useRef(syllableTimings)
  const [syllableMarks, setSyllableMarks] = useState(() => {
    const saved = localStorage.getItem(MARKS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  })
  // Ref voor directe toegang tot marks (omzeilt async state)
  const syllableMarksRef = useRef(syllableMarks)

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(-1) // -1 = op de grond, nog niet gesprongen
  const [completedStories, setCompletedStories] = useState([])
  const [isJumping, setIsJumping] = useState(false)
  const [isTesting, setIsTesting] = useState(false) // Test-sprong animatie
  const [storyCompleted, setStoryCompleted] = useState(false)
  const [sentenceCompleted, setSentenceCompleted] = useState(false) // Wacht op handmatige "volgende zin"
  const [worldOffset, setWorldOffset] = useState(0)
  const containerRef = useRef(null)

  // Bereken offset voor een bepaalde syllable index
  const calculateOffset = (targetIndex) => {
    const sentence = selectedStory?.sentences[currentSentenceIndex]
    if (!sentence) return 0

    // Startplatform (index -1) is aan het begin
    if (targetIndex < 0) return 70 // Centreer op startblok

    let offset = 40 + 60 + 24 // paddingLeft + startblok breedte + margin
    const words = sentence.text.split(' ')
    let syllableCounter = 0

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const syllableCount = words[wordIdx].split('-').filter(Boolean).length

      for (let sylIdx = 0; sylIdx < syllableCount; sylIdx++) {
        if (syllableCounter === targetIndex) {
          return offset + 40 // + halve blokbreedte voor centrering
        }
        if (syllableCounter > 0) {
          offset += sylIdx === 0 ? 48 : 4
        } else {
          offset += 24 // eerste blok margin
        }
        offset += 80
        syllableCounter++
      }
    }
    return offset
  }

  // Scroll de wereld - tijdens springen naar volgende positie, anders huidige
  useEffect(() => {
    if (selectedStory) {
      if (isJumping) {
        // Scroll alvast naar waar de kikker landt
        setWorldOffset(calculateOffset(currentSyllableIndex + 1))
      } else {
        setWorldOffset(calculateOffset(currentSyllableIndex))
      }
    }
  }, [currentSyllableIndex, currentSentenceIndex, selectedStory, isJumping])

  // GEEN automatische speech meer bij start - alles gebeurt via handleSyllableClick
  // De kikker start op de grond (index -1) en speech komt pas bij de sprong

  // Helper: spreek tekst uit en wacht tot klaar
  const speakAndWait = (text) => {
    return new Promise((resolve) => {
      // Fallback timeout voor alle gevallen
      const timeout = setTimeout(resolve, 2000)

      // ResponsiveVoice fallback voor Android
      if (window.responsiveVoice?.voiceSupport()) {
        window.responsiveVoice.speak(text, 'Dutch Female', {
          rate: 0.9,
          onend: () => {
            clearTimeout(timeout)
            resolve()
          }
        })
        return
      }

      // Native Web Speech API
      if (!window.speechSynthesis) {
        clearTimeout(timeout)
        resolve()
        return
      }
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'nl-NL'
      utterance.rate = 0.9
      utterance.onend = () => {
        clearTimeout(timeout)
        resolve()
      }
      utterance.onerror = () => {
        clearTimeout(timeout)
        resolve()
      }
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    })
  }

  const handleSyllableClick = async (index) => {
    const sentence = selectedStory.sentences[currentSentenceIndex]

    // ACHTERUIT: klik op vorige blok om nog een keer te horen
    if (index === currentSyllableIndex - 1 && !isJumping && currentSyllableIndex > 0) {
      setCurrentSyllableIndex(index)
      return
    }

    // VOORUIT: klik op volgende blok om te springen
    const nextIndex = currentSyllableIndex + 1

    // Check of dit het volgende blok is en we niet al springen
    if (index !== nextIndex || isJumping) return
    // Laatste blok moet ook klikbaar zijn!
    if (nextIndex > sentence.syllables.length - 1) return

    // Start spring animatie
    setIsJumping(true)

    // GEEN speech meer bij individuele lettergrepen
    // Alleen visueel leren, hele zinnen kunnen nog wel voorgelezen worden

    // Wacht tot animatie klaar is (0.6s zoals in CSS)
    setTimeout(async () => {
      setIsJumping(false)
      setCurrentSyllableIndex(nextIndex)

      // Check of dit de LAATSTE lettergreep was
      if (nextIndex === sentence.syllables.length - 1) {
        // Wacht even zodat kind de laatste lettergreep goed hoort
        await new Promise(resolve => setTimeout(resolve, 800))

        // Markeer zin als voltooid - NIET automatisch door naar volgende
        setSentenceCompleted(true)
        setAutoPlay(false) // Stop auto-play zodat user kan markeren
      }
    }, 600)
  }

  // Handmatig naar volgende zin (of einde verhaal)
  const goToNextSentence = () => {
    const sentence = selectedStory.sentences[currentSentenceIndex]

    // Auto-fill alle niet-gemarkeerde lettergrepen als goed
    autoFillMarks(selectedStory.id, currentSentenceIndex, sentence.syllables.length)

    // Reset sentence state
    setSentenceCompleted(false)

    // Check of dit het laatste was
    if (currentSentenceIndex < selectedStory.sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1)
      setCurrentSyllableIndex(-1) // Start op de grond
      setWorldOffset(0)
    } else {
      handleStoryComplete()
    }
  }

  const handleStoryComplete = () => {
    setStoryCompleted(true)
    setAutoPlay(false) // Stop auto-play bij einde verhaal
    setSentenceCompleted(false)
    setCompletedStories(prev => [...prev, selectedStory.id])

    // Gebruik completeLevel voor persistent opslaan
    if (completeLevel) {
      // completeLevel handled sterren intern
      completeLevel('jumper', selectedStory.id, JUMPER_STARS_PER_STORY)
    } else {
      // Fallback als completeLevel niet beschikbaar is
      addStars(JUMPER_STARS_PER_STORY)
    }

    speak("Fantastisch! Je hebt het verhaal uit!")
  }

  // Keyboard controls: Spatie = pauze, Enter = volgende (wanneer gepauzeerd)
  useEffect(() => {
    if (!selectedStory || storyCompleted) return

    const handleKeyDown = (e) => {
      // Spatie = toggle pauze (alleen als zin niet af is)
      if (e.code === 'Space' && !sentenceCompleted) {
        e.preventDefault()
        setAutoPlay(prev => !prev)
      }
      // Enter = volgende stap of volgende zin
      if (e.code === 'Enter' && !isJumping) {
        e.preventDefault()
        // Als zin af is → naar volgende zin
        if (sentenceCompleted) {
          goToNextSentence()
        }
        // Anders → volgende lettergreep (alleen als NIET auto-play)
        else if (!autoPlay) {
          const sentence = selectedStory.sentences[currentSentenceIndex]
          const nextIndex = currentSyllableIndex + 1
          if (nextIndex <= sentence.syllables.length - 1) {
            handleSyllableClick(nextIndex)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStory, storyCompleted, autoPlay, isJumping, currentSentenceIndex, currentSyllableIndex, sentenceCompleted])

  // Auto-play: automatisch door naar volgende lettergreep
  useEffect(() => {
    if (!autoPlay || isJumping || !selectedStory || storyCompleted || sentenceCompleted) return

    const sentence = selectedStory.sentences[currentSentenceIndex]
    const nextIndex = currentSyllableIndex + 1

    // Stop als er geen volgende lettergreep is
    if (nextIndex > sentence.syllables.length - 1) return

    // Automatisch de volgende lettergreep spelen
    const timer = setTimeout(() => {
      handleSyllableClick(nextIndex)
    }, autoPlaySpeed)

    return () => clearTimeout(timer)
  }, [autoPlay, currentSyllableIndex, isJumping, selectedStory, currentSentenceIndex, storyCompleted, sentenceCompleted, autoPlaySpeed])

  // Syllable timing functies
  const getSyllableTiming = (syllable) => {
    const s = syllable.toLowerCase()
    return syllableTimingsRef.current[s] || null // null = geen timing cutoff nodig
  }

  const adjustSyllableTiming = (syllable, delta, sentence = null, syllableIdx = null) => {
    const s = syllable.toLowerCase()
    const current = syllableTimingsRef.current[s] || 600
    const newTiming = Math.max(300, Math.min(1200, current + delta))
    const newTimings = { ...syllableTimingsRef.current, [s]: newTiming }
    syllableTimingsRef.current = newTimings
    setSyllableTimings(newTimings)
    // Sla alleen afwijkingen van defaults op
    const customTimings = {}
    Object.entries(newTimings).forEach(([k, v]) => {
      if (DEFAULT_TIMINGS[k] !== v) customTimings[k] = v
    })
    localStorage.setItem(TIMINGS_STORAGE_KEY, JSON.stringify(customTimings))

    // Test de nieuwe timing na 1 seconde
    if (sentence && syllableIdx !== null) {
      setTimeout(() => {
        testSyllableTiming(sentence, syllableIdx, newTiming)
      }, 500)
    }
    return newTiming
  }

  // Test functie - alleen visuele sprong, geen speech meer
  const testSyllableTiming = (sentence, syllableIdx, timing) => {
    // Niet meer nodig zonder syllable speech
  }

  // Syllable marking functies
  const getMarkKey = (storyId, sentenceIdx, syllableIdx) => {
    return `${storyId}-${sentenceIdx}-${syllableIdx}`
  }

  const markSyllable = (storyId, sentenceIdx, syllableIdx, isGood) => {
    const key = getMarkKey(storyId, sentenceIdx, syllableIdx)
    const newMarks = { ...syllableMarksRef.current, [key]: isGood }
    // Update ref direct (sync) zodat autoFill de juiste waarden ziet
    syllableMarksRef.current = newMarks
    setSyllableMarks(newMarks)
    localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify(newMarks))
  }

  const getSyllableMark = (storyId, sentenceIdx, syllableIdx) => {
    const key = getMarkKey(storyId, sentenceIdx, syllableIdx)
    return syllableMarksRef.current[key] // undefined, true, or false
  }

  // Auto-fill: markeer alle niet-gemarkeerde lettergrepen als goed
  // Gebruikt ref voor directe toegang tot laatste marks
  const autoFillMarks = (storyId, sentenceIdx, syllableCount) => {
    const newMarks = { ...syllableMarksRef.current }
    for (let i = 0; i < syllableCount; i++) {
      const key = getMarkKey(storyId, sentenceIdx, i)
      if (newMarks[key] === undefined) {
        newMarks[key] = 'good' // auto-fill als goed
      }
    }
    syllableMarksRef.current = newMarks
    setSyllableMarks(newMarks)
    localStorage.setItem(MARKS_STORAGE_KEY, JSON.stringify(newMarks))
  }

  const exportMarks = () => {
    const markLabels = {
      'english': '🇬🇧 Engels',
      'short': '⏱️ Te kort',
      'abbrev': '✗ Afkorting'
    }
    const badMarks = Object.entries(syllableMarksRef.current)
      .filter(([_, mark]) => mark !== 'good' && mark !== true) // exclude good marks
      .map(([key, mark]) => {
        const [storyId, sentIdx, sylIdx] = key.split('-').map(Number)
        const story = jumperStories[storyId]
        const sentence = story?.sentences[sentIdx]
        const syllable = sentence?.syllables[sylIdx]
        const label = markLabels[mark] || mark
        return `${label} | ${story?.title} | Zin ${sentIdx + 1} | "${syllable}"`
      })

    // Groepeer per type
    const grouped = badMarks.sort().join('\n')
    console.log('=== TTS PROBLEMEN ===\n' + grouped)
    navigator.clipboard?.writeText(grouped)
    alert(`${badMarks.length} problemen gekopieerd!`)
  }

  const resetGame = () => {
    setCurrentSentenceIndex(0)
    setCurrentSyllableIndex(-1) // Start op de grond
    setWorldOffset(0)
    setStoryCompleted(false)
    setSentenceCompleted(false)
    setIsJumping(false)
  }

  const handleBackToStories = () => {
    setSelectedStory(null)
    resetGame()
  }

  // Intro scherm
  if (showIntro) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl text-center page-transition">
        <div className="mb-6 flex justify-center">
          <div className="animate-bounce">
            <FrogSit />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-green-800">Lettergreep Springer</h2>
        <p className="text-xl mb-6 leading-relaxed">
          Help de kikker over de stenen springen!<br />
          Klik op elke <strong>letter-greep</strong> om te springen.<br />
          Luister goed naar de klank!
        </p>

        <div className="bg-lime-50 p-4 rounded-2xl mb-8 text-left">
          <p className="font-bold mb-2">🎯 Zo werkt het:</p>
          <ul className="space-y-1 text-sm opacity-80">
            <li>• De groene blokken zijn lettergrepen</li>
            <li>• Klik op het <strong>oplichtende</strong> blok</li>
            <li>• De kikker maakt een salto!</li>
            <li>• Lees de hele zin hardop mee!</li>
          </ul>
        </div>

        <button
          onClick={() => setShowIntro(false)}
          className="bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-lg transition transform hover:scale-105"
        >
          Start Springen!
        </button>
      </div>
    )
  }

  // Verhaal selector
  if (!selectedStory) {
    return (
      <StorySelector
        stories={jumperStories}
        completedStories={completedStories}
        onSelect={(story) => {
          setSelectedStory(story)
          resetGame()
        }}
        onBack={onBack}
      />
    )
  }

  // Verhaal voltooid
  if (storyCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 page-transition">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce">
            <FrogJump />
          </div>
        </div>
        <h2 className="text-4xl font-bold mb-4 text-green-700">
          {selectedStory.title} Voltooid!
        </h2>
        <p className="text-xl mb-2">🎉 Geweldig gedaan! 🎉</p>
        <p className="text-lg mb-8 opacity-70">
          +{JUMPER_STARS_PER_STORY} sterren verdiend!
        </p>
        <div className="flex gap-4">
          <button
            onClick={handleBackToStories}
            className="bg-white border-2 border-green-200 text-green-800 px-6 py-3 rounded-2xl font-bold hover:bg-green-50 transition"
          >
            Ander Verhaal
          </button>
          <button
            onClick={() => {
              resetGame()
              speak("Nog een keer!")
            }}
            className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-green-600 transition shadow-lg"
          >
            Nog een keer! 🔄
          </button>
        </div>
      </div>
    )
  }

  const currentSentence = selectedStory.sentences[currentSentenceIndex]

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto page-transition select-none">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 bg-white/50 p-4 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackToStories}
            className="flex items-center gap-2 opacity-60 hover:opacity-100 font-bold transition"
          >
            <ArrowLeft size={20} /> Stop
          </button>
          {/* Vorige lettergreep knop - ook terug naar huis vanaf blok 0 */}
          {currentSyllableIndex >= 0 && !isJumping && (
            <button
              onClick={() => setCurrentSyllableIndex(currentSyllableIndex - 1)}
              className="ml-4 flex items-center gap-1 bg-lime-100 text-lime-700 px-3 py-1 rounded-lg font-bold hover:bg-lime-200 transition"
            >
              ⬅️ {currentSyllableIndex === 0 ? '🏠' : 'Vorige'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-lime-100 text-lime-800 px-4 py-2 rounded-xl font-bold">
          <span>{selectedStory.icon}</span>
          <span>{selectedStory.title}</span>
          <span className="opacity-50">•</span>
          <span>Zin {currentSentenceIndex + 1}/{selectedStory.sentences.length}</span>
          <button onClick={() => setShowIntro(true)} className="ml-2 bg-white p-1 rounded-full">
            <Info size={16} />
          </button>
        </div>
      </div>

      {/* Auto-play controls */}
      <div className="w-full flex items-center justify-between gap-4 mb-4 bg-orange-50 p-3 rounded-xl">
        <div className="flex items-center gap-3">
          {sentenceCompleted ? (
            <button
              onClick={goToNextSentence}
              className="px-4 py-2 rounded-lg font-bold transition bg-green-500 text-white hover:bg-green-600 animate-pulse"
            >
              ➡️ Volgende zin
            </button>
          ) : (
            <>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-4 py-2 rounded-lg font-bold transition ${autoPlay ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}
              >
                {autoPlay ? '⏸ Pauze [spatie]' : '▶ Auto [spatie]'}
              </button>
              {!autoPlay && (
                <span className="text-sm text-gray-500">Enter = volgende</span>
              )}
            </>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Snelheid:</span>
            <input
              type="range"
              min="800"
              max="2500"
              step="100"
              value={autoPlaySpeed}
              onChange={(e) => setAutoPlaySpeed(Number(e.target.value))}
              className="w-16"
            />
          </div>
        </div>
        <button
          onClick={exportMarks}
          className="text-sm text-orange-600 hover:text-orange-800 underline"
        >
          Export fouten
        </button>
      </div>

      {/* Huidige zin */}
      <div className="bg-white rounded-2xl p-6 mb-8 w-full shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-gray-400">Lees hardop:</p>
          <button
            onClick={() => speak(currentSentence.text.replace(/-/g, ''))}
            className="p-2 bg-lime-100 rounded-full hover:bg-lime-200 transition"
          >
            <Volume2 size={20} className="text-lime-700" />
          </button>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-center text-gray-800">
          {currentSentence.text.replace(/-/g, '')}
        </p>
      </div>

      {/* Game wereld - Mario style platformer */}
      <div
        ref={containerRef}
        className="relative w-full bg-gradient-to-b from-sky-300 via-sky-400 to-sky-500 rounded-3xl overflow-hidden shadow-xl"
        style={{ height: '320px' }}
      >
        {/* Lucht achtergrond met wolken */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-[10%] text-4xl opacity-70 animate-float">☁️</div>
          <div className="absolute top-8 left-[60%] text-3xl opacity-50 animate-float" style={{animationDelay: '1s'}}>☁️</div>
          <div className="absolute top-2 left-[85%] text-2xl opacity-60 animate-float" style={{animationDelay: '2s'}}>☁️</div>
        </div>

        {/* Gras/grond onderaan */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-700 to-green-500" />

        {/* Scrollende wereld container */}
        <div
          className="absolute bottom-12 left-0 right-0 h-64 transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(calc(50% - ${worldOffset}px))`,
          }}
        >
          {/* Blokken met kikker erop */}
          <div className="flex items-end h-full" style={{ paddingLeft: '40px' }}>
            {/* Startplatform - kikker begint hier (index -1) */}
            <div className="relative flex flex-col items-center" style={{ marginRight: '24px' }}>
              {currentSyllableIndex === -1 && (
                <div className={`mb-1 ${(isJumping || isTesting) ? 'animate-jump-vertical' : ''}`}>
                  {(isJumping || isTesting) ? <FrogJump /> : <FrogSit />}
                </div>
              )}
              {currentSyllableIndex !== -1 && (
                <div className="mb-1" style={{ height: '80px' }} />
              )}
              {/* Startblok (grond) */}
              <div className="min-w-[60px] px-3 py-3 rounded-xl bg-amber-600 text-amber-200 text-sm font-bold"
                style={{ boxShadow: '0 4px 0 #92400e' }}>
                🏠
              </div>
            </div>

            {(() => {
              // Gebruik text om woordgrenzen te bepalen
              const words = currentSentence.text.split(' ')
              const syllables = currentSentence.syllables
              let syllableIdx = 0
              const elements = []

              words.forEach((word) => {
                // Tel hoeveel lettergrepen dit woord heeft (gebaseerd op streepjes)
                const syllableCount = word.split('-').filter(Boolean).length

                for (let sylInWord = 0; sylInWord < syllableCount; sylInWord++) {
                  const currentIdx = syllableIdx
                  const syllable = syllables[currentIdx]

                  // Eerste lettergreep van nieuw woord = grote gap
                  // Andere lettergrepen = kleine gap (dicht bij elkaar)
                  const marginLeft = currentIdx === 0 ? 24 : (sylInWord === 0 ? 48 : 4)

                  const isCurrentBlock = currentIdx === currentSyllableIndex
                  const isNextBlock = currentIdx === currentSyllableIndex + 1
                  const isCompleted = currentIdx < currentSyllableIndex && currentSyllableIndex >= 0

                  elements.push(
                    <div
                      key={currentIdx}
                      className="relative flex flex-col items-center"
                      style={{ marginLeft: `${marginLeft}px` }}
                    >
                      {/* Kikker staat BOVEN het huidige blok */}
                      {isCurrentBlock && currentSyllableIndex >= 0 && (
                        <div className="relative">
                          {/* Klikbare zone LINKS van kikker om achteruit te gaan */}
                          {currentSyllableIndex > 0 && !isJumping && (
                            <button
                              onClick={() => handleSyllableClick(currentSyllableIndex - 1)}
                              className="absolute -left-12 top-0 bottom-0 w-12 flex items-center justify-center text-2xl opacity-50 hover:opacity-100 transition"
                              title="Terug"
                            >
                              ⬅️
                            </button>
                          )}
                          <div className={`mb-1 ${(isJumping || isTesting) ? 'animate-jump-vertical' : ''}`}>
                            {(isJumping || isTesting) ? <FrogJump /> : <FrogSit />}
                          </div>
                        </div>
                      )}

                      {/* Placeholder voor hoogte als kikker er niet staat */}
                      {!(isCurrentBlock && currentSyllableIndex >= 0) && (
                        <div className="mb-1" style={{ height: '80px' }} />
                      )}

                      {/* Het blok/platform - VOLGENDE en VORIGE zijn klikbaar */}
                      <SteppingStone
                        syllable={syllable}
                        index={currentIdx}
                        isActive={isNextBlock && !isJumping}
                        isCompleted={isCompleted}
                        isCurrent={isCurrentBlock}
                        isPrevious={currentIdx === currentSyllableIndex - 1 && !isJumping}
                        onClick={() => handleSyllableClick(currentIdx)}
                      />

                      {/* Mark buttons - zichtbaar voor bezochte EN huidige lettergrepen */}
                      {(isCompleted || isCurrentBlock) && (
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); markSyllable(selectedStory.id, currentSentenceIndex, currentIdx, 'good') }}
                            className={`w-6 h-6 rounded text-xs transition ${
                              getSyllableMark(selectedStory.id, currentSentenceIndex, currentIdx) === 'good'
                                ? 'bg-green-500'
                                : 'bg-gray-200 hover:bg-green-200'
                            }`}
                            title="Goed"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); markSyllable(selectedStory.id, currentSentenceIndex, currentIdx, 'english') }}
                            className={`w-6 h-6 rounded text-xs transition ${
                              getSyllableMark(selectedStory.id, currentSentenceIndex, currentIdx) === 'english'
                                ? 'bg-blue-500'
                                : 'bg-gray-200 hover:bg-blue-200'
                            }`}
                            title="Engels"
                          >
                            🇬🇧
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); markSyllable(selectedStory.id, currentSentenceIndex, currentIdx, 'abbrev') }}
                            className={`w-6 h-6 rounded text-xs transition ${
                              getSyllableMark(selectedStory.id, currentSentenceIndex, currentIdx) === 'abbrev'
                                ? 'bg-red-500'
                                : 'bg-gray-200 hover:bg-red-200'
                            }`}
                            title="Afkorting"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                    </div>
                  )
                  syllableIdx++
                }
              })

              return elements
            })()}
          </div>
        </div>
      </div>

      {/* Voortgang indicator */}
      <div className="mt-6 flex gap-2">
        {selectedStory.sentences.map((_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index < currentSentenceIndex
                ? 'bg-green-500'
                : index === currentSentenceIndex
                  ? 'bg-yellow-400 scale-125'
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Hint */}
      <p className="mt-4 text-center opacity-60 text-sm">
        💡 Klik op het volgende blok om te springen!
      </p>
    </div>
  )
}
