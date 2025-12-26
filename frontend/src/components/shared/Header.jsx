import { Rocket, Star, Settings } from './Icons'

export const Header = ({ stars, streak, profile, onSettingsClick, onLogoClick }) => {
  return (
    <header className="p-4 flex justify-between items-center border-b border-black/5 bg-white/10 backdrop-blur-sm sticky top-0 z-50">
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
        onClick={onLogoClick}
      >
        <div className="bg-indigo-500 p-2 rounded-2xl text-white shadow-lg shadow-indigo-200">
          <Rocket size={28} />
        </div>
        <div>
          <h1 className="font-bold text-xl md:text-2xl leading-none">Galactische</h1>
          <span className="text-sm opacity-70 font-bold">Vrienden</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {profile?.display_name && (
          <span className="hidden md:block text-sm font-bold opacity-60">
            Hoi {profile.display_name}! 👋
          </span>
        )}
        
        {streak > 0 && (
          <div className="flex items-center gap-1 bg-orange-400/10 px-3 py-2 rounded-full border border-orange-400/50" title="Leesreeks">
            <span className="text-lg">🔥</span>
            <span className="font-bold">{streak}</span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/50">
          <Star className="text-yellow-500 fill-yellow-500 animate-pulse" size={20} />
          <span className="font-bold text-lg">{stars}</span>
        </div>

        <button 
          onClick={onSettingsClick}
          className="p-2 hover:bg-black/5 rounded-full transition"
          aria-label="Instellingen"
        >
          <Settings size={26} />
        </button>
      </div>
    </header>
  )
}
