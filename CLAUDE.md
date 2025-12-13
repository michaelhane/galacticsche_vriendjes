# CLAUDE.md - Galactische Vrienden

## Project Overzicht

Galactische Vrienden is een educatieve leesapp voor kinderen in groep 3-5. De app helpt kinderen met lettergrepen, klemtoon en woordstructuur door middel van interactieve spelletjes. Inclusief ouder dashboard, weekwoorden en boek scanner.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js (Gemini API proxy + OCR)
- **Database**: Supabase (PostgreSQL + Auth)
- **Deployment**: Render.com
- **PWA**: manifest.json + Service Worker

## Ports (range 3050-3054)

| Service | Port |
|---------|------|
| Backend | 3050 |
| Frontend | 3051 |

## Project Structuur

```
galactische-vrienden/
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   └── icons/             # PWA icons (te genereren)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── ProfileSetup.jsx     # 7 stappen incl. huisdier/held
│   │   │   ├── Dashboard/
│   │   │   │   └── Dashboard.jsx
│   │   │   ├── Parent/                   # Ouder sectie
│   │   │   │   ├── ParentalGate.jsx     # Rekensom beveiliging
│   │   │   │   ├── ParentDashboard.jsx  # Hoofd dashboard
│   │   │   │   ├── WeekWordsInput.jsx   # Weekwoorden invoer
│   │   │   │   ├── ProgressCharts.jsx   # Statistieken
│   │   │   │   ├── BookScanner.jsx      # OCR scanner
│   │   │   │   └── index.js
│   │   │   ├── Games/
│   │   │   │   ├── CodeKraken/
│   │   │   │   ├── Troll/
│   │   │   │   ├── Jumper/
│   │   │   │   └── Stories/
│   │   │   └── Shop/
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx
│   │   │   ├── useProgress.js
│   │   │   ├── useSettings.js
│   │   │   └── useUser.js               # Personalisatie data
│   │   ├── data/
│   │   │   ├── words/                   # JSON woorden database
│   │   │   │   ├── index.js             # Loaders
│   │   │   │   ├── avi-start.json       # ~170 woorden
│   │   │   │   ├── avi-m3.json          # ~215 woorden
│   │   │   │   ├── avi-e3.json          # ~200 woorden
│   │   │   │   ├── avi-m4.json          # ~200 woorden
│   │   │   │   ├── avi-e4.json          # ~220 woorden
│   │   │   │   └── avi-m5-e5.json       # ~470 woorden
│   │   │   ├── stories/
│   │   │   └── shopItems.js
│   │   ├── services/
│   │   │   ├── wordSelector.js          # Slim woord algoritme
│   │   │   └── spacedRepetition.js      # Spaced repetition
│   │   ├── utils/
│   │   │   ├── textPersonalizer.js      # {naam}, {huisdier} vervanging
│   │   │   └── storageSync.js           # localStorage fallback
│   │   ├── App.jsx
│   │   ├── main.jsx                     # SW registratie
│   │   └── index.css
│   └── package.json
├── backend/
│   ├── server.js                        # API (verhalen + OCR)
│   └── package.json
├── supabase_schema.sql
└── render.yaml
```

## Belangrijke Regels voor Claude

- **NOOIT een lokale port killen zonder expliciete toestemming van de gebruiker**

## Belangrijke Conventies

### Code Style
- Functionele React componenten met hooks
- Nederlandse comments en UI tekst
- Tailwind voor styling (geen aparte CSS bestanden)

### Naamgeving
- Components: PascalCase (`GameMenu.jsx`)
- Hooks: camelCase met `use` prefix (`useProgress.js`)
- Data files: camelCase (`codeKrakenLevels.js`)

### State Management
- `useAuth` - authenticatie en profiel
- `useProgress` - sterren, levels, items
- `useSettings` - thema en accessibility
- `useUser` - personalisatie (huisdier, held, kleur)

### Game Componenten Structuur
1. `showIntro` state voor uitleg scherm
2. `completed` state voor eindscherm
3. `onBack` prop om terug te gaan
4. `speak(text)` voor spraaksynthese
5. `addStars(amount)` voor beloningen

## Huidige Status

### Voltooid
- [x] Basis app structuur
- [x] Supabase auth + database
- [x] Alle hooks (auth, progress, settings, user)
- [x] Login + ProfileSetup (7 stappen)
- [x] Dashboard + Header
- [x] Code Kraken (lettergreep puzzels)
- [x] TrollGame (klemtoon)
- [x] JumpGame (lettergreep springer)
- [x] StoryMenu + StoryMaker
- [x] RewardShop (Bio-Koepel)
- [x] Ouder Dashboard (ParentalGate, WeekWordsInput, ProgressCharts)
- [x] BookScanner (OCR met Gemini Vision)
- [x] Woorden database (~1475 woorden in JSON)
- [x] Personalisatie systeem (textPersonalizer)
- [x] PWA manifest + Service Worker

### Nog Te Doen
- [ ] PWA icons genereren (192x192, 512x512)
- [ ] Spaced repetition integreren in games
- [ ] localStorage sync in useProgress

## Commando's

### Development
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (aparte terminal)
cd backend && npm install && npm run dev
```

### Production Build
```bash
cd frontend && npm run build
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
VITE_API_URL=http://localhost:3050
```

### Backend (.env)
```
GEMINI_API_KEY=AIzaxxx
FRONTEND_URL=http://localhost:3051
PORT=3050
```

## API Endpoints

| Endpoint | Methode | Beschrijving |
|----------|---------|--------------|
| `/health` | GET | Health check |
| `/api/generate-story` | POST | AI verhaal genereren |
| `/api/ocr-scan` | POST | Boek scanner OCR |

## Database Tabellen

| Tabel | Doel |
|-------|------|
| profiles | Profiel + personalisatie (pet_info, idol, favorite_color) |
| user_items | Gekochte winkel items |
| completed_levels | Voltooide game levels |
| user_settings | Thema en accessibility |
| week_words | Weekwoorden van ouders/scanner |
| word_attempts | Spaced repetition tracking |

## Woorden Database

~1475 woorden verdeeld over AVI niveaus:
- **avi-start.json**: 170 woorden (1-2 lettergrepen)
- **avi-m3.json**: 215 woorden (2 lettergrepen)
- **avi-e3.json**: 200 woorden (2 lettergrepen)
- **avi-m4.json**: 200 woorden (2-3 lettergrepen)
- **avi-e4.json**: 220 woorden (3 lettergrepen)
- **avi-m5-e5.json**: 470 woorden (4-5 lettergrepen)

Elke entry bevat:
```json
{
  "word": "voetbal",
  "syllables": ["voet", "bal"],
  "syllableCount": 2,
  "stressIndex": 0,
  "image": "emoji",
  "category": "sport"
}
```

## Personalisatie

De app ondersteunt placeholders in teksten:
- `{naam}` / `{kind}` - Naam van het kind
- `{huisdier}` / `{huisdiernaam}` - Huisdier naam
- `{huisdiertype}` - Type huisdier
- `{held}` / `{idool}` - Favoriete held
- `{kleur}` - Favoriete kleur

Gebruik `textPersonalizer.js`:
```javascript
import { personalize, createPlaceholders } from './utils/textPersonalizer'
const text = personalize("Hoi {naam}!", createPlaceholders(profile))
```

## PWA

De app is installeerbaar als PWA:
- `manifest.json` in public/
- Service worker registratie in main.jsx
- Offline caching via sw.js

Icons nodig (te genereren):
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## Contact

Dit project is gemaakt voor Balloon Ravers / Mich.
