# HOOKS.md - React Hooks Documentatie

## Overzicht

De app gebruikt 3 custom hooks voor state management:

| Hook | Doel | Context Provider |
|------|------|------------------|
| useAuth | Authenticatie & profiel | AuthProvider (wraps app) |
| useProgress | Game voortgang & sterren | Geen (standalone) |
| useSettings | UI instellingen | Geen (standalone) |

---

## useAuth

**Locatie**: `frontend/src/hooks/useAuth.js`

### Setup
```jsx
// main.jsx
import { AuthProvider } from './hooks/useAuth'

<AuthProvider>
  <App />
</AuthProvider>
```

### Gebruik
```jsx
import { useAuth } from '../hooks/useAuth'

function MyComponent() {
  const {
    user,                    // Supabase auth user object | null
    profile,                 // { id, display_name, age, grade, stars } | null
    loading,                 // boolean
    isAuthenticated,         // boolean
    hasProfile,              // boolean (heeft display_name)
    signInWithMagicLink,     // async (email) => { error }
    signOut,                 // async () => { error }
    updateProfile,           // async (updates) => { data, error }
  } = useAuth()
}
```

### Functies

#### signInWithMagicLink(email)
Stuurt magic link naar email adres.
```jsx
const handleLogin = async () => {
  const { error } = await signInWithMagicLink('ouder@email.nl')
  if (error) {
    console.error('Login failed:', error)
  } else {
    // Toon "check je email" bericht
  }
}
```

#### signOut()
Logt gebruiker uit en reset state.
```jsx
const handleLogout = async () => {
  await signOut()
  window.location.reload()
}
```

#### updateProfile(updates)
Update profiel in database.
```jsx
const handleSave = async () => {
  const { error } = await updateProfile({
    display_name: 'Pelle',
    age: 7,
    grade: 3
  })
}
```

### Auth Flow
```
1. App laadt → check getSession()
2. Geen sessie → toon Login component
3. Sessie → check hasProfile
4. Geen profiel → toon ProfileSetup
5. Profiel compleet → toon Dashboard
```

---

## useProgress

**Locatie**: `frontend/src/hooks/useProgress.js`

### Gebruik
```jsx
import { useProgress } from '../hooks/useProgress'

function MyComponent() {
  const {
    stars,                   // number (huidige sterren)
    addStars,                // async (amount) => void
    spendStars,              // async (amount) => boolean
    completedLevels,         // { code_kraken: [], stories: [], jumper: [], troll: [] }
    completeLevel,           // async (gameType, levelId, starsEarned) => void
    isLevelUnlocked,         // (gameType, levelId) => boolean
    unlockedItems,           // string[] (item IDs)
    purchaseItem,            // async (itemId, price) => { success, reason }
    loading,                 // boolean
    refresh,                 // () => void (herlaad van database)
  } = useProgress()
}
```

### Functies

#### addStars(amount)
Voegt sterren toe aan profiel.
```jsx
// Na correct antwoord
addStars(5)

// Na level complete
addStars(10)
```

#### spendStars(amount)
Trekt sterren af (voor aankopen). Returnt false als niet genoeg.
```jsx
const canBuy = await spendStars(50)
if (!canBuy) {
  speak("Je hebt niet genoeg sterren!")
}
```

#### completeLevel(gameType, levelId, starsEarned)
Markeert level als voltooid.
```jsx
// Game types: 'code_kraken', 'stories', 'jumper', 'troll'
await completeLevel('code_kraken', 5, 15)
```

#### isLevelUnlocked(gameType, levelId)
Check of level speelbaar is (vorige moet voltooid zijn).
```jsx
// Level 0 is altijd open
// Level X is open als level X-1 in completedLevels zit

const canPlay = isLevelUnlocked('code_kraken', 3)
// true als level 2 voltooid is
```

#### purchaseItem(itemId, price)
Koopt item in winkel.
```jsx
const result = await purchaseItem('rocket', 300)

if (result.success) {
  speak("Je hebt de raket gekocht!")
} else {
  speak(result.reason) // "Niet genoeg sterren" of "Al gekocht"
}
```

### Data Structuur
```javascript
completedLevels = {
  code_kraken: [0, 1, 2, 3],     // voltooide level IDs
  stories: [0, 1],
  jumper: [0],
  troll: []                      // leeg = geen voltooid
}

unlockedItems = ['plant-alien', 'telescope', 'tree']
```

### Unlock Logica
```javascript
// Dit is het slimme systeem:
// We slaan VOLTOOIDE levels op, niet UNLOCKED

function isLevelUnlocked(gameType, levelId) {
  if (levelId === 0) return true  // Eerste altijd open
  return completedLevels[gameType].includes(levelId - 1)
}

// Voordeel: nieuwe levels zijn automatisch locked
// Totdat speler het vorige level voltooit
```

