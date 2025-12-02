// Winkel Items - Bio-Koepel decoraties
// Prijzen in sterren

export const shopItems = [
  // Tier 1 - Starter (0-50)
  { id: 'plant-alien', name: 'Alien Plant', price: 0, icon: '👾', tier: 1 },
  { id: 'telescope', name: 'Telescoop', price: 10, icon: '🔭', tier: 1 },
  { id: 'tree', name: 'Zuurstof Boom', price: 20, icon: '🌳', tier: 1 },
  { id: 'dog', name: 'Space Hond', price: 30, icon: '🐕', tier: 1 },
  { id: 'saturn', name: 'Planeet', price: 40, icon: '🪐', tier: 1 },
  { id: 'butterfly', name: 'Vlinder', price: 50, icon: '🦋', tier: 1 },

  // Tier 2 - Explorer (60-150)
  { id: 'ufo', name: 'UFO', price: 60, icon: '🛸', tier: 2 },
  { id: 'robot', name: 'Robot Maatje', price: 75, icon: '🤖', tier: 2 },
  { id: 'station', name: 'Ruimtestation', price: 100, icon: '🛰️', tier: 2 },
  { id: 'crystal', name: 'Ruimte Kristal', price: 125, icon: '💎', tier: 2 },
  { id: 'randomizer', name: 'ToVer-Dobbelsteen', price: 150, icon: '🎲', tier: 2, special: true },

  // Tier 3 - Commander (175-350)
  { id: 'moonbase', name: 'Maanbasis', price: 175, icon: '🏠', tier: 3 },
  { id: 'astronaut', name: 'Astronaut', price: 200, icon: '👨‍🚀', tier: 3 },
  { id: 'comet', name: 'Komeet', price: 250, icon: '☄️', tier: 3 },
  { id: 'rocket', name: 'Super Raket', price: 300, icon: '🚀', tier: 3 },
  { id: 'alien-pet', name: 'Alien Huisdier', price: 350, icon: '👽', tier: 3 },

  // Tier 4 - Legende (400-500)
  { id: 'blackhole', name: 'Zwart Gat', price: 400, icon: '🌀', tier: 4 },
  { id: 'galaxy', name: 'Melkweg', price: 450, icon: '🌌', tier: 4 },
  { id: 'solar-system', name: 'Zonnestelsel', price: 500, icon: '☀️', tier: 4 }
]

// Helper functies
export const getItemById = (id) => shopItems.find(item => item.id === id)
export const getItemsByTier = (tier) => shopItems.filter(item => item.tier === tier)
export const getMaxPrice = () => Math.max(...shopItems.map(item => item.price))
