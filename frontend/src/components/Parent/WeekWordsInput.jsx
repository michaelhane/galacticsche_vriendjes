import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

/**
 * WeekWordsInput - Component voor ouders om weekwoorden in te voeren
 * Woorden kunnen handmatig worden ingevoerd of later via OCR scanner
 */
export const WeekWordsInput = ({ userId, onWordsUpdated }) => {
  const [weekWords, setWeekWords] = useState([])
  const [newWord, setNewWord] = useState('')
  const [syllables, setSyllables] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Laad bestaande weekwoorden
  useEffect(() => {
    loadWeekWords()
  }, [userId])

  const loadWeekWords = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('week_words')
        .select('*')
        .eq('user_id', userId)
        .gte('active_until', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })

      if (error) throw error
      setWeekWords(data || [])
    } catch (err) {
      console.error('Error loading week words:', err)
      setError('Kon weekwoorden niet laden')
    } finally {
      setLoading(false)
    }
  }

  // Automatisch lettergrepen splitsen (eenvoudige benadering)
  const autoSplitSyllables = (word) => {
    // Verwijder spaties en maak lowercase
    const cleanWord = word.toLowerCase().trim()

    // Simpele Nederlandse lettergreep patronen
    // Dit is een benadering - ouders kunnen het aanpassen
    const vowels = ['a', 'e', 'i', 'o', 'u', 'ij', 'ei', 'au', 'ou', 'eu', 'ui', 'oe', 'ie', 'aa', 'ee', 'oo', 'uu']

    // Voor nu: laat ouders handmatig splitsen met streepjes
    return cleanWord
  }

  const handleWordChange = (e) => {
    const word = e.target.value
    setNewWord(word)

    // Auto-suggest lettergrepen als er nog geen zijn
    if (!syllables && word.length > 2) {
      // Placeholder: ouders vullen zelf in met streepjes
    }
  }

  const handleAddWord = async (e) => {
    e.preventDefault()

    if (!newWord.trim()) {
      setError('Vul een woord in')
      return
    }

    if (!syllables.trim()) {
      setError('Vul de lettergrepen in (gescheiden door streepjes)')
      return
    }

    // Parse syllables
    const syllableArray = syllables.split('-').map(s => s.trim().toLowerCase()).filter(s => s)

    if (syllableArray.length === 0) {
      setError('Vul geldige lettergrepen in')
      return
    }

    // Valideer dat lettergrepen het woord vormen
    const joinedSyllables = syllableArray.join('')
    const cleanWord = newWord.toLowerCase().trim()

    if (joinedSyllables !== cleanWord) {
      setError(`Lettergrepen "${syllableArray.join('-')}" vormen niet "${cleanWord}"`)
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Bereken active_until (einde van de week + 1 week extra)
      const activeUntil = new Date()
      activeUntil.setDate(activeUntil.getDate() + 14) // 2 weken actief

      const { data, error } = await supabase
        .from('week_words')
        .upsert({
          user_id: userId,
          word: cleanWord,
          syllables: syllableArray,
          stress_index: 0, // Default, kan later worden aangepast
          added_by: 'parent',
          active_until: activeUntil.toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,word'
        })
        .select()

      if (error) throw error

      setSuccess(`"${cleanWord}" is toegevoegd!`)
      setNewWord('')
      setSyllables('')

      // Refresh de lijst
      await loadWeekWords()
      onWordsUpdated?.()

      // Clear success message na 3 seconden
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Error adding word:', err)
      setError('Kon woord niet toevoegen')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWord = async (wordId) => {
    try {
      const { error } = await supabase
        .from('week_words')
        .delete()
        .eq('id', wordId)

      if (error) throw error

      await loadWeekWords()
      onWordsUpdated?.()
    } catch (err) {
      console.error('Error deleting word:', err)
      setError('Kon woord niet verwijderen')
    }
  }

  const handleExtendWord = async (wordId) => {
    try {
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + 14)

      const { error } = await supabase
        .from('week_words')
        .update({ active_until: newDate.toISOString().split('T')[0] })
        .eq('id', wordId)

      if (error) throw error

      await loadWeekWords()
      setSuccess('Woord verlengd met 2 weken')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error extending word:', err)
      setError('Kon woord niet verlengen')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">📝</span>
        Weekwoorden
      </h2>

      <p className="text-gray-600 mb-6">
        Voeg de spellingwoorden van school toe. Deze worden extra geoefend in de spellen!
      </p>

      {/* Add word form */}
      <form onSubmit={handleAddWord} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Woord
            </label>
            <input
              type="text"
              value={newWord}
              onChange={handleWordChange}
              placeholder="bijv. vliegtuig"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
                focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lettergrepen (met streepjes)
            </label>
            <input
              type="text"
              value={syllables}
              onChange={(e) => setSyllables(e.target.value)}
              placeholder="bijv. vlieg-tuig"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2
                focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Error/Success messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || !newWord || !syllables}
          className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500
            text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {saving ? 'Opslaan...' : '+ Woord toevoegen'}
        </button>
      </form>

      {/* Existing words */}
      <div className="border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-3">
          Actieve weekwoorden ({weekWords.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            Laden...
          </div>
        ) : weekWords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            Nog geen weekwoorden toegevoegd
          </div>
        ) : (
          <div className="space-y-2">
            {weekWords.map((word) => (
              <div
                key={word.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{word.word}</span>
                  <span className="ml-2 text-gray-500 text-sm">
                    ({word.syllables.join('-')})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    tot {new Date(word.active_until).toLocaleDateString('nl-NL')}
                  </span>
                  <button
                    onClick={() => handleExtendWord(word.id)}
                    className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"
                    title="Verleng met 2 weken"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => handleDeleteWord(word.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Verwijderen"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
        <h4 className="font-semibold text-indigo-800 mb-2">💡 Tips</h4>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• Gebruik streepjes om lettergrepen te scheiden: <code className="bg-indigo-100 px-1 rounded">ver-jaar-dag</code></li>
          <li>• Weekwoorden worden 2 weken actief gehouden</li>
          <li>• De woorden verschijnen vaker in Code Kraken en Lettergreep Springer</li>
        </ul>
      </div>
    </div>
  )
}

export default WeekWordsInput
