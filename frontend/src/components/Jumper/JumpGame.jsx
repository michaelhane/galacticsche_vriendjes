import { useState, useEffect, useRef } from 'react'
import { jumperStories } from '../../data/jumperStories'
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
  // Huidige, volgende en vorige blok zijn klikbaar
  const isClickable = isActive || isPrevious || isCurrent

  return (
    <button
      onClick={onClick}
      disabled={!isClickable && isCompleted}
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
          ? 'ring-2 ring-green-300 scale-100 cursor-pointer hover:scale-105'
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


export const JumpGame = ({ onBack, speak, addStars, completeLevel }) => {
  const [showIntro, setShowIntro] = useState(true)
  const [selectedStory, setSelectedStory] = useState(null)

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [currentSyllableIndex, setCurrentSyllableIndex] = useState(-1) // -1 = op de grond, nog niet gesprongen
  const [completedStories, setCompletedStories] = useState([])
  const [isJumping, setIsJumping] = useState(false)
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

  const handleSyllableClick = async (index) => {
    const sentence = selectedStory.sentences[currentSentenceIndex]

    // ACHTERUIT: klik op vorige blok om terug te springen
    if (index === currentSyllableIndex - 1 && !isJumping && currentSyllableIndex > 0) {
      setCurrentSyllableIndex(index)
      return
    }

    // VOORUIT: klik op volgende blok OF huidige blok om te springen
    const nextIndex = currentSyllableIndex + 1

    // Klik op huidige blok = spring naar volgende
    const clickedCurrent = index === currentSyllableIndex
    const clickedNext = index === nextIndex

    // Check of dit het huidige of volgende blok is en we niet al springen
    if ((!clickedCurrent && !clickedNext) || isJumping) return

    // Als we op laatste lettergreep staan en klikken, ga naar volgende zin
    if (nextIndex > sentence.syllables.length - 1) {
      if (clickedCurrent && sentenceCompleted) {
        goToNextSentence()
      }
      return
    }

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
        // Wacht even zodat kind de laatste lettergreep ziet
        await new Promise(resolve => setTimeout(resolve, 800))

        // Markeer zin als voltooid
        setSentenceCompleted(true)
      }
    }, 600)
  }

  // Sterren per 5 zinnen
  const STARS_PER_5_SENTENCES = 5

  // Handmatig naar volgende zin (of einde verhaal)
  const goToNextSentence = () => {
    // Reset sentence state
    setSentenceCompleted(false)

    const nextSentenceIndex = currentSentenceIndex + 1

    // Geef sterren elke 5 zinnen (zin 5, 10, 15, etc.)
    if (nextSentenceIndex % 5 === 0 && nextSentenceIndex > 0) {
      addStars(STARS_PER_5_SENTENCES)
      speak(`${STARS_PER_5_SENTENCES} sterren!`)
    }

    // Check of dit het laatste was
    if (currentSentenceIndex < selectedStory.sentences.length - 1) {
      setCurrentSentenceIndex(nextSentenceIndex)
      setCurrentSyllableIndex(-1) // Start op de grond
      setWorldOffset(0)
    } else {
      handleStoryComplete()
    }
  }

  // Bonus sterren aan het einde
  const COMPLETION_BONUS = 5

  const handleStoryComplete = () => {
    setStoryCompleted(true)
    setSentenceCompleted(false)
    setCompletedStories(prev => [...prev, selectedStory.id])

    // Geef bonus sterren voor voltooien
    addStars(COMPLETION_BONUS)

    // Markeer level als voltooid (zonder extra sterren, die zijn al gegeven)
    if (completeLevel) {
      completeLevel('jumper', selectedStory.id, 0)
    }

    speak("Fantastisch! Je hebt het verhaal uit!")
  }

  // Keyboard controls: Enter = volgende zin (wanneer zin af is)
  useEffect(() => {
    if (!selectedStory || storyCompleted) return

    const handleKeyDown = (e) => {
      // Enter = volgende zin
      if (e.code === 'Enter' && !isJumping && sentenceCompleted) {
        e.preventDefault()
        goToNextSentence()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedStory, storyCompleted, isJumping, sentenceCompleted])

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
          +{COMPLETION_BONUS} bonus sterren!
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

      {/* Volgende zin knop - alleen zichtbaar als zin af is */}
      {sentenceCompleted && (
        <div className="w-full flex justify-center mb-4">
          <button
            onClick={goToNextSentence}
            className="px-6 py-3 rounded-xl font-bold transition bg-green-500 text-white hover:bg-green-600 animate-pulse text-lg shadow-lg"
          >
            ➡️ Volgende zin
          </button>
        </div>
      )}

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
                <button
                  onClick={() => handleSyllableClick(0)}
                  disabled={isJumping}
                  className={`mb-1 ${isJumping ? 'animate-jump-vertical' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                >
                  {isJumping ? <FrogJump /> : <FrogSit />}
                </button>
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
                          <button
                            onClick={() => handleSyllableClick(currentSyllableIndex)}
                            disabled={isJumping}
                            className={`mb-1 ${isJumping ? 'animate-jump-vertical' : 'cursor-pointer hover:scale-110 transition-transform'}`}
                          >
                            {isJumping ? <FrogJump /> : <FrogSit />}
                          </button>
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
