import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSettings } from '../hooks/useSettings'
import { ArrowLeft, User, LogOut } from './shared/Icons'

// Interest options (same as ProfileSetup)
const INTEREST_OPTIONS = [
  { id: 'dinosaurussen', label: 'Dinosaurussen', icon: '🦕' },
  { id: 'ruimte', label: 'Ruimte', icon: '🚀' },
  { id: 'dieren', label: 'Dieren', icon: '🦁' },
  { id: 'voetbal', label: 'Voetbal', icon: '⚽' },
  { id: 'autos', label: "Auto's", icon: '🚗' },
  { id: 'prinsessen', label: 'Prinsessen', icon: '👸' },
  { id: 'superhelden', label: 'Superhelden', icon: '🦸' },
  { id: 'natuur', label: 'Natuur', icon: '🌳' },
  { id: 'robots', label: 'Robots', icon: '🤖' },
  { id: 'piraten', label: 'Piraten', icon: '🏴‍☠️' }
]

export const SettingsView = ({ onBack, profile }) => {
  const { signOut, updateProfile } = useAuth()
  const {
    settings,
    setTheme,
    setFontType,
    setTextSize,
    setLetterSpacing
  } = useSettings()

  const [interests, setInterests] = useState(profile?.interests || ['dinosaurussen', 'ruimte', 'dieren'])
  const [savingInterests, setSavingInterests] = useState(false)

  const toggleInterest = async (id) => {
    let newInterests
    if (interests.includes(id)) {
      if (interests.length <= 1) return // Keep at least 1
      newInterests = interests.filter(i => i !== id)
    } else {
      if (interests.length >= 5) return // Max 5
      newInterests = [...interests, id]
    }

    setInterests(newInterests)
    setSavingInterests(true)
    await updateProfile({ interests: newInterests })
    setSavingInterests(false)
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  return (
    <div className="max-w-xl mx-auto pb-10 page-transition">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack} 
          className="bg-white/50 p-2 rounded-full hover:bg-white/70 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Cockpit Instellingen</h2>
      </div>

      <div className="space-y-6">
        {/* Profiel Info */}
        <div className="bg-white/60 p-6 rounded-3xl border border-white/50 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <User size={20} /> Jouw Profiel
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-xl">{profile?.display_name}</p>
              <p className="opacity-60">
                Groep {profile?.grade} • {profile?.age} jaar
              </p>
            </div>
            <div className="text-4xl">👨‍🚀</div>
          </div>
        </div>

        {/* Interesses */}
        <div className="bg-white/60 p-6 rounded-3xl border border-white/50 shadow-sm">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            💖 Jouw Interesses
            {savingInterests && <span className="text-sm font-normal opacity-50">opslaan...</span>}
          </h3>
          <p className="text-sm opacity-60 mb-4">Tik om aan/uit te zetten (1-5)</p>
          <div className="grid grid-cols-2 gap-2">
            {INTEREST_OPTIONS.map(({ id, label, icon }) => {
              const isSelected = interests.includes(id)
              return (
                <button
                  key={id}
                  onClick={() => toggleInterest(id)}
                  disabled={savingInterests}
                  className={`p-2 rounded-xl text-left transition border-2 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-pink-100 border-pink-400'
                      : 'bg-white border-gray-200 hover:border-pink-200'
                  } ${savingInterests ? 'opacity-50' : ''}`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className={`font-bold text-sm ${isSelected ? 'text-pink-700' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {isSelected && <span className="ml-auto text-pink-500">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Kleur Thema */}
        <div className="bg-white/60 p-6 rounded-3xl border border-white/50 shadow-sm">
          <h3 className="font-bold mb-4">🎨 Kleur Thema</h3>
          <div className="flex gap-4 flex-wrap">
            {[
              { id: 'space-light', color: '#F0F4F8', name: 'Maanlicht' },
              { id: 'mars', color: '#FFF5F0', name: 'Mars Rood' },
              { id: 'white', color: '#ffffff', name: 'Helder Wit' },
              { id: 'deep-space', color: '#1a202c', name: 'Diepe Ruimte' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="flex flex-col items-center gap-2 transition-transform hover:scale-105"
              >
                <div
                  className={`w-14 h-14 rounded-2xl border-2 shadow-sm ${
                    settings.theme === t.id
                      ? 'border-indigo-500 ring-2 ring-offset-2 ring-indigo-300'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-xs font-bold opacity-70">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Lettertype */}
        <div className="bg-white/60 p-6 rounded-3xl border border-white/50 shadow-sm">
          <h3 className="font-bold mb-4">✏️ Lettertype</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFontType('sans')}
              className={`p-4 rounded-2xl border-2 font-sans transition ${
                settings.font_type === 'sans'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-transparent bg-white'
              }`}
            >
              Standaard
            </button>
            <button
              onClick={() => setFontType('comic')}
              className={`p-4 rounded-2xl border-2 transition font-comic ${
                settings.font_type === 'comic'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                  : 'border-transparent bg-white'
              }`}
            >
              Lees Letters
            </button>
          </div>
        </div>

        {/* Tekst Grootte */}
        <div className="bg-white/60 p-6 rounded-3xl border border-white/50 shadow-sm">
          <h3 className="font-bold mb-4">📏 Tekst Grootte</h3>
          <div className="flex gap-3">
            {['normal', 'large', 'xl'].map((size, idx) => (
              <button
                key={size}
                onClick={() => setTextSize(size)}
                className={`flex-1 py-3 rounded-xl font-bold border-2 transition ${
                  settings.text_size === size
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white border-gray-100 hover:border-indigo-200'
                }`}
              >
                <span style={{ fontSize: idx === 0 ? '1rem' : idx === 1 ? '1.25rem' : '1.5rem' }}>
                  Aa
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setLetterSpacing(!settings.letter_spacing)}
            className={`w-full mt-4 p-4 rounded-xl border-2 transition flex justify-between items-center ${
              settings.letter_spacing
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                : 'border-gray-100 bg-white'
            }`}
          >
            <span className="font-bold">Extra ruimte tussen letters</span>
            {settings.letter_spacing ? (
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs">
                ✓
              </div>
            ) : (
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
            )}
          </button>
        </div>

        {/* Uitloggen */}
        <button
          onClick={handleSignOut}
          className="w-full p-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-700 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
        >
          <LogOut size={20} />
          Uitloggen
        </button>
      </div>
    </div>
  )
}
