# PROJECT_STATE.md - Galactische Vrienden

## Huidige Versie: 2.0

Laatst bijgewerkt: December 2024

---

## 📊 Component Status

### Core Infrastructure
| Component | Status | Locatie | Notities |
|-----------|--------|---------|----------|
| Vite Config | ✅ Compleet | `frontend/vite.config.js` | Proxy naar backend |
| Tailwind Config | ✅ Compleet | `frontend/tailwind.config.js` | Custom animaties |
| Supabase Client | ✅ Compleet | `frontend/src/supabaseClient.js` | - |
| Backend Server | ✅ Compleet | `backend/server.js` | Gemini proxy |
| Database Schema | ✅ Compleet | `supabase_schema.sql` | RLS policies |
| Render Config | ✅ Compleet | `render.yaml` | Blueprint |

### Hooks
| Hook | Status | Locatie | Functies |
|------|--------|---------|----------|
| useAuth | ✅ Compleet | `hooks/useAuth.js` | signInWithMagicLink, signOut, updateProfile |
| useProgress | ✅ Compleet | `hooks/useProgress.js` | stars, addStars, completeLevel, purchaseItem |
| useSettings | ✅ Compleet | `hooks/useSettings.js` | theme, font, textSize, letterSpacing |

### Auth Components
| Component | Status | Locatie |
|-----------|--------|---------|
| Login | ✅ Compleet | `components/Auth/Login.jsx` |
| ProfileSetup | ✅ Compleet | `components/Auth/ProfileSetup.jsx` |

### Game Components
| Component | Status | Locatie | Sterren |
|-----------|--------|---------|---------|
| Dashboard | ✅ Compleet | `components/Dashboard.jsx` | - |
| GameMenu (Code Kraken) | ✅ Compleet | `components/CodeKraken/GameMenu.jsx` | - |
| SyllableGame | ✅ Compleet | `components/CodeKraken/SyllableGame.jsx` | 5/woord + 10 bonus |
| TrollGame (Brutelaars) | ✅ Compleet | `components/Troll/TrollGame.jsx` | 30 totaal |
| JumpGame (Springer) | ✅ Compleet | `components/Jumper/JumpGame.jsx` | 20/verhaal |
| StoryMenu (Lezer) | ✅ Compleet | `components/Stories/StoryMenu.jsx` | 10/verhaal |
| StoryMaker | ✅ Compleet | `components/Stories/StoryMaker.jsx` | - |
| RewardShop | ✅ Compleet | `components/Shop/RewardShop.jsx` | - |
| SettingsView | ✅ Compleet | `components/SettingsView.jsx` | - |
| Header | ✅ Compleet | `components/shared/Header.jsx` | - |
| Icons | ✅ Compleet | `components/shared/Icons.jsx` | - |

### Data Files
| File | Status | Items |
|------|--------|-------|
| codeKrakenLevels.js | ✅ Compleet | 13 levels |
| trollWords.js | ✅ Compleet | 15 woorden |
| jumperStories.js | ✅ Compleet | 8 verhalen |
| readerStories.js | ✅ Compleet | 7 verhalen |
| shopItems.js | ✅ Compleet | 19 items |

---

## 🚧 Incomplete/Missing

### 1. Generated Story Reader
**Status**: ❌ Ontbreekt
**Prioriteit**: Hoog

De StoryMaker genereert een verhaal en zet `generatedStory` state, maar er is geen component om dit te tonen.

**Vereist**:
```jsx
// In App.jsx, voeg toe na story-maker:
{currentView === 'generated-reader' && (
  <GeneratedStoryReader 
    story={generatedStory}
    onBack={() => setCurrentView('dashboard')}
    speak={speak}
    addStars={addStars}
  />
)}
```

**Te maken**: `components/Stories/GeneratedStoryReader.jsx`
- Hergebruik ReadingRuler logica uit StoryMenu
- Toon `story.title`, `story.content[]`, `story.fact`
- Geef 15 sterren bij voltooien

### 2. CSS Animatie Fix
**Status**: ⚠️ Bug
**Prioriteit**: Medium

In `TrollGame.jsx` regel ~30 wordt `animate-vibrate` gebruikt maar deze class bestaat niet.

**Fix**: Voeg toe aan `frontend/tailwind.config.js`:
```javascript
keyframes: {
  // ... bestaande keyframes
  vibrate: {
    '0%, 100%': { transform: 'translateX(0)' },
    '20%': { transform: 'translateX(-2px)' },
    '40%': { transform: 'translateX(2px)' },
    '60%': { transform: 'translateX(-2px)' },
    '80%': { transform: 'translateX(2px)' },
  }
},
animation: {
  // ... bestaande animations
  'vibrate': 'vibrate 0.3s ease-in-out infinite',
}
```

### 3. App.jsx Cleanup
**Status**: ⚠️ Unused prop
**Prioriteit**: Laag

