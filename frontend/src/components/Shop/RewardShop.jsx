import { shopItems } from '../../data/shopItems'
import { ArrowLeft, Star, Heart } from '../shared/Icons'

export const RewardShop = ({ onBack, stars, unlockedItems, onPurchase, speak }) => {
  
  const buyItem = async (item) => {
    if (unlockedItems.includes(item.id)) return
    
    const result = await onPurchase(item.id, item.price)
    
    if (result.success) {
      speak(`Je hebt de ${item.name} toegevoegd!`)
    } else {
      speak(`Je hebt nog ${item.price - stars} sterren nodig.`)
    }
  }

  return (
    <div className="page-transition">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack} 
          className="bg-white/50 p-2 rounded-full hover:bg-white/70 transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Mijn Bio-Koepel</h2>
      </div>

      {/* Bio-Koepel Display */}
      <div className="h-80 bg-gradient-to-b from-indigo-900 to-indigo-800 rounded-[3rem] border-4 border-white/20 mb-8 relative p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-4 left-10 text-white/20 text-xs">✨</div>
        <div className="absolute bottom-10 right-20 text-white/20 text-xl">✨</div>
        
        <div className="flex flex-wrap items-end justify-center h-full gap-4 md:gap-8 relative z-10 pb-4">
          {unlockedItems.map(itemId => {
            const item = shopItems.find(i => i.id === itemId)
            if (!item) return null
            
            return (
              <div
                key={itemId}
                className="text-5xl md:text-6xl transform hover:scale-125 hover:-translate-y-4 transition duration-300 cursor-pointer drop-shadow-2xl animate-float"
                onClick={() => speak(item.name)}
                title={item.name}
                style={{ animationDelay: `${Math.random() * 2}s` }}
              >
                {item.icon}
              </div>
            )
          })}
        </div>
      </div>

      {/* Winkel Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shopItems.map(item => {
          const isOwned = unlockedItems.includes(item.id)
          const canAfford = stars >= item.price

          return (
            <button
              key={item.id}
              onClick={() => buyItem(item)}
              disabled={isOwned || !canAfford}
              className={`
                p-4 rounded-3xl border-b-4 flex flex-col items-center gap-3
                transition relative overflow-hidden
                ${isOwned
                  ? 'bg-emerald-100 border-emerald-300 opacity-60'
                  : canAfford
                    ? 'bg-white border-orange-200 hover:border-orange-400 hover:shadow-xl hover:-translate-y-1'
                    : 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                }
              `}
            >
              <span className="text-5xl drop-shadow-sm p-2">{item.icon}</span>
              <span className="font-bold text-slate-800 text-sm">{item.name}</span>
              
              {!isOwned ? (
                <div className={`
                  flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full
                  ${canAfford ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'}
                `}>
                  <Star 
                    size={14} 
                    className={canAfford ? 'fill-yellow-600 text-yellow-600' : 'text-gray-400'} 
                  />
                  {item.price}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full bg-emerald-200 text-emerald-800">
                  <Heart size={14} className="fill-emerald-800" />
                  Bezit
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