---

## useSettings

**Locatie**: `frontend/src/hooks/useSettings.js`

### Gebruik
```jsx
import { useSettings } from '../hooks/useSettings'

function MyComponent() {
  const {
    settings,                // { theme, font_type, text_size, letter_spacing }
    setTheme,                // (theme) => void
    setFontType,             // (fontType) => void
    setTextSize,             // (textSize) => void
    setLetterSpacing,        // (boolean) => void
    getThemeClasses,         // () => string (Tailwind classes)
    getFontClasses,          // () => string (Tailwind classes)
    loading,                 // boolean
  } = useSettings()
}
```

### Settings Object
```javascript
settings = {
  theme: 'space-light',      // 'space-light' | 'mars' | 'deep-space' | 'white'
  font_type: 'sans',         // 'sans' | 'comic'
  text_size: 'normal',       // 'normal' | 'large' | 'xl'
  letter_spacing: false      // boolean
}
```

### Helper Functies

#### getThemeClasses()
Geeft Tailwind classes voor achtergrond en tekst.
```jsx
<div className={getThemeClasses()}>
  {/* bg-[#F0F4F8] text-slate-900 voor space-light */}
</div>
```

**Returns**:
| Theme | Classes |
|-------|---------|
| space-light | `bg-[#F0F4F8] text-slate-900` |
| mars | `bg-[#FFF5F0] text-red-950` |
| deep-space | `bg-[#1a202c] text-blue-50` |
| white | `bg-white text-gray-900` |

#### getFontClasses()
Geeft Tailwind classes voor font en spacing.
```jsx
<p className={getFontClasses()}>
  Leesbare tekst
</p>
```

**Returns** (combinaties):
- `font-sans text-lg` (default)
- `font-comic text-lg` (comic font)
- `font-sans text-xl` (large)
- `font-sans text-2xl` (xl)
- `font-sans text-lg tracking-widest leading-loose` (met spacing)

### Persistentie
- **Ingelogd**: opgeslagen in Supabase `user_settings` tabel
- **Niet ingelogd**: opgeslagen in localStorage als fallback

---

## Hooks Samenwerking

```
App.jsx
│
├── useAuth()
│   └── user, profile nodig voor...
│
├── useProgress()
│   └── laadt data gebaseerd op user.id
│   └── profile.stars wordt hier beheerd
│
└── useSettings()
    └── laadt settings gebaseerd op user.id
    └── fallback naar localStorage zonder login
```

### Typisch Component Pattern
```jsx
function GameComponent({ onBack, speak, addStars }) {
  // Lokale game state
  const [currentLevel, setCurrentLevel] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  
  // Game logica
  const handleCorrect = () => {
    addStars(5)
    speak("Goed zo!")
  }
  
  const handleComplete = () => {
    // Parent component handelt level completion af
    onBack()
  }
  
  return (...)
}
```

### Prop Drilling vs Hooks
We gebruiken **prop drilling** voor game-specifieke functies:
- `speak` - spraaksynthese
- `addStars` - sterren toevoegen
- `onBack` - navigatie terug

We gebruiken **hooks** voor globale state:
- `useAuth` - wie is ingelogd
- `useProgress` - alle voortgang data
- `useSettings` - UI preferences

---

## Foutafhandeling

### useAuth
```jsx
const { error } = await signInWithMagicLink(email)
if (error) {
  // Toon error message aan gebruiker
}
```

### useProgress
```jsx
const result = await purchaseItem(id, price)
if (!result.success) {
  speak(result.reason)
}
```

### useSettings
Geen expliciete error handling - faalt silently en gebruikt defaults.

---

## Testing Hooks

### Mock voor Tests
```jsx
// __mocks__/useAuth.js
export const useAuth = () => ({
  user: { id: 'test-user-id' },
  profile: { display_name: 'Test', age: 7, grade: 3, stars: 100 },
  loading: false,
  isAuthenticated: true,
  hasProfile: true,
  signInWithMagicLink: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
})
```

```jsx
// __mocks__/useProgress.js
export const useProgress = () => ({
  stars: 100,
  addStars: jest.fn(),
  spendStars: jest.fn(() => true),
  completedLevels: { code_kraken: [0, 1, 2], stories: [], jumper: [], troll: [] },
  completeLevel: jest.fn(),
  isLevelUnlocked: jest.fn((type, id) => id <= 3),
  unlockedItems: ['plant-alien'],
  purchaseItem: jest.fn(() => ({ success: true })),
  loading: false,
})
```
