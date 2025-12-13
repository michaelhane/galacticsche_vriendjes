import { useState } from 'react'
import { WeekWordsInput } from './WeekWordsInput'
import { ProgressCharts } from './ProgressCharts'
import { BookScanner } from './BookScanner'

/**
 * ParentDashboard - Hoofdcomponent voor ouder sectie
 * Bevat tabs voor weekwoorden, voortgang, scanner en instellingen
 */
export const ParentDashboard = ({ userId, profile, onBack }) => {
  const [activeTab, setActiveTab] = useState('progress')
  const [scannerSuccess, setScannerSuccess] = useState(null)

  const tabs = [
    { id: 'progress', label: 'Voortgang', icon: '📊' },
    { id: 'weekwords', label: 'Weekwoorden', icon: '📝' },
    { id: 'scanner', label: 'Scanner', icon: '📷' },
    { id: 'settings', label: 'Instellingen', icon: '⚙️' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span className="text-xl">←</span>
              <span>Terug naar app</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span>👨‍👩‍👧</span>
              Ouder Dashboard
            </h1>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors
                  border-b-2 -mb-px
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'progress' && (
          <ProgressCharts userId={userId} profile={profile} />
        )}

        {activeTab === 'weekwords' && (
          <WeekWordsInput userId={userId} />
        )}

        {activeTab === 'scanner' && (
          <>
            {scannerSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                ✓ {scannerSuccess} woorden toegevoegd aan weekwoorden!
              </div>
            )}
            <BookScanner
              userId={userId}
              onWordsAdded={(count) => {
                setScannerSuccess(count)
                setTimeout(() => setScannerSuccess(null), 5000)
              }}
            />
          </>
        )}

        {activeTab === 'settings' && (
          <ParentSettings userId={userId} profile={profile} />
        )}
      </div>
    </div>
  )
}

/**
 * ParentSettings - Instellingen sectie binnen ouder dashboard
 */
const ParentSettings = ({ userId, profile }) => {
  return (
    <div className="space-y-6">
      {/* Kind profiel info */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">👤</span>
          Profiel informatie
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">Naam</label>
            <p className="text-lg font-semibold text-gray-800">
              {profile?.display_name || '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Groep</label>
            <p className="text-lg font-semibold text-gray-800">
              Groep {profile?.grade || '-'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">AVI niveau</label>
            <p className="text-lg font-semibold text-gray-800">
              {profile?.avi_level || 'E3'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Account</label>
            <p className="text-lg font-semibold text-gray-800 truncate">
              {profile?.email || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* AVI niveau aanpassen */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          Leesniveau aanpassen
        </h2>

        <p className="text-gray-600 mb-4">
          Het AVI niveau bepaalt de moeilijkheidsgraad van de woorden in de spellen.
          Pas dit aan op basis van de toets resultaten van school.
        </p>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {['Start', 'M3', 'E3', 'M4', 'E4', 'M5/E5'].map(level => (
            <button
              key={level}
              className={`py-2 px-3 rounded-lg font-medium transition-colors
                ${(profile?.avi_level || 'E3').toLowerCase() === level.toLowerCase().replace('/', '-')
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {level}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mt-4">
          💡 Start met een lager niveau als je kind moeite heeft, en verhoog geleidelijk.
        </p>
      </div>

      {/* Interesses */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">⭐</span>
          Interesses
        </h2>

        <p className="text-gray-600 mb-4">
          Selecteer de interesses van je kind. Woorden uit deze categorieën worden
          vaker getoond in de spellen.
        </p>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'dieren', label: '🐾 Dieren' },
            { id: 'ruimte', label: '🚀 Ruimte' },
            { id: 'sport', label: '⚽ Sport' },
            { id: 'natuur', label: '🌳 Natuur' },
            { id: 'voertuigen', label: '🚗 Voertuigen' },
            { id: 'fantasie', label: '🦄 Fantasie' },
            { id: 'technologie', label: '💻 Technologie' },
            { id: 'muziek', label: '🎵 Muziek' },
            { id: 'eten', label: '🍕 Eten' },
            { id: 'superhelden', label: '🦸 Superhelden' }
          ].map(interest => {
            const isSelected = profile?.interests?.includes(interest.id)
            return (
              <button
                key={interest.id}
                className={`py-2 px-4 rounded-full font-medium transition-colors
                  ${isSelected
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {interest.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Data export */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📤</span>
          Gegevens exporteren
        </h2>

        <p className="text-gray-600 mb-4">
          Download alle voortgangsgegevens van je kind als CSV bestand.
        </p>

        <button className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg
          hover:bg-gray-200 transition-colors">
          Download voortgang (CSV)
        </button>
      </div>

      {/* Help */}
      <div className="bg-indigo-50 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-indigo-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">❓</span>
          Hulp nodig?
        </h2>

        <div className="space-y-3 text-indigo-700">
          <p>
            <strong>AVI niveaus uitgelegd:</strong><br />
            Start = Begin groep 3, M3 = Midden groep 3, E3 = Eind groep 3, etc.
          </p>
          <p>
            <strong>Weekwoorden:</strong><br />
            Voeg de spellingwoorden van school toe. Deze komen dan vaker voor in de spellen.
          </p>
          <p>
            <strong>Vragen of feedback?</strong><br />
            Neem contact op via{' '}
            <a href="mailto:support@galactischevrienden.nl" className="underline">
              support@galactischevrienden.nl
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ParentDashboard
