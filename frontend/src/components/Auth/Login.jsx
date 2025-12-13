import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const { signInWithMagicLink, signInDemo } = useAuth()

  // Check voor geheime start parameter in URL: ?start=ruimte
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('start') === 'ruimte') {
      // Verwijder parameter uit URL (zodat refresh niet opnieuw triggert)
      window.history.replaceState({}, '', window.location.pathname)
      signInDemo()
    }
  }, [signInDemo])

  // Geheime demo mode activatie: 7x op logo klikken + rekensom
  const [logoClicks, setLogoClicks] = useState(0)
  const [showDemoGate, setShowDemoGate] = useState(false)
  const [demoAnswer, setDemoAnswer] = useState('')
  const [demoNumbers] = useState(() => {
    const a = Math.floor(Math.random() * 20) + 10
    const b = Math.floor(Math.random() * 20) + 10
    return { a, b, answer: a + b }
  })

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1
    setLogoClicks(newClicks)
    if (newClicks >= 7) {
      setShowDemoGate(true)
    }
  }

  const handleDemoSubmit = (e) => {
    e.preventDefault()
    if (parseInt(demoAnswer) === demoNumbers.answer) {
      signInDemo()
    } else {
      setDemoAnswer('')
      setShowDemoGate(false)
      setLogoClicks(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage(null)

    const { error } = await signInWithMagicLink(email)

    if (error) {
      setMessage({ type: 'error', text: 'Er ging iets mis. Probeer opnieuw.' })
    } else {
      setMessage({ 
        type: 'success', 
        text: '✨ Check je email! Klik op de link om in te loggen.' 
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-[3rem] p-8 md:p-12 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <button
            onClick={handleLogoClick}
            className="text-7xl mb-4 animate-bounce focus:outline-none cursor-default select-none"
            tabIndex={-1}
          >
            🚀
          </button>
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">
            Galactische Vrienden
          </h1>
          <p className="text-gray-600">
            Leer lezen met ruimteavonturen!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              📧 Email van papa of mama
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@voorbeeld.nl"
              className="w-full text-lg p-4 rounded-2xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className={`w-full py-4 rounded-2xl text-xl font-bold transition transform hover:scale-105 ${
              loading || !email
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">🌀</span> Even wachten...
              </span>
            ) : (
              '🔮 Stuur Magic Link'
            )}
          </button>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-2xl text-center ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border-2 border-green-200' 
              : 'bg-red-100 text-red-800 border-2 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            We sturen een veilige link naar je email.<br/>
            Geen wachtwoord nodig! 🎉
          </p>
        </div>
      </div>

      {/* Geheime demo gate - alleen na 7x logo klikken */}
      {showDemoGate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-center mb-4 text-gray-800">
              🔐 Geheime Toegang
            </h3>
            <p className="text-center text-gray-600 mb-4">
              Los de som op om demo mode te activeren:
            </p>
            <form onSubmit={handleDemoSubmit} className="space-y-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-indigo-600">
                  {demoNumbers.a} + {demoNumbers.b} = ?
                </span>
              </div>
              <input
                type="number"
                value={demoAnswer}
                onChange={(e) => setDemoAnswer(e.target.value)}
                className="w-full text-center text-2xl p-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:outline-none"
                placeholder="?"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowDemoGate(false); setLogoClicks(0) }}
                  className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-700 font-bold"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-500 text-white font-bold"
                >
                  Check
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
