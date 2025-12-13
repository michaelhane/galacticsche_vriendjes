import { useState, useEffect } from 'react'

// Bug icoon
const BugIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path d="M12 2a3 3 0 0 0-3 3v1H6a2 2 0 0 0-2 2v1h16V8a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z"/>
    <path d="M4 11v5a8 8 0 0 0 16 0v-5"/>
    <path d="M9 22v-3m6 3v-3"/>
    <path d="M4 11H2m20 0h-2"/>
    <path d="M4 15H2m20 0h-2"/>
  </svg>
)

const STORAGE_KEY = 'tts-bugs'

export const BugReporter = ({ currentWord = '', currentSyllable = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [word, setWord] = useState('')
  const [syllable, setSyllable] = useState('')
  const [issue, setIssue] = useState('')
  const [bugs, setBugs] = useState([])
  const [showList, setShowList] = useState(false)

  // Laad bugs uit localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setBugs(JSON.parse(saved))
    }
  }, [])

  // Update woord/lettergreep als die verandert
  useEffect(() => {
    if (currentWord) setWord(currentWord)
    if (currentSyllable) setSyllable(currentSyllable)
  }, [currentWord, currentSyllable])

  const saveBug = () => {
    if (!word && !syllable) return

    const newBug = {
      id: Date.now(),
      word,
      syllable,
      issue,
      timestamp: new Date().toISOString()
    }

    const updated = [...bugs, newBug]
    setBugs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Reset form
    setWord('')
    setSyllable('')
    setIssue('')
    setIsOpen(false)
  }

  const deleteBug = (id) => {
    const updated = bugs.filter(b => b.id !== id)
    setBugs(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const exportBugs = () => {
    const text = bugs.map(b =>
      `${b.word} | ${b.syllable} | ${b.issue}`
    ).join('\n')
    console.log('=== TTS BUGS ===\n' + text)
    navigator.clipboard?.writeText(text)
    alert('Bugs gekopieerd naar clipboard en console!')
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg z-50"
        title="Rapporteer TTS probleem"
      >
        <BugIcon />
        {bugs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {bugs.length}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">🐛 TTS Probleem Melden</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Woord</label>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-gray-800"
                  placeholder="bijv. motor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lettergreep</label>
                <input
                  type="text"
                  value={syllable}
                  onChange={(e) => setSyllable(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-gray-800"
                  placeholder="bijv. mo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wat ging er mis?</label>
                <input
                  type="text"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-gray-800"
                  placeholder="bijv. klinkt als 'molideen'"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveBug}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium"
              >
                Opslaan
              </button>
              <button
                onClick={() => setShowList(!showList)}
                className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
              >
                Lijst ({bugs.length})
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg"
              >
                Sluiten
              </button>
            </div>

            {/* Bug lijst */}
            {showList && bugs.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Gemelde bugs:</h3>
                  <button
                    onClick={exportBugs}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Exporteer
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {bugs.map(bug => (
                    <div key={bug.id} className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm">
                      <span className="text-gray-800">
                        <strong>{bug.word}</strong> → {bug.syllable}: {bug.issue}
                      </span>
                      <button
                        onClick={() => deleteBug(bug.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
