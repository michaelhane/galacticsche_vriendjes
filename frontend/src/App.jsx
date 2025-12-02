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
import { GameMenu } from './components/CodeKraken/GameMenu'
import { TrollGame } from './components/Troll/TrollGame'
import { JumpGame } from './components/Jumper/JumpGame'
import { RewardShop } from './components/Shop/RewardShop'
import { StoryMenu } from './components/Stories/StoryMenu'
import { StoryMaker } from './components/Stories/StoryMaker'
import { GeneratedStoryReader } from './components/Stories/GeneratedStoryReader'
import { SettingsView } from './components/SettingsView'

// Speech helper
const speak = (text) => {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'nl-NL'
  utterance.rate = 0.85
  window.speechSynthesis.speak(utterance)
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
          <TrollGame {...gameProps} />
        )}

        {currentView === 'jumper' && (
          <JumpGame {...gameProps} />
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
      </main>
    </div>
  )
}

export default App
