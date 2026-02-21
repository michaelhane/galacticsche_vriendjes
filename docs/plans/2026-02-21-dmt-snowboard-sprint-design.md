# DMT Snowboard Sprint - Design Document

**Datum:** 2026-02-21
**Status:** Goedgekeurd

## Overzicht

DMT (Drie Minuten Toets) oefenspel voor Galactische Vrienden. Helpt kinderen hun leessnelheid te verbeteren door middel van twee modi: een speelse oefenmodus en een realistische toetssimulatie. Snowboard-thema met skilift en halfpipe als motivatiesysteem.

## Modi

### Oefenmodus ("Vrije Run")

- Woorden verschijnen 1 voor 1, groot in het midden
- Kind leest hardop, drukt op "Volgende" knop of swiped
- Timer loopt mee (zichtbaar maar niet intimiderend)
- Instelbaar: 25/50/100 woorden OF 1/2/3 minuten
- Woordteller toont voortgang
- Na sessie: resultaten + snowboard animatie

### Toetsmodus ("DMT Kaart")

Twee varianten:

**Zonder ouder:**
- Echte DMT-layout: 5 kolommen, ~30 rijen per kaart
- 3 kaarten per toets (1 min per kaart):
  - Kaart 1: makkelijk (1 lettergreep, lager AVI-niveau)
  - Kaart 2: medium (2 lettergrepen)
  - Kaart 3: moeilijk (3+ lettergrepen)
- Kind tikt op elk gelezen woord (wordt groen)
- Timer stopt automatisch na 60 seconden

**Met ouder:**
- Zelfde layout maar ouder zit erbij
- Kind leest hardop, ouder kan fouten markeren
- Ouder drukt "stop" of timer loopt af

## Woordselectie

- AVI-niveau instelbaar (alle niveaus beschikbaar)
- Woorden uit bestaande woordenbank (~1475 woorden)
- DMT-kaarten: Kaart 1/2/3 structuur met woorden uit gekozen AVI-niveau
- Spaced repetition: langzame woorden komen vaker terug in oefenmodus

## Snowboard Thema & Mijlpalen

### Visueel
- Berg met sneeuwtoppen als achtergrond
- Skilift met stoeltjes die omhoog gaan
- Snowboarder-figuur op de lift (positie = % naar mijlpaal)
- Sneeuw-achtige achtergrond (lichtblauw gradient)

### Mijlpalen Systeem
1. Eerste sessie = baseline (bijv. 30 woorden/min)
2. Mijlpaal 1: +10% sneller → Skilift start
3. Mijlpaal 2: +20% → Halverwege de berg
4. Mijlpaal 3: +30% → Bijna boven
5. Mijlpaal 4: +40% → TOP! Halfpipe-run met trucjes!
6. Na halfpipe: nieuwe baseline, berg wordt "steiler" (volgend niveau)

### Halfpipe Animatie
- Snowboarder gaat van de top naar beneden
- Trucjes: 360 spin, backflip via CSS animaties
- Sneeuweffecten, sterren, confetti

## Componenten

```
Games/
└── DMT/
    ├── DMTMenu.jsx          # Kies modus + AVI-niveau + instellingen
    ├── DMTPractice.jsx      # Oefenmodus (woord-voor-woord)
    ├── DMTTest.jsx          # Toetsmodus (echte DMT-kaart layout)
    ├── DMTResults.jsx       # Resultaten + grafiek + snowboard animatie
    ├── SnowboardScene.jsx   # SVG snowboard animatie (skilift + halfpipe)
    └── dmtWords.js          # Woordselectie logica voor DMT-kaarten
```

### Navigatieflow
```
Dashboard → DMTMenu → [DMTPractice | DMTTest] → DMTResults
                ↑                                      |
                └──────── "Opnieuw" ────────────────────┘
```

### Props (standaard game interface)
- `onBack` - terug naar dashboard
- `speak` - TTS functie
- `addStars` - sterren toevoegen
- `completeLevel` - level voltooien

## Data Opslag

### Supabase tabel: `dmt_sessions`

