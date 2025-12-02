# CLAUDE.md - Galactische Vrienden

## Project Overzicht

Galactische Vrienden is een educatieve leesapp voor kinderen in groep 3-5. De app helpt kinderen met lettergrepen, klemtoon en woordstructuur door middel van interactieve spelletjes.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js (Gemini API proxy)
- **Database**: Supabase (PostgreSQL + Auth)
- **Deployment**: Render.com

## Ports (range 3050-3054)

| Service | Port |
|---------|------|
| Backend | 3050 |
| Frontend | 3051 |

## Project Structuur

```
galactische-vrienden/
├── frontend/           # React app
│   ├── src/
│   │   ├── components/ # UI componenten
│   │   ├── hooks/      # React hooks (auth, progress, settings)
│   │   ├── data/       # Game content (levels, woorden, verhalen)
│   │   └── App.jsx     # Main routing
│   └── package.json
├── backend/            # Express API
│   ├── server.js       # Gemini proxy
│   └── package.json
├── supabase_schema.sql # Database setup
└── render.yaml         # Deploy config
```

## Belangrijke Conventies

### Code Style
- Gebruik functionele React componenten met hooks
- Nederlandse comments en UI tekst
- Tailwind voor styling (geen aparte CSS bestanden)
- Emoji's voor visuele feedback in games

### Naamgeving
- Components: PascalCase (bijv. `GameMenu.jsx`)
- Hooks: camelCase met `use` prefix (bijv. `useProgress.js`)
- Data files: camelCase (bijv. `codeKrakenLevels.js`)

### State Management
- `useAuth` - authenticatie en profiel
- `useProgress` - sterren, levels, items
- `useSettings` - thema en accessibility

### Game Componenten Structuur
Elk game component volgt dit patroon:
1. `showIntro` state voor uitleg scherm
2. `completed` state voor eindscherm
3. `onBack` prop om terug te gaan naar dashboard
4. `speak(text)` functie voor spraaksynthese
5. `addStars(amount)` voor beloningen

## Huidige Taken

### ✅ Voltooid
- [x] Project structuur en configuratie
- [x] Supabase schema (auth, profiles, progress)
- [x] useAuth hook met Magic Link
- [x] useProgress hook (sterren, levels, items)
- [x] useSettings hook (thema, font, spacing)
- [x] Login en ProfileSetup componenten
- [x] Dashboard met game selectie
- [x] Header met sterren display
- [x] Code Kraken (13 levels lettergreep puzzels)
- [x] Brutelaars/TrollGame (15 woorden klemtoon)
- [x] Lettergreep Springer/JumpGame (8 verhalen)
- [x] Verhalen Lezer/StoryMenu (7 verhalen + ReadingRuler)
- [x] StoryMaker (AI verhaal generatie)
- [x] RewardShop (19 items Bio-Koepel)
- [x] SettingsView

### 🔧 Nog Te Doen

#### Hoge Prioriteit
1. **Generated Story Reader** - View voor AI-gegenereerde verhalen
   - Route: `currentView === 'generated-reader'`
   - Moet `generatedStory` state uit App.jsx gebruiken
   - Zelfde ReadingRuler als StoryMenu

2. **App.jsx isStoryUnlocked verwijderen** - Regel 111 bevat ongebruikte prop
   - Verwijder `isStoryUnlocked={(id) => isLevelUnlocked('stories', id)}`

3. **Backend CORS update** - Voeg productie URL toe
   - `backend/server.js` regel 10: voeg Render URL toe aan CORS origin

#### Medium Prioriteit
4. **Offline fallback** - localStorage backup voor progress
   - In useProgress.js: sync met localStorage als Supabase faalt

5. **Loading states** - Skeleton loaders voor games
   - Voorkom flash of content bij laden levels

6. **Error boundaries** - Catch errors in game componenten
   - Voorkom crashes, toon friendly error message

#### Lage Prioriteit
7. **Animaties verfijnen** - Smoother transitions
   - TrollGame: vibrate animatie CSS toevoegen
   - JumpGame: water ripple effect

8. **Sounds** - Optionele geluidseffecten
   - Correct/incorrect feedback
   - Level complete jingle

9. **PWA Support** - Installeerbaar maken
   - manifest.json
   - Service worker voor offline

10. **Analytics** - Optioneel: progress tracking
    - Welke levels moeilijk zijn
    - Waar kinderen afhaken

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

### Database Reset
Voer `supabase_schema.sql` opnieuw uit in Supabase SQL Editor.

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

## Testing Checklist

Voor elke game, test:
- [ ] Intro scherm toont correct
- [ ] Spraaksynthese werkt (NL stem)
- [ ] Sterren worden toegevoegd
- [ ] Progress wordt opgeslagen
- [ ] Terug knop werkt
- [ ] Level unlock logica klopt

## Bekende Issues

1. **TrollGame vibrate class** - CSS animatie `animate-vibrate` bestaat niet in Tailwind config
2. **Speech synthesis** - Sommige browsers hebben geen NL stem, fallback naar EN

## API Endpoints

### Backend
- `GET /health` - Health check
- `POST /api/generate-story` - Genereer verhaal met Gemini
  - Body: `{ hero, place, item, gradeLevel }`
  - Response: `{ title, content[], fact }`

## Database Tabellen

| Tabel | Doel |
|-------|------|
| profiles | Gebruikersprofiel (naam, leeftijd, groep, sterren, **interests[]**) |
| user_items | Gekochte winkel items |
| completed_levels | Voltooide game levels |
| user_settings | Thema en accessibility |

Alle tabellen hebben RLS policies - gebruikers zien alleen eigen data.

## School Content Integratie

### Folder Structuur
```
school-content/
├── spelling/     # Spellingwoorden per week
├── grammar/      # Grammatica onderwerpen
└── math/         # Rekenen (voor later)
```

### Workflow voor Gepersonaliseerde Levels

Wanneer gevraagd om levels te genereren van schoolmateriaal:

1. **Lees school-content/** - Check spelling/, grammar/, math/ folders
2. **Analyseer inhoud** - Extraheer woorden, thema's, onderwerpen
3. **Haal kind profiel op** - Lees `interests` array uit Supabase profiel
4. **Genereer thematische levels** - Combineer schoolwoorden met interesses
5. **Review output** - Sla op in *-CONTENT.md bestanden

### Kind Interesses (opgeslagen in profiles.interests)
- dinosaurussen, ruimte, dieren, voetbal, autos
- prinsessen, superhelden, natuur, robots, piraten

### Voorbeeld Prompts
- "Genereer levels van de spellingwoorden deze week"
- "Maak Code Kraken levels van school-content/spelling/week-12.txt"
- "Combineer de grammatica met [kind]'s interesses"

### Slash Command
Gebruik `/generate-school-levels` om automatisch schoolmateriaal te analyseren en gepersonaliseerde levels te maken.

## Contact

Dit project is gemaakt voor Balloon Ravers / Mich.
