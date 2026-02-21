import { useState, useEffect } from 'react'

/**
 * SnowboardScene - Geanimeerde bergscène met skilift en halfpipe
 * Standalone SVG component voor het DMT Snowboard Sprint spel
 *
 * @param {number} position - Positie van snowboarder op de berg (0-1)
 * @param {boolean} playHalfpipe - Start halfpipe trick animatie
 * @param {function} onHalfpipeComplete - Callback na halfpipe animatie (~4s)
 * @param {boolean} compact - Kleinere versie (200px vs 300px hoogte)
 */
export const SnowboardScene = ({
  position = 0,
  playHalfpipe = false,
  onHalfpipeComplete,
  compact = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Halfpipe animatie trigger
  useEffect(() => {
    if (!playHalfpipe) return

    setIsAnimating(true)
    setShowConfetti(true)

    const animTimer = setTimeout(() => {
      setIsAnimating(false)
    }, 4000)

    const confettiTimer = setTimeout(() => {
      setShowConfetti(false)
      onHalfpipeComplete?.()
    }, 4500)

    return () => {
      clearTimeout(animTimer)
      clearTimeout(confettiTimer)
    }
  }, [playHalfpipe, onHalfpipeComplete])

  // Snowboarder positie berekening (langs de kabelbaan)
  const boarderX = 50 + position * 300
  const boarderY = 280 - position * 220

  // Milestone posities
  const milestones = [0.25, 0.50, 0.75, 1.0]

  // Sneeuwvlokken configuratie
  const snowflakes = Array.from({ length: 12 }, (_, i) => ({
    cx: 20 + (i * 33) % 380,
    r: 1.5 + (i % 4) * 0.7,
    duration: 3 + (i % 5),
    delay: (i * 0.6) % 4,
    opacity: 0.5 + (i % 3) * 0.15
  }))

  // Confetti configuratie
  const confettiParticles = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2
    const distance = 40 + (i % 5) * 25
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#FBBF24', '#8B5CF6']
    return {
      color: colors[i % 5],
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 30,
      r: 2.5 + (i % 3),
      delay: (i % 4) * 0.1,
      duration: 1.5 + (i % 3) * 0.5
    }
  })

  // Kabelbaan stoeltjes posities
  const chairPositions = [0.15, 0.35, 0.55, 0.75]

  return (
    <div className={`relative w-full ${compact ? 'max-w-xs' : 'max-w-md'} mx-auto`}>
      <svg
        viewBox="0 0 400 320"
        className="w-full"
        style={{ height: compact ? 200 : 300 }}
      >
        {/* CSS Animaties */}
        <style>{`
          @keyframes snowfall {
            0% { transform: translateY(-20px); opacity: 0.8; }
            100% { transform: translateY(340px); opacity: 0; }
          }
          @keyframes halfpipeRide {
            0% { transform: translate(0, 0); }
            15% { transform: translate(-30px, 40px); }
            30% { transform: translate(0, 80px) rotate(360deg); }
            50% { transform: translate(30px, 40px) rotate(720deg); }
            65% { transform: translate(0, 80px) rotate(1080deg); }
            80% { transform: translate(-20px, 30px) scaleY(-1); }
            100% { transform: translate(0, 0) rotate(1440deg); }
          }
          @keyframes confettiBurst {
            0% { transform: translate(0, 0) scale(1); opacity: 1; }
            100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>

        {/* Definities */}
        <defs>
          {/* Lucht gradient */}
          <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#E0F2FE" />
          </linearGradient>

          {/* Berg gradient */}
          <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Achterberg gradient (lichter) */}
          <linearGradient id="mountainBgGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Halfpipe gradient */}
          <linearGradient id="halfpipeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>
        </defs>

        {/* Achtergrond - lucht */}
        <rect width="400" height="320" fill="url(#skyGradient)" />

        {/* Zon */}
        <circle cx="50" cy="45" r="22" fill="#FDE68A" opacity="0.9" />
        <circle cx="50" cy="45" r="28" fill="#FDE68A" opacity="0.2" />

        {/* Achterste berg (lichter, doorzichtig) */}
        <polygon
          points="60,300 200,60 340,300"
          fill="url(#mountainBgGradient)"
          opacity="0.6"
        />
        {/* Sneeuwkap achterberg */}
        <polygon
          points="180,90 200,60 220,90"
          fill="white"
          opacity="0.5"
        />

        {/* Voorste berg */}
        <polygon
          points="20,310 180,40 380,310"
          fill="url(#mountainGradient)"
        />
        {/* Sneeuwkap voorberg */}
        <polygon
          points="155,75 180,40 205,75 195,80 185,70 175,82 165,72"
          fill="white"
        />

        {/* Bomen (kleine dennenbomen op de berg) */}
        {[
          { x: 70, y: 270, s: 0.8 },
          { x: 100, y: 250, s: 0.7 },
          { x: 290, y: 240, s: 0.9 },
          { x: 320, y: 260, s: 0.7 },
          { x: 340, y: 280, s: 0.8 },
          { x: 130, y: 230, s: 0.6 },
        ].map((tree, i) => (
          <g key={`tree-${i}`} transform={`translate(${tree.x}, ${tree.y}) scale(${tree.s})`}>
            <polygon points="0,-20 -8,0 8,0" fill="#166534" />
            <polygon points="0,-14 -6,0 6,0" fill="#15803D" />
            <rect x="-2" y="0" width="4" height="6" fill="#92400E" />
          </g>
        ))}

        {/* Halfpipe (U-vorm bovenaan de berg) */}
        <g opacity={position > 0.7 ? 0.9 : 0.3}>
          {/* Achter halfpipe wand */}
          <path
            d="M 330,70 Q 350,120 330,140 L 370,140 Q 390,120 370,70 Z"
            fill="url(#halfpipeGradient)"
            stroke="#93C5FD"
            strokeWidth="1"
          />
          {/* Voor halfpipe wand */}
          <path
            d="M 332,75 Q 350,115 332,135"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
          />
          <path
            d="M 368,75 Q 350,115 368,135"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
          />
          {/* Bodem */}
          <path
            d="M 332,135 Q 350,148 368,135"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
          />
        </g>

        {/* Kabelbaan kabel */}
        <line
          x1="40" y1="290"
          x2="360" y2="55"
          stroke="#475569"
          strokeWidth="2"
          strokeDasharray="8,4"
        />

        {/* Kabelbaan palen */}
        <g stroke="#64748B" strokeWidth="3">
          {/* Onderpaal */}
          <line x1="40" y1="290" x2="40" y2="310" />
          <line x1="30" y1="310" x2="50" y2="310" />
          {/* Bovenpaal */}
          <line x1="360" y1="55" x2="360" y2="75" />
          <line x1="350" y1="75" x2="370" y2="75" />
        </g>

        {/* Decoratieve stoeltjes op de kabelbaan */}
        {chairPositions.map((cp, i) => {
          const cx = 40 + cp * 320
          const cy = 290 - cp * 235
          return (
            <g key={`chair-${i}`} opacity="0.5">
              {/* Haak aan kabel */}
              <line x1={cx} y1={cy} x2={cx} y2={cy + 10} stroke="#64748B" strokeWidth="1.5" />
              {/* Stoeltje */}
              <rect x={cx - 5} y={cy + 10} width="10" height="6" rx="1" fill="#64748B" />
            </g>
          )
        })}

        {/* Milestone markers langs de kabelbaan */}
        {milestones.map((mp, i) => {
          const mx = 50 + mp * 300
          const my = 280 - mp * 220
          const reached = position >= mp
          return (
            <g key={`milestone-${i}`}>
              <circle
                cx={mx}
                cy={my + 20}
                r="10"
                fill={reached ? '#10B981' : '#E2E8F0'}
                stroke={reached ? '#059669' : '#CBD5E1'}
                strokeWidth="1.5"
              />
              <text
                x={mx}
                y={my + 24}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill={reached ? 'white' : '#94A3B8'}
              >
                {i + 1}
              </text>
            </g>
          )
        })}

        {/* Snowboarder op de skilift */}
        {!isAnimating && (
          <g transform={`translate(${boarderX}, ${boarderY})`}>
            {/* Haak aan kabel */}
            <line x1="0" y1="-18" x2="0" y2="-8" stroke="#64748B" strokeWidth="2" />
            {/* Dwarsbalkie */}
            <line x1="-6" y1="-8" x2="6" y2="-8" stroke="#64748B" strokeWidth="2" />

            {/* Hoofd */}
            <circle cx="0" cy="-2" r="5" fill="#FDE68A" />
            {/* Helm */}
            <path d="M -5,-4 Q 0,-10 5,-4" fill="#EF4444" />
            {/* Oogjes */}
            <circle cx="-2" cy="-3" r="1" fill="#1E293B" />
            <circle cx="2" cy="-3" r="1" fill="#1E293B" />
            {/* Glimlach */}
            <path d="M -2,0 Q 0,2 2,0" fill="none" stroke="#1E293B" strokeWidth="0.7" />

            {/* Lichaam (jas) */}
            <ellipse cx="0" cy="8" rx="6" ry="7" fill="#EF4444" />
            {/* Rits detail */}
            <line x1="0" y1="2" x2="0" y2="14" stroke="#B91C1C" strokeWidth="0.8" />

            {/* Benen */}
            <line x1="-3" y1="14" x2="-4" y2="22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="3" y1="14" x2="4" y2="22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />

            {/* Snowboard */}
            <rect x="-8" y="22" width="16" height="4" rx="2" fill="#1E293B" />
            {/* Board design streepje */}
            <line x1="-5" y1="24" x2="5" y2="24" stroke="#EF4444" strokeWidth="0.8" />
          </g>
        )}

        {/* Halfpipe rider (tijdens animatie) */}
        {isAnimating && (
          <g
            transform={`translate(350, 90)`}
            style={{
              animation: 'halfpipeRide 4s ease-in-out forwards',
              transformOrigin: '350px 90px'
            }}
          >
            {/* Hoofd */}
            <circle cx="0" cy="-2" r="5" fill="#FDE68A" />
            <path d="M -5,-4 Q 0,-10 5,-4" fill="#EF4444" />
            {/* Oogjes - blij */}
            <circle cx="-2" cy="-3" r="1" fill="#1E293B" />
            <circle cx="2" cy="-3" r="1" fill="#1E293B" />
            {/* Grote grijns */}
            <path d="M -3,0 Q 0,4 3,0" fill="none" stroke="#1E293B" strokeWidth="0.8" />
            {/* Lichaam */}
            <ellipse cx="0" cy="8" rx="6" ry="7" fill="#EF4444" />
            <line x1="0" y1="2" x2="0" y2="14" stroke="#B91C1C" strokeWidth="0.8" />
            {/* Benen */}
            <line x1="-3" y1="14" x2="-4" y2="22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="3" y1="14" x2="4" y2="22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            {/* Snowboard */}
            <rect x="-8" y="22" width="16" height="4" rx="2" fill="#1E293B" />
            <line x1="-5" y1="24" x2="5" y2="24" stroke="#EF4444" strokeWidth="0.8" />
          </g>
        )}

        {/* Confetti (alleen tijdens halfpipe) */}
        {showConfetti && confettiParticles.map((p, i) => (
          <circle
            key={`confetti-${i}`}
            cx="350"
            cy="90"
            r={p.r}
            fill={p.color}
            style={{
              '--dx': `${p.dx}px`,
              '--dy': `${p.dy}px`,
              animation: `confettiBurst ${p.duration}s ease-out ${p.delay}s forwards`
            }}
          />
        ))}

        {/* Sneeuwvlokken */}
        {snowflakes.map((sf, i) => (
          <circle
            key={`snow-${i}`}
            cx={sf.cx}
            cy="0"
            r={sf.r}
            fill="white"
            opacity={sf.opacity}
            style={{
              animation: `snowfall ${sf.duration}s linear ${sf.delay}s infinite`
            }}
          />
        ))}

        {/* Percentage indicator rechtsboven */}
        <g transform="translate(380, 25)">
          <rect x="-30" y="-12" width="38" height="20" rx="6" fill="white" opacity="0.85" />
          <text
            x="-11"
            y="3"
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill={position >= 1 ? '#10B981' : '#3B82F6'}
          >
            {position >= 1 ? 'TOP!' : `${Math.round(position * 100)}%`}
          </text>
        </g>

        {/* Sneeuw op de grond */}
        <ellipse cx="200" cy="318" rx="220" ry="12" fill="white" opacity="0.4" />
      </svg>
    </div>
  )
}

export default SnowboardScene
