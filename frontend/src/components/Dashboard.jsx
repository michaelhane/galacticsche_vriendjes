import { BookOpen, Sparkles, Dice } from './shared/Icons'

export const Dashboard = ({ setView, speak, profile }) => {
  const games = [
    {
      id: 'reader',
      title: 'Het Avontuur',
      desc: 'Lees mooie verhalen',
      icon: '📖',
      color: 'from-blue-500 to-blue-600',
      shadow: 'shadow-blue-200'
    },
    {
      id: 'story-maker',
      title: 'Verhalen Fabriek',
      desc: 'Maak je eigen verhaal',
      icon: '✨',
      color: 'from-purple-500 to-purple-600',
      shadow: 'shadow-purple-200'
    },
    {
      id: 'game',
      title: 'Code Kraken',
      desc: 'Puzzel met lettergrepen',
      icon: '🧩',
      color: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-200'
    },
    {
      id: 'troll',
      title: 'De Brutelaars',
      desc: 'Vind de sterkste klank',
      icon: '👾',
      color: 'from-purple-600 to-pink-600',
      shadow: 'shadow-purple-200'
    },
    {
      id: 'jumper',
      title: 'Lettergreep Springer',
      desc: 'Spring door het verhaal',
      icon: '🐸',
      color: 'from-lime-500 to-green-600',
      shadow: 'shadow-lime-200'
    },
    {
      id: 'rewards',
      title: 'Mijn Bio-Koepel',
      desc: 'Bouw je ruimtestation',
      icon: '🏠',
      color: 'from-orange-400 to-amber-500',
      shadow: 'shadow-orange-200'
    }
  ]

  return (
    <div className="page-transition">
      {/* Welkom sectie */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">
          Welkom terug, {profile?.display_name || 'Astronaut'}! 🚀
        </h2>
        <p className="opacity-70">Wat wil je vandaag doen?</p>
      </div>

      {/* Game grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => {
              speak(game.title)
              setView(game.id)
            }}
            className={`
              p-6 rounded-3xl text-left text-white
              bg-gradient-to-br ${game.color}
              shadow-xl ${game.shadow}
              transform transition-all duration-300
              hover:scale-[1.02] hover:-translate-y-1
              active:scale-[0.98]
              border-b-4 border-black/10
            `}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold mb-1">{game.title}</h3>
                <p className="opacity-80 text-sm">{game.desc}</p>
              </div>
              <span className="text-4xl">{game.icon}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tip van de dag */}
      <div className="mt-8 bg-white/50 rounded-2xl p-6 border border-white/50">
        <div className="flex items-start gap-4">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-lg mb-1">Tip van de dag</h4>
            <p className="opacity-70">
              Klap in je handen bij elke lettergreep.
              Zo hoor je hoeveel stukjes een woord heeft!
            </p>
          </div>
        </div>
      </div>

      {/* Ouder sectie link */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setView('parent-gate')}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          👨‍👩‍👧 Ouder sectie
        </button>
      </div>
    </div>
  )
}