Regel 111 bevat `isStoryUnlocked` prop die niet gebruikt wordt door StoryMenu.

---

## 📁 File Tree (Actueel)

```
galactische-vrienden/
├── README.md
├── .gitignore
├── render.yaml
├── supabase_schema.sql
│
├── backend/
│   ├── package.json
│   ├── server.js
│   └── .env.example
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── supabaseClient.js
        │
        ├── hooks/
        │   ├── useAuth.js
        │   ├── useProgress.js
        │   └── useSettings.js
        │
        ├── data/
        │   ├── codeKrakenLevels.js
        │   ├── trollWords.js
        │   ├── jumperStories.js
        │   ├── readerStories.js
        │   └── shopItems.js
        │
        └── components/
            ├── Dashboard.jsx
            ├── SettingsView.jsx
            │
            ├── Auth/
            │   ├── Login.jsx
            │   └── ProfileSetup.jsx
            │
            ├── CodeKraken/
            │   ├── GameMenu.jsx
            │   └── SyllableGame.jsx
            │
            ├── Troll/
            │   └── TrollGame.jsx
            │
            ├── Jumper/
            │   └── JumpGame.jsx
            │
            ├── Stories/
            │   ├── StoryMenu.jsx
            │   └── StoryMaker.jsx
            │
            ├── Shop/
            │   └── RewardShop.jsx
            │
            └── shared/
                ├── Header.jsx
                └── Icons.jsx
```

---

## 🔄 State Flow

```
App.jsx
├── currentView (string) - welk scherm actief is
├── generatedStory (object|null) - AI gegenereerd verhaal
│
├── useAuth()
│   ├── user - Supabase auth user
│   ├── profile - profiles tabel data
│   └── loading
│
├── useProgress()
│   ├── stars (number)
│   ├── completedLevels { code_kraken: [], stories: [], jumper: [], troll: [] }
│   ├── unlockedItems (string[])
│   └── loading
│
└── useSettings()
    ├── settings { theme, font_type, text_size, letter_spacing }
    └── getThemeClasses(), getFontClasses()
```

---

## 🎮 Game Flow per Component

### Code Kraken
```
GameMenu → selecteer level → SyllableGame
  ↓
showIntro → klik woord delen in volgorde → correct = sterren
  ↓
alle woorden = level complete → terug naar GameMenu
```

### Brutelaars (Troll)
```
TrollGame
  ↓
showIntro → houd juiste lettergreep ingedrukt → trol explodeert
  ↓
15 woorden = complete → 30 sterren
```

### Lettergreep Springer
```
JumpGame → StorySelector → selecteer verhaal
  ↓
showIntro → klik leliebladen in volgorde → kikker springt
  ↓
alle zinnen = complete → 20 sterren
```

### Verhalen Lezer
```
StoryMenu → StorySelector → selecteer verhaal
  ↓
StoryReader met ReadingRuler → klik zinnen of auto-play
  ↓
einde = complete → 10 sterren + weetje
```

### Verhalen Fabriek
```
StoryMaker
  ↓
Stap 1: kies held → Stap 2: kies plek → Stap 3: kies item
  ↓
API call naar backend → Gemini genereert verhaal
  ↓
[MISSING] GeneratedStoryReader zou verhaal moeten tonen
```

---

## 🗄️ Database State

### profiles
```sql
id UUID (PK, FK → auth.users)
display_name TEXT
age INTEGER
grade INTEGER (3-5)
stars INTEGER (default 20)
created_at, updated_at TIMESTAMP
```

### completed_levels
```sql
user_id UUID (FK)
game_type TEXT ('code_kraken' | 'stories' | 'jumper' | 'troll')
level_id INTEGER
stars_earned INTEGER
completed_at TIMESTAMP
UNIQUE(user_id, game_type, level_id)
```

### user_items
```sql
user_id UUID (FK)
item_id TEXT
purchased_at TIMESTAMP
UNIQUE(user_id, item_id)
```

### user_settings
```sql
user_id UUID (PK, FK)
theme TEXT
font_type TEXT
text_size TEXT
letter_spacing BOOLEAN
```

---

## 🔐 Environment Variables Needed

### Frontend
| Variable | Beschrijving | Voorbeeld |
|----------|--------------|-----------|
| VITE_SUPABASE_URL | Supabase project URL | https://abc123.supabase.co |
| VITE_SUPABASE_ANON_KEY | Supabase anon key | eyJhbGciOi... |
| VITE_API_URL | Backend URL | http://localhost:3001 |

### Backend
| Variable | Beschrijving | Voorbeeld |
|----------|--------------|-----------|
| GEMINI_API_KEY | Google AI Studio key | AIzaSy... |
| FRONTEND_URL | CORS origin | http://localhost:5173 |
| PORT | Server port | 3001 |