```sql
CREATE TABLE dmt_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  mode TEXT NOT NULL,              -- 'practice' | 'test'
  avi_level TEXT NOT NULL,         -- 'avi-start', 'avi-m3', etc.
  settings JSONB,                  -- { wordCount, timeLimit }
  results JSONB NOT NULL,          -- { totalWords, totalTimeMs, wordsPerMinute, cards[] }
  is_baseline BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase tabel: `dmt_milestones`

```sql
CREATE TABLE dmt_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  avi_level TEXT NOT NULL,
  baseline FLOAT NOT NULL,          -- woorden per minuut
  current_milestone INT DEFAULT 0,  -- 0-4
  best_score FLOAT,
  snowboard_position FLOAT DEFAULT 0, -- 0-1
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, avi_level)
);
```

### localStorage fallback
- `dmt_sessions` en `dmt_milestones` keys
- Sync via bestaand `storageSync.js` pattern

## Resultaten Scherm

- Samenvatting: woorden per minuut (of totaal bij toetsmodus)
- Lijngrafiek: voortgang over sessies
- Vergelijking met baseline
- Mijlpaalbalk: "Nog X woorden sneller voor de volgende truc!"
- Snowboard animatie bij mijlpaal

## Sterren

| Actie | Sterren |
|-------|---------|
| Oefensessie voltooid | 5 |
| Toets voltooid | 10 |
| Persoonlijk record | +5 bonus |
| Mijlpaal bereikt | +25 bonus |

## Styling

- Kleurschema: Blauw/wit (sneeuw thema) - `from-sky-400 to-blue-600`
- Toetsmodus: strak wit, minimaal (niet afleidend)
- Oefenmodus: speelser met sneeuwvlokjes
- Timer: normaal = blauw, 15s = oranje, 5s = rood

---

## Implementatie: Multi-Agent Plan

### Agent Rollen

#### Agent 1: "Database & Data Layer" (Fundament)
**Verantwoordelijk voor:**
- Supabase migraties (`dmt_sessions`, `dmt_milestones` tabellen)
- `dmtWords.js` - woordselectie logica voor DMT-kaarten
- `useDMT.js` hook - data opslag, sessies ophalen, mijlpalen berekenen
- localStorage fallback integratie

**Output:** Werkende data layer die andere agents kunnen importeren
**Geen dependencies**

#### Agent 2: "Snowboard Visuals" (Onafhankelijk)
**Verantwoordelijk voor:**
- `SnowboardScene.jsx` - volledige SVG scene
  - Berg met sneeuwtoppen
  - Skilift animatie
  - Snowboarder figuur (statisch + animatie states)
  - Halfpipe-run animatie met trucjes
  - Sneeuwvlokjes/confetti effecten
- CSS animaties (@keyframes voor trucjes, lift, sneeuw)

**Output:** Zelfstandig component dat `position` (0-1) en `playHalfpipe` (bool) props accepteert
**Geen dependencies** - puur visueel, kan los ontwikkeld worden

#### Agent 3: "Oefenmodus" (Wacht op Agent 1)
**Verantwoordelijk voor:**
- `DMTPractice.jsx` - woord-voor-woord gameplay
  - Groot woord display met slide-animatie
  - "Volgende" knop + swipe support
  - Timer (instelbaar: woorden of tijd)
  - Woordteller/voortgangsbalk
  - Spaced repetition integratie (recordAttempt)

**Dependencies:** Agent 1 (dmtWords.js, useDMT.js)

#### Agent 4: "Toetsmodus" (Wacht op Agent 1)
**Verantwoordelijk voor:**
- `DMTTest.jsx` - echte DMT-kaart layout
  - 5-kolommen grid layout
  - 3 kaarten systeem (makkelijk/medium/moeilijk)
  - 60 seconden countdown timer per kaart
  - Zonder-ouder modus: tik op woord = gelezen
  - Met-ouder modus: ouder markeert fouten
  - Rustscherm tussen kaarten

**Dependencies:** Agent 1 (dmtWords.js, useDMT.js)

#### Agent 5: "Menu & Resultaten" (Wacht op Agent 1 + 2)
**Verantwoordelijk voor:**
- `DMTMenu.jsx` - moduskeuze, AVI-niveau, instellingen
- `DMTResults.jsx` - resultaten, grafiek, mijlpalen, snowboard integratie
- Dashboard integratie (nieuwe kaart in Dashboard.jsx)
- App.jsx routing (currentView = 'dmt')

**Dependencies:** Agent 1 (useDMT.js), Agent 2 (SnowboardScene.jsx)

### Coordinator Agent
**Verantwoordelijk voor:**
- Agents starten in juiste volgorde
- Shared interfaces/types definiëren vooraf
- Merge conflicten oplossen
- Eindintegratie en smoke test
- Code review op consistentie

### Executievolgorde

```
Fase 1 (parallel):
  ├── Agent 1: Database & Data Layer
  └── Agent 2: Snowboard Visuals

Fase 2 (parallel, na Agent 1):
  ├── Agent 3: Oefenmodus
  └── Agent 4: Toetsmodus

Fase 3 (na Agent 1 + 2):
  └── Agent 5: Menu & Resultaten + Integratie

Fase 4:
  └── Coordinator: Review + Eindintegratie
```

### Shared Interfaces (vooraf gedefinieerd door Coordinator)

```typescript
// Types die alle agents gebruiken
interface DMTSession {
  id: string
  mode: 'practice' | 'test'
  aviLevel: string
  settings: { wordCount?: number; timeLimit?: number }
  results: DMTResults
  isBaseline: boolean
  createdAt: string
}

interface DMTResults {
  totalWords: number
  totalTimeMs: number
  wordsPerMinute: number
  cards?: DMTCard[]        // alleen bij toetsmodus
  wordTimes?: WordTime[]   // alleen bij oefenmodus
}

interface DMTCard {
  cardNumber: 1 | 2 | 3
  wordsRead: number
  totalWords: number
  errors?: string[]        // alleen met-ouder modus
}

interface DMTMilestone {
  aviLevel: string
  baseline: number
  currentMilestone: number  // 0-4
  bestScore: number
  snowboardPosition: number // 0-1
}

// SnowboardScene props
interface SnowboardProps {
  position: number          // 0-1, positie op de berg
  playHalfpipe: boolean     // trigger halfpipe animatie
  onHalfpipeComplete: () => void
}

// useDMT hook return
interface UseDMTReturn {
  sessions: DMTSession[]
  milestones: Record<string, DMTMilestone>
  saveSession: (session: Omit<DMTSession, 'id'>) => Promise<void>
  getBaseline: (aviLevel: string) => number | null
  checkMilestone: (aviLevel: string, wpm: number) => MilestoneResult
  getWordsForPractice: (aviLevel: string, count: number) => Word[]
  getWordsForTest: (aviLevel: string) => { card1: Word[], card2: Word[], card3: Word[] }
}
```
