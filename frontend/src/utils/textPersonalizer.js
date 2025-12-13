/**
 * TEXT PERSONALIZER
 * Vervangt placeholders in teksten met gepersonaliseerde waarden
 *
 * Ondersteunde placeholders:
 * - {naam} of {kind} - Naam van het kind
 * - {huisdier} of {huisdiernaam} - Naam van het huisdier
 * - {huisdiertype} - Type huisdier (hond, kat, etc.)
 * - {held} of {idool} - Favoriete held/personage
 * - {kleur} - Favoriete kleur
 * - {leeftijd} - Leeftijd
 * - {groep} - Schoolgroep
 *
 * Hoofdletter varianten:
 * - {Naam}, {Huisdier}, {Held} - Met hoofdletter
 */

/**
 * Personaliseer een tekst met placeholder waarden
 * @param {string} text - Tekst met {placeholders}
 * @param {Object} placeholders - Object met key-value pairs voor vervanging
 * @returns {string} Gepersonaliseerde tekst
 */
export const personalize = (text, placeholders = {}) => {
  if (!text) return text

  let result = text

  // Vervang alle placeholders
  Object.entries(placeholders).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      // Case-insensitive vervanging met behoud van originele case
      const regex = new RegExp(`\\{${key}\\}`, 'gi')
      result = result.replace(regex, (match) => {
        // Als de placeholder met hoofdletter begint, kapitaliseer de waarde
        if (match.charAt(1) === match.charAt(1).toUpperCase()) {
          return capitalize(String(value))
        }
        return String(value)
      })
    }
  })

  return result
}

/**
 * Personaliseer meerdere teksten tegelijk
 * @param {string[]} texts - Array van teksten
 * @param {Object} placeholders - Placeholder waarden
 * @returns {string[]} Array van gepersonaliseerde teksten
 */
export const personalizeAll = (texts, placeholders = {}) => {
  return texts.map(text => personalize(text, placeholders))
}

/**
 * Personaliseer een object met tekst velden
 * @param {Object} obj - Object met tekst velden
 * @param {Object} placeholders - Placeholder waarden
 * @param {string[]} fields - Welke velden te personaliseren (default: alle string velden)
 * @returns {Object} Object met gepersonaliseerde velden
 */
export const personalizeObject = (obj, placeholders = {}, fields = null) => {
  if (!obj || typeof obj !== 'object') return obj

  const result = { ...obj }

  Object.keys(result).forEach(key => {
    // Skip als fields is gespecificeerd en key niet in fields zit
    if (fields && !fields.includes(key)) return

    const value = result[key]

    if (typeof value === 'string') {
      result[key] = personalize(value, placeholders)
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'string' ? personalize(item, placeholders) : item
      )
    }
  })

  return result
}

/**
 * Maak standaard placeholders vanuit een profiel object
 * @param {Object} profile - Gebruikersprofiel
 * @returns {Object} Placeholders object
 */
export const createPlaceholders = (profile) => {
  if (!profile) {
    return getDefaultPlaceholders()
  }

  const petName = profile.pet_info?.name || null
  const petType = profile.pet_info?.type || null

  return {
    // Basis
    naam: profile.display_name || 'Astronaut',
    kind: profile.display_name || 'Astronaut',
    leeftijd: profile.age || 7,
    groep: profile.grade || 3,

    // Huisdier
    huisdier: petName || 'het huisdier',
    huisdiernaam: petName || 'Buddy',
    huisdiertype: petType || 'huisdier',

    // Held
    held: profile.idol || 'de held',
    idool: profile.idol || 'de held',

    // Overig
    kleur: profile.favorite_color || 'blauw',

    // Hoofdletter varianten
    Naam: capitalize(profile.display_name || 'Astronaut'),
    Kind: capitalize(profile.display_name || 'Astronaut'),
    Huisdier: capitalize(petName || 'Het huisdier'),
    Held: capitalize(profile.idol || 'De held'),
    Idool: capitalize(profile.idol || 'De held')
  }
}

/**
 * Haal default placeholders op (voor als er geen profiel is)
 * @returns {Object} Default placeholders
 */
export const getDefaultPlaceholders = () => ({
  naam: 'Astronaut',
  kind: 'Astronaut',
  leeftijd: 7,
  groep: 3,
  huisdier: 'het huisdier',
  huisdiernaam: 'Buddy',
  huisdiertype: 'huisdier',
  held: 'de held',
  idool: 'de held',
  kleur: 'blauw',
  Naam: 'Astronaut',
  Kind: 'Astronaut',
  Huisdier: 'Het huisdier',
  Held: 'De held',
  Idool: 'De held'
})

/**
 * Genereer een gepersonaliseerde zin
 * Kiest willekeurig uit templates en personaliseert
 * @param {string[]} templates - Array van template zinnen
 * @param {Object} placeholders - Placeholder waarden
 * @returns {string} Gepersonaliseerde zin
 */
export const generateSentence = (templates, placeholders = {}) => {
  if (!templates || templates.length === 0) return ''

  const template = templates[Math.floor(Math.random() * templates.length)]
  return personalize(template, placeholders)
}

/**
 * Check of een tekst placeholders bevat
 * @param {string} text - Te checken tekst
 * @returns {boolean} True als er placeholders in zitten
 */
export const hasPlaceholders = (text) => {
  if (!text) return false
  return /\{[a-zA-Z]+\}/.test(text)
}

/**
 * Haal alle placeholder keys uit een tekst
 * @param {string} text - Tekst met placeholders
 * @returns {string[]} Array van placeholder keys
 */
export const extractPlaceholders = (text) => {
  if (!text) return []

  const matches = text.match(/\{([a-zA-Z]+)\}/g) || []
  return [...new Set(matches.map(m => m.slice(1, -1).toLowerCase()))]
}

// Helper
const capitalize = (str) => {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Voorbeeld gebruik templates
export const EXAMPLE_TEMPLATES = {
  welkom: [
    'Welkom terug, {naam}!',
    'Hoi {naam}, leuk dat je er bent!',
    'Hey {naam}! Klaar voor een nieuw avontuur?'
  ],
  aanmoediging: [
    'Goed bezig, {naam}!',
    'Super gedaan!',
    '{Naam}, je bent een ster!',
    'Wauw {naam}, dat ging goed!'
  ],
  verhaal: [
    '{Naam} en {huisdier} gingen op avontuur.',
    'Op een dag vond {naam} een geheime schat.',
    '{Held} kwam {naam} helpen met een moeilijke opdracht.',
    'De {kleur}e deur ging open en {naam} stapte naar binnen.'
  ]
}

export default {
  personalize,
  personalizeAll,
  personalizeObject,
  createPlaceholders,
  getDefaultPlaceholders,
  generateSentence,
  hasPlaceholders,
  extractPlaceholders,
  EXAMPLE_TEMPLATES
}
