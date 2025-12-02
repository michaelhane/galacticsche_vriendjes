import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export const Login = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const { signInWithMagicLink, signInDemo } = useAuth()

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
          <div className="text-7xl mb-4 animate-bounce">🚀</div>
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

        {/* Demo mode voor development */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={signInDemo}
            className="w-full py-3 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
          >
            🧪 Demo Mode (zonder login)
          </button>
        </div>
      </div>
    </div>
  )
}
