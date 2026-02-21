import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProgress } from './hooks/useProgress'
import { useSettings } from './hooks/useSettings'
import { useStreak } from './hooks/useStreak'
import { useAchievements, ACHIEVEMENTS } from './hooks/useAchievements'
import { supabase } from './supabaseClient'
import { AchievementNotification } from './components/shared/AchievementNotification'

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
import { DMTMenu, DMTPractice, DMTTest, DMTResults } from './components/Games/DMT'
import { StoryMenu } from './components/Stories/StoryMenu'
import { StoryMaker } from './components/Stories/StoryMaker'
import { GeneratedStoryReader } from './components/Stories/GeneratedStoryReader'
import { SettingsView } from './components/SettingsView'
import { ParentalGate, ParentDashboard } from './components/Parent'

// Cache voor Nederlandse stem
let cachedNLVoice = null
let nlVoiceChecked = false

// Zoek beste Nederlandse stem
const getNLVoice = () => {
  if (cachedNLVoice) return cachedNLVoice
  if (typeof window === 'undefined') return null

  const voices = window.speechSynthesis?.getVoices() || []
  if (voices.length === 0) return null

  nlVoiceChecked = true

  // Probeer Fenna of Maarten eerst (Colette heeft afkortingen-bug)
  const fenna = voices.find(v => v.name.includes('Fenna'))
  const maarten = voices.find(v => v.name.includes('Maarten'))
  const nlNL = voices.find(v => v.lang === 'nl-NL' && !v.name.includes('Colette'))
  const anyNL = voices.find(v => v.lang.startsWith('nl'))

  cachedNLVoice = fenna || maarten || nlNL || anyNL || null
  console.log('Selected NL voice:', cachedNLVoice?.name || 'none (using lang=nl-NL)')
  return cachedNLVoice
}

// Update cache wanneer voices laden
if (typeof window !== 'undefined') {
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
    cachedNLVoice = null
    nlVoiceChecked = false
    getNLVoice()
  })
  // Trigger initieel laden
  getNLVoice()
}

// Speech helper - met optionele stopTime om TTS te stoppen na X ms
// Strategie: native Web Speech API met nl-NL als primair,
// ResponsiveVoice alleen als fallback wanneer native geen NL voice heeft
const speak = (text, stopTime = null) => {
  const cleanText = text.trim()
  if (!cleanText) return

  // Probeer native Web Speech API eerst
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(cleanText)

    // Altijd nl-NL forceren - dit werkt op de meeste browsers
    // zelfs zonder een specifiek genoemde NL voice
    utterance.lang = 'nl-NL'
    utterance.rate = 0.85
    utterance.pitch = 1.0

    const nlVoice = getNLVoice()
    if (nlVoice) {
      utterance.voice = nlVoice
      utterance.lang = nlVoice.lang
    }

    // Check: als we voices hebben gecheckt en geen NL gevonden,
    // probeer ResponsiveVoice als fallback
    if (nlVoiceChecked && !nlVoice && window.responsiveVoice) {
      window.responsiveVoice.cancel()
      window.responsiveVoice.speak(cleanText, 'Dutch Female', {
        rate: 0.9,
        pitch: 1.0,
      })
      if (stopTime) {
        setTimeout(() => window.responsiveVoice.cancel(), stopTime)
      }
      return
    }

    window.speechSynthesis.speak(utterance)

    if (stopTime) {
      setTimeout(() => window.speechSynthesis.cancel(), stopTime)
    }
    return
  }

  // Geen native speech - gebruik ResponsiveVoice
  if (window.responsiveVoice) {
    window.responsiveVoice.cancel()
    window.responsiveVoice.speak(cleanText, 'Dutch Female', {
      rate: 0.9,
      pitch: 1.0,
    })
    if (stopTime) {
      setTimeout(() => window.responsiveVoice.cancel(), stopTime)
    }
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
  const { streak, recordActivity } = useStreak(user?.id)
  const { earned: earnedAchievements, newAchievement, checkStats, dismissNotification, allAchievements } = useAchievements(user?.id)

  const [currentView, setCurrentView] = useState('dashboard')
  const [generatedStory, setGeneratedStory] = useState(null)
  const [dmtState, setDmtState] = useState({
    view: 'menu',
    aviLevel: 'e3',
    settings: {},
    withParent: false,
    results: null
  })

  // Sla gegenereerd verhaal op in database
  const saveGeneratedStory = async (story) => {
    if (!user?.id || !story) return
    try {
      await supabase.from('generated_stories').insert({
        user_id: user.id,
        title: story.title,
        content: story.content,
        fact: story.fact,
        hero: story.hero,
        place: story.place,
        item: story.item
      })
      console.log('Verhaal opgeslagen')
    } catch (err) {
      console.error('Verhaal opslaan mislukt:', err)
    }
  }

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

  // Props voor games - addStars met streak en achievement tracking
  const addStarsWithStreak = (amount) => {
    addStars(amount)
    recordActivity()
    // Check achievements na activiteit
    setTimeout(() => {
      checkStats({
        stars: stars + amount,
        streak: streak.current,
        storiesRead: (completedLevels.stories || []).length,
        gamesPlayed: (completedLevels.code_kraken || []).length + (completedLevels.troll || []).length,
        storiesMade: 0,
        perfectQuizzes: 0
      })
    }, 100)
  }

  const gameProps = {
    speak,
    addStars: addStarsWithStreak,
    onBack: () => setCurrentView('dashboard')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeClasses()} ${getFontClasses()}`}>
      <Header 
        stars={stars}
        streak={streak.current}
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
            onStoryGenerated={async (story) => {
              await saveGeneratedStory(story)
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

        {currentView === 'dmt' && dmtState.view === 'menu' && (
          <DMTMenu
            {...gameProps}
            onStartPractice={(aviLevel, settings) => {
              setDmtState({ view: 'practice', aviLevel, settings, withParent: false, results: null })
            }}
            onStartTest={(aviLevel, withParent) => {
              setDmtState({ view: 'test', aviLevel, settings: {}, withParent, results: null })
            }}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'dmt' && dmtState.view === 'practice' && (
          <DMTPractice
            {...gameProps}
            aviLevel={dmtState.aviLevel}
            settings={dmtState.settings}
            onComplete={(results) => {
              setDmtState(prev => ({ ...prev, view: 'results', results }))
            }}
            onBack={() => setDmtState(prev => ({ ...prev, view: 'menu' }))}
          />
        )}

        {currentView === 'dmt' && dmtState.view === 'test' && (
          <DMTTest
            {...gameProps}
            aviLevel={dmtState.aviLevel}
            withParent={dmtState.withParent}
            onComplete={(results) => {
              setDmtState(prev => ({ ...prev, view: 'results', results }))
            }}
            onBack={() => setDmtState(prev => ({ ...prev, view: 'menu' }))}
          />
        )}

        {currentView === 'dmt' && dmtState.view === 'results' && (
          <DMTResults
            {...gameProps}
            aviLevel={dmtState.aviLevel}
            mode={dmtState.results?.cards ? 'test' : 'practice'}
            results={dmtState.results}
            onPlayAgain={() => setDmtState(prev => ({ ...prev, view: 'menu' }))}
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
            achievements={earnedAchievements}
            allAchievements={allAchievements}
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

      {/* Achievement notification */}
      <AchievementNotification 
        achievement={newAchievement} 
        onDismiss={dismissNotification} 
      />
    </div>
  )
}

export default App
