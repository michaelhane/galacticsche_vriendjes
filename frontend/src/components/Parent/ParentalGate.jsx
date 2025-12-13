import { useState, useEffect } from 'react'

/**
 * ParentalGate - Eenvoudige rekensom beveiliging voor ouder-sectie
 * Voorkomt dat kinderen per ongeluk in het ouder dashboard komen
 */
export const ParentalGate = ({ onSuccess, onCancel }) => {
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Genereer een nieuwe rekensom
  const generateQuestion = () => {
    // Maak het moeilijk genoeg voor kinderen, maar makkelijk voor volwassenen
    const operations = [
      () => {
        const a = Math.floor(Math.random() * 20) + 10
        const b = Math.floor(Math.random() * 20) + 10
        return { text: `${a} + ${b}`, answer: a + b }
      },
      () => {
        const a = Math.floor(Math.random() * 30) + 20
        const b = Math.floor(Math.random() * 15) + 5
        return { text: `${a} - ${b}`, answer: a - b }
      },
      () => {
        const a = Math.floor(Math.random() * 8) + 3
        const b = Math.floor(Math.random() * 8) + 3
        return { text: `${a} × ${b}`, answer: a * b }
      },
      () => {
        const b = Math.floor(Math.random() * 8) + 2
        const answer = Math.floor(Math.random() * 10) + 2
        const a = b * answer
        return { text: `${a} ÷ ${b}`, answer: answer }
      }
    ]

    const operation = operations[Math.floor(Math.random() * operations.length)]
    setQuestion(operation())
    setAnswer('')
    setError(false)
  }

  useEffect(() => {
    generateQuestion()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (parseInt(answer, 10) === question.answer) {
      onSuccess()
    } else {
      setError(true)
      setAttempts(prev => prev + 1)

      // Na 3 foute pogingen, nieuwe vraag
      if (attempts >= 2) {
        setTimeout(() => {
          generateQuestion()
          setAttempts(0)
        }, 1000)
      }
    }
  }

  if (!question) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800">Ouder Sectie</h2>
          <p className="text-gray-600 mt-2">
            Los deze rekensom op om verder te gaan
          </p>
        </div>

        {/* Vraag */}
        <form onSubmit={handleSubmit}>
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-6 mb-6">
            <div className="text-center">
              <span className="text-3xl md:text-4xl font-bold text-indigo-800">
                {question.text} = ?
              </span>
            </div>
          </div>

          {/* Antwoord input */}
          <div className="mb-4">
            <input
              type="number"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                setError(false)
              }}
              placeholder="Typ je antwoord"
              className={`w-full text-center text-2xl font-bold py-4 px-6 rounded-xl border-2
                ${error
                  ? 'border-red-400 bg-red-50 text-red-600'
                  : 'border-gray-200 focus:border-indigo-400'
                }
                outline-none transition-colors`}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-center mt-2 animate-pulse">
                Dat is niet correct, probeer opnieuw!
              </p>
            )}
          </div>

          {/* Knoppen */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 text-gray-600
                font-semibold hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={!answer}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500
                text-white font-semibold hover:from-indigo-600 hover:to-purple-600
                disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Controleer
            </button>
          </div>
        </form>

        {/* Hint na meerdere pogingen */}
        {attempts >= 2 && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Tip: Gebruik een rekenmachine als het nodig is
          </p>
        )}
      </div>
    </div>
  )
}

export default ParentalGate
