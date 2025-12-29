import { useState, useEffect, useRef } from 'react'
import { readerStories, READER_STARS_PER_STORY } from '../../data/readerStories'
import { ArrowLeft, Volume2, Play, Pause, Lock, ArrowRight, Info } from '../shared/Icons'

// Reading Ruler Component - beweegt mee met de zin
const ReadingRuler = ({ top, height, visible }) => {
  if (!visible) return null
  
  return (
    <>
      {/* Donkere overlay boven */}
      <div 
        className="absolute left-0 right-0 top-0 bg-black/40 transition-all duration-300 pointer-events-none"
        style={{ height: `${top}px` }}
      />
      {/* Donkere overlay onder */}
      <div 
        className="absolute left-0 right-0 bottom-0 bg-black/40 transition-all duration-300 pointer-events-none"
        style={{ top: `${top + height}px` }}
      />
      {/* Gele highlight balk */}
      <div 
        className="absolute left-0 right-0 bg-yellow-200/30 border-y-2 border-yellow-400 transition-all duration-300 pointer-events-none"
        style={{ top: `${top - 4}px`, height: `${height + 8}px` }}
      />
    </>
  )
}

// Story Selector
const StorySelector = ({ stories, completedStories, onSelect, onBack }) => {
  const isUnlocked = (storyId) => {
    if (storyId === 0) return true
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
                  ? 'bg-white hover:bg-blue-50 shadow-sm border-2 border-blue-100 hover:border-blue-300'
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
              {unlocked && (
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  completed 
                    ? 'bg-gray-100 text-gray-500' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {completed ? 'Opnieuw' : 'Lezen'}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Story Reader Component
const StoryReader = ({ story, onBack, onComplete, speak }) => {
  const [currentSentence, setCurrentSentence] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showRuler, setShowRuler] = useState(true)
  const [completed, setCompleted] = useState(false)
  const [rulerPosition, setRulerPosition] = useState({ top: 0, height: 40 })
  const sentenceRefs = useRef([])
  const containerRef = useRef(null)

  // Update ruler positie wanneer zin verandert
  useEffect(() => {
    const ref = sentenceRefs.current[currentSentence]
    const container = containerRef.current
    
    if (ref && container) {
      const containerRect = container.getBoundingClientRect()
      const sentenceRect = ref.getBoundingClientRect()
      
      setRulerPosition({
        top: sentenceRect.top - containerRect.top,
        height: sentenceRect.height
      })

      // Scroll naar huidige zin
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentSentence])

  // Auto-play logica
  useEffect(() => {
    let timer
    if (isPlaying && currentSentence < story.sentences.length) {
      // Spreek huidige zin uit
      speak(story.sentences[currentSentence])
      
      // Bereken wachttijd (ongeveer 100ms per karakter + basis)
      const waitTime = 1500 + story.sentences[currentSentence].length * 60
      
      timer = setTimeout(() => {
        if (currentSentence < story.sentences.length - 1) {
          setCurrentSentence(prev => prev + 1)
        } else {
          setIsPlaying(false)
          setCompleted(true)
          onComplete()
        }
      }, waitTime)
    }
    
    return () => clearTimeout(timer)
  }, [isPlaying, currentSentence, story])

  const handleSentenceClick = (index) => {
    setCurrentSentence(index)
    setIsPlaying(false)
    // Niet automatisch voorlezen - kind leest zelf
  }

  const handleNext = () => {
    if (currentSentence < story.sentences.length - 1) {
      setCurrentSentence(prev => prev + 1)
      // Niet automatisch voorlezen - kind leest zelf
    } else {
      setCompleted(true)
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentSentence > 0) {
      setCurrentSentence(prev => prev - 1)
      // Niet automatisch voorlezen - kind leest zelf
    }
  }

  // Completed screen
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 page-transition">
        <div className="text-8xl mb-6">📚✨</div>
        <h2 className="text-4xl font-bold mb-4 text-blue-700">
          Verhaal Uit!
        </h2>
        <p className="text-xl mb-4 opacity-70">
          +{READER_STARS_PER_STORY} sterren verdiend!
        </p>
        
        {/* Weetje */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8 max-w-md">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="text-left">
              <p className="font-bold text-yellow-800 mb-1">Wist je dat?</p>
              <p className="text-yellow-900">{story.fact}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="bg-white border-2 border-blue-200 text-blue-800 px-6 py-3 rounded-2xl font-bold hover:bg-blue-50 transition"
          >
            Ander Verhaal
          </button>
          <button
            onClick={() => {
              setCurrentSentence(0)
              setCompleted(false)
              speak("Nog een keer!")
            }}
            className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition shadow-lg"
          >
            Nog een keer! 🔄
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto page-transition">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 bg-white/50 p-4 rounded-2xl">
        <button onClick={onBack} className="flex items-center gap-2 opacity-60 hover:opacity-100 font-bold">
          <ArrowLeft size={20} /> Terug
        </button>
        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-xl font-bold">
          <span>{story.icon}</span>
          <span>{story.title}</span>
        </div>
        <button 
          onClick={() => setShowRuler(!showRuler)}
          className={`p-2 rounded-full transition ${showRuler ? 'bg-yellow-200' : 'bg-gray-100'}`}
          title="Leesliniaal aan/uit"
        >
          📏
        </button>
      </div>

      {/* Verhaal container */}
      <div 
        ref={containerRef}
        className="bg-white rounded-3xl p-8 shadow-xl relative overflow-hidden min-h-[400px]"
      >
        <ReadingRuler 
          top={rulerPosition.top} 
          height={rulerPosition.height}
          visible={showRuler}
        />

        <div className="space-y-6 relative z-10">
          {story.sentences.map((sentence, index) => (
            <p
              key={index}
              ref={el => sentenceRefs.current[index] = el}
              onClick={() => handleSentenceClick(index)}
              className={`
                text-2xl md:text-3xl leading-relaxed cursor-pointer
                transition-all duration-300 p-2 rounded-xl
                ${index === currentSentence 
                  ? 'text-blue-900 font-bold scale-105' 
                  : index < currentSentence
                    ? 'text-gray-400'
                    : 'text-gray-600 hover:text-gray-800'
                }
              `}
            >
              {sentence}
            </p>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentSentence === 0}
          className={`p-3 rounded-full transition ${
            currentSentence === 0 
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
              : 'bg-white hover:bg-blue-50 text-blue-600 shadow-sm'
          }`}
        >
          <ArrowLeft size={24} />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`
            p-4 rounded-full text-white shadow-lg transition transform hover:scale-105
            ${isPlaying 
              ? 'bg-orange-500 hover:bg-orange-600' 
              : 'bg-blue-500 hover:bg-blue-600'
            }
          `}
        >
          {isPlaying ? <Pause size={28} /> : <Play size={28} />}
        </button>

        <button
          onClick={() => speak(story.sentences[currentSentence])}
          className="p-3 rounded-full bg-white hover:bg-blue-50 text-blue-600 shadow-sm transition"
        >
          <Volume2 size={24} />
        </button>

        <button
          onClick={handleNext}
          className="p-3 rounded-full bg-white hover:bg-blue-50 text-blue-600 shadow-sm transition"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Progress */}
      <div className="mt-6 flex justify-center gap-2">
        {story.sentences.map((_, index) => (
          <div
            key={index}
            onClick={() => handleSentenceClick(index)}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
              index < currentSentence
                ? 'bg-blue-500'
                : index === currentSentence
                  ? 'bg-yellow-400 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* Tip */}
      <p className="mt-4 text-center opacity-50 text-sm">
        💡 Klik op een zin om daar te beginnen • Druk ▶ voor automatisch voorlezen
      </p>
    </div>
  )
}

// Main StoryMenu Component
export const StoryMenu = ({ onBack, speak, addStars, completedStories = [], onStoryComplete }) => {
  const [selectedStory, setSelectedStory] = useState(null)
  const [localCompleted, setLocalCompleted] = useState(completedStories)

  const handleComplete = () => {
    if (selectedStory && !localCompleted.includes(selectedStory.id)) {
      setLocalCompleted(prev => [...prev, selectedStory.id])
      addStars(READER_STARS_PER_STORY)
      onStoryComplete?.(selectedStory.id)
    }
  }

  if (selectedStory) {
    return (
      <StoryReader
        story={selectedStory}
        onBack={() => setSelectedStory(null)}
        onComplete={handleComplete}
        speak={speak}
      />
    )
  }

  return (
    <StorySelector
      stories={readerStories}
      completedStories={localCompleted}
      onSelect={setSelectedStory}
      onBack={onBack}
    />
  )
}
