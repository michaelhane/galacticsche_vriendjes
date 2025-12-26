export const AchievementNotification = ({ achievement, onDismiss }) => {
  if (!achievement) return null

  return (
    <div 
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce"
      onClick={onDismiss}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer">
        <div className="text-4xl">{achievement.icon}</div>
        <div>
          <p className="text-sm opacity-90">Nieuwe Badge!</p>
          <p className="font-bold text-lg">{achievement.name}</p>
          <p className="text-sm opacity-80">{achievement.description}</p>
        </div>
      </div>
    </div>
  )
}
