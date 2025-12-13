import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProgress } from './hooks/useProgress'
import { useSettings } from './hooks/useSettings'

// Auth components
import { Login } from './components/Auth/Login'
import { ProfileSetup } from './components/Auth/ProfileSetup'

// Game components
import { Dashboard } from './components/Dashboard'
import { Header } from './components/shared/Header'
import { BugReporter } from './components/shared/BugReporter'
import { GameMenu } from './components/CodeKraken/GameMenu'
import { TrollGame } from './components/Troll/TrollGame'
import { JumpGame } from './components/Jumper/JumpGame'
import { RewardShop } from './components/Shop/RewardShop'
import { StoryMenu } from './components/Stories/StoryMenu'
import { StoryMaker } from './components/Stories/StoryMaker'
import { GeneratedStoryReader } from './components/Stories/GeneratedStoryReader'
import { SettingsView } from './components/SettingsView'
import { ParentalGate, ParentDashboard } from './components/Parent'

// Test of native speech werkt (eenmalig)
let useResponsiveVoice = false
const testNativeSpeech = () => {
  if (typeof window === 'undefined') return
  // Check of voices beschikbaar zijn
  const voices = window.speechSynthesis?.getVoices() || []
  const hasNLVoice = voices.some(v => v.lang.includes('nl'))
  // Op Android/Samsung werkt native TTS vaak niet goed
  const isAndroid = /Android/i.test(navigator.userAgent)
  const isSamsung = /Samsung/i.test(navigator.userAgent)
  useResponsiveVoice = !hasNLVoice || isAndroid || isSamsung
}
// Test bij laden en na voices loaded
if (typeof window !== 'undefined') {
  testNativeSpeech()
  window.speechSynthesis?.addEventListener?.('voiceschanged', testNativeSpeech)
}

// Cache voor Nederlandse stem
let cachedNLVoice = null

// Zoek beste Nederlandse stem - probeer Fenna of Maarten (niet Colette die afkortingen raar doet)
const getNLVoice = () => {
  if (cachedNLVoice) return cachedNLVoice

  const voices = window.speechSynthesis?.getVoices() || []

  // Probeer Fenna of Maarten eerst (Colette heeft afkortingen-bug)
  const fenna = voices.find(v => v.name.includes('Fenna'))
  const maarten = voices.find(v => v.name.includes('Maarten'))
  const nlNL = voices.find(v => v.lang === 'nl-NL' && !v.name.includes('Colette'))
  const anyNL = voices.find(v => v.lang === 'nl-NL')

  cachedNLVoice = fenna || maarten || nlNL || anyNL || null
  console.log('Selected voice:', cachedNLVoice?.name)
  return cachedNLVoice
}

// Update cache wanneer voices laden
if (typeof window !== 'undefined') {
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
    cachedNLVoice = null
    getNLVoice()
  })
}

// Speech helper - met optionele stopTime om TTS te stoppen na X ms
const speak = (text, stopTime = null) => {
  // Clean de tekst
  const cleanText = text.trim()
  console.log('TTS speak:', cleanText, stopTime ? `(stop na ${stopTime}ms)` : '') // DEBUG

  // Probeer ResponsiveVoice eerst (betrouwbaarder)
  if (window.responsiveVoice) {
    window.responsiveVoice.cancel()
    window.responsiveVoice.speak(cleanText, 'Dutch Female', {
      rate: 0.9,
      pitch: 1.0,
    })

    // Stop na bepaalde tijd als stopTime is meegegeven
    if (stopTime) {
      setTimeout(() => {
        window.responsiveVoice.cancel()
      }, stopTime)
    }
    return
  }

  // Fallback naar native Web Speech API
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(cleanText)

  // Forceer Nederlands
  utterance.lang = 'nl-NL'
  utterance.rate = 0.8
  utterance.pitch = 1.0

  const nlVoice = getNLVoice()
  if (nlVoice) {
    utterance.voice = nlVoice
    utterance.lang = nlVoice.lang
  }

  window.speechSynthesis.speak(utterance)

  // Stop na bepaalde tijd als stopTime is meegegeven
  if (stopTime) {
    setTimeout(() => {
      window.speechSynthesis.cancel()
    }, stopTime)
  }
}

function App() {
  const { user, profile, loading: authLoading, hasProfile } = useAuth()
  const { 
    stars, addStars, 
    completedLevels, completeLevel, isLevelUnlocked,
    unlockedItems, purchaseItem,
    loading: progressLoading 
  } = useProgress()
  const { getThemeClasses, getFontClasses } = useSettings()

  const [currentView, setCurrentView] = useState('dashboard')
  const [generatedStory, setGeneratedStory] = useState(null)

  // Loading state
  if (authLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-8xl mb-6 animate-bounce">🚀</div>
          <p className="text-xl">Laden...</p>
        </div>
      </div>
    )
  }

  // Niet ingelogd → Login scherm
  if (!user) {
    return <Login />
  }

  // Ingelogd maar geen profiel → Setup
  if (!hasProfile) {
    return <ProfileSetup onComplete={() => window.location.reload()} />
  }

  // Props voor games
  const gameProps = {
    speak,
    addStars,
    onBack: () => setCurrentView('dashboard')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeClasses()} ${getFontClasses()}`}>
      <Header 
        stars={stars} 
        profile={profile}
        onSettingsClick={() => setCurrentView('settings')}
        onLogoClick={() => setCurrentView('dashboard')}
      />

      <main className="max-w-4xl mx-auto p-4 md:p-8 pb-20 page-transition">
        {currentView === 'dashboard' && (
          <Dashboard 
            setView={setCurrentView} 
            speak={speak}
            profile={profile}
          />
        )}

        {currentView === 'game' && (
          <GameMenu 
            {...gameProps}
            completedLevels={completedLevels.code_kraken || []}
            isLevelUnlocked={(id) => isLevelUnlocked('code_kraken', id)}
            onLevelComplete={(id, starsEarned) => completeLevel('code_kraken', id, starsEarned)}
          />
        )}

        {currentView === 'troll' && (
          <TrollGame {...gameProps} completeLevel={completeLevel} />
        )}

        {currentView === 'jumper' && (
          <JumpGame {...gameProps} completeLevel={completeLevel} />
        )}

        {currentView === 'reader' && (
          <StoryMenu
            {...gameProps}
            completedStories={completedLevels.stories || []}
            onStoryComplete={(id) => completeLevel('stories', id, 10)}
          />
        )}

        {currentView === 'story-maker' && (
          <StoryMaker 
            {...gameProps}
            unlockedItems={unlockedItems}
            gradeLevel={profile?.grade || 3}
            onStoryGenerated={(story) => {
              setGeneratedStory(story)
              setCurrentView('generated-reader')
            }}
          />
        )}

        {currentView === 'rewards' && (
          <RewardShop 
            {...gameProps}
            stars={stars}
            unlockedItems={unlockedItems}
            onPurchase={purchaseItem}
          />
        )}

        {currentView === 'generated-reader' && (
          <GeneratedStoryReader
            story={generatedStory}
            {...gameProps}
            onBack={() => setCurrentView('story-maker')}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            onBack={() => setCurrentView('dashboard')}
            profile={profile}
          />
        )}

        {currentView === 'parent-gate' && (
          <ParentalGate
            onSuccess={() => setCurrentView('parent-dashboard')}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'parent-dashboard' && (
          <ParentDashboard
            userId={user?.id}
            profile={profile}
            onBack={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Bug reporter voor TTS problemen */}
      <BugReporter />
    </div>
  )
}

export default App
