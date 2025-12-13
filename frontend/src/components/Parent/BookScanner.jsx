import { useState, useRef } from 'react'
import { supabase } from '../../supabaseClient'

/**
 * BookScanner - OCR component voor het scannen van boekpagina's
 * Haalt woorden uit foto's van schoolboeken en voegt ze toe als weekwoorden
 */
export const BookScanner = ({ userId, onWordsAdded }) => {
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [selectedWords, setSelectedWords] = useState([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3050'

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Selecteer een afbeelding (foto)')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Afbeelding is te groot (max 10MB)')
      return
    }

    setImage(file)
    setError(null)
    setResults(null)
    setSelectedWords([])

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  // Handle camera capture
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Scan image with OCR
  const handleScan = async () => {
    if (!image) return

    setScanning(true)
    setError(null)

    try {
      // Convert image to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result.split(',')[1])
        reader.readAsDataURL(image)
      })

      // Send to backend OCR endpoint
      const response = await fetch(`${API_URL}/api/ocr-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      })

      if (!response.ok) {
        throw new Error('OCR scan mislukt')
      }

      const data = await response.json()

      if (data.words && data.words.length > 0) {
        setResults(data)
        // Pre-select all words
        setSelectedWords(data.words.map(w => w.word))
      } else {
        setError('Geen woorden gevonden in de afbeelding. Probeer een duidelijkere foto.')
      }

    } catch (err) {
      console.error('OCR error:', err)
      setError('Kon de afbeelding niet scannen. Probeer opnieuw.')
    } finally {
      setScanning(false)
    }
  }

  // Toggle word selection
  const toggleWord = (word) => {
    setSelectedWords(prev =>
      prev.includes(word)
        ? prev.filter(w => w !== word)
        : [...prev, word]
    )
  }

  // Save selected words as week words
  const handleSaveWords = async () => {
    if (selectedWords.length === 0) return

    setSaving(true)
    setError(null)

    try {
      const activeUntil = new Date()
      activeUntil.setDate(activeUntil.getDate() + 14)

      // Get full word data for selected words
      const wordsToSave = results.words
        .filter(w => selectedWords.includes(w.word))
        .map(w => ({
          user_id: userId,
          word: w.word.toLowerCase(),
          syllables: w.syllables || [w.word],
          stress_index: 0,
          added_by: 'scan',
          active_until: activeUntil.toISOString().split('T')[0]
        }))

      // Upsert words (ignore duplicates)
      const { error: saveError } = await supabase
        .from('week_words')
        .upsert(wordsToSave, { onConflict: 'user_id,word' })

      if (saveError) throw saveError

      // Success - reset state
      setImage(null)
      setImagePreview(null)
      setResults(null)
      setSelectedWords([])

      onWordsAdded?.(wordsToSave.length)

    } catch (err) {
      console.error('Save error:', err)
      setError('Kon woorden niet opslaan. Probeer opnieuw.')
    } finally {
      setSaving(false)
    }
  }

  // Reset scanner
  const handleReset = () => {
    setImage(null)
    setImagePreview(null)
    setResults(null)
    setSelectedWords([])
    setError(null)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">📷</span>
        Boek Scanner
      </h2>

      <p className="text-gray-600 mb-6">
        Maak een foto van een pagina uit het schoolboek.
        De app herkent de woorden en voegt ze toe aan de weekwoorden.
      </p>

      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* No image selected */}
      {!imagePreview && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-gray-600 mb-4">
            Maak een foto of selecteer een afbeelding
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleCameraCapture}
              className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-xl
                hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>📷</span> Maak foto
            </button>
            <label className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl
              hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center gap-2">
              <span>📁</span> Kies bestand
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && !results && (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-80 object-contain bg-gray-50"
            />
            <button
              onClick={handleReset}
              className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-600 font-semibold
                rounded-xl hover:bg-gray-50 transition-colors"
            >
              Andere foto
            </button>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-500
                text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600
                disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Scannen...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Scan woorden
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scan results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Gevonden woorden ({results.words.length})
            </h3>
            <button
              onClick={() => {
                if (selectedWords.length === results.words.length) {
                  setSelectedWords([])
                } else {
                  setSelectedWords(results.words.map(w => w.word))
                }
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {selectedWords.length === results.words.length ? 'Deselecteer alles' : 'Selecteer alles'}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-xl p-3">
            <div className="flex flex-wrap gap-2">
              {results.words.map((wordData, i) => {
                const isSelected = selectedWords.includes(wordData.word)
                return (
                  <button
                    key={i}
                    onClick={() => toggleWord(wordData.word)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-400'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    {wordData.word}
                    {wordData.syllables && (
                      <span className="text-xs ml-1 opacity-60">
                        ({wordData.syllables.join('-')})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <p className="text-sm text-gray-500">
            {selectedWords.length} woorden geselecteerd
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 py-3 px-6 border border-gray-300 text-gray-600 font-semibold
                rounded-xl hover:bg-gray-50 transition-colors"
            >
              Opnieuw scannen
            </button>
            <button
              onClick={handleSaveWords}
              disabled={saving || selectedWords.length === 0}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500
                text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600
                disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Opslaan...
                </>
              ) : (
                <>
                  <span>✓</span>
                  Voeg toe ({selectedWords.length})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          {error}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-amber-50 rounded-xl">
        <h4 className="font-semibold text-amber-800 mb-2">📌 Tips voor betere resultaten</h4>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Zorg voor goede belichting</li>
          <li>• Houd de camera stil en recht boven de tekst</li>
          <li>• Gebruik gedrukte tekst (geen handschrift)</li>
          <li>• Vermijd glanzende pagina's met reflecties</li>
        </ul>
      </div>
    </div>
  )
}

export default BookScanner
