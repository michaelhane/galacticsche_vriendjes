# CLAUDE.md - Galactische Vrienden

## Missie

Galactische Vrienden is een educatieve leesapp voor kinderen met een **leesachterstand**. Door gamificatie en personalisatie helpen we kinderen van hun huidige AVI-niveau naar hun doelniveau te groeien.

**Kernprincipe**: Het kind merkt niet dat het oefent - het speelt een spel.

---

## ⛔ KRITIEKE REGELS (LEES DIT EERST)

### 1. NOOIT Voortgang Resetten

Kinderen met leesachterstand raken snel gefrustreerd. Als ze hun sterren en voortgang kwijtraken is dat **extreem demotiverend**.

```
❌ FOUT: Progress alleen in React state (weg bij refresh)
❌ FOUT: Progress alleen in localStorage (weg bij andere device)
✅ GOED: Progress in Supabase database + localStorage als fallback/buffer
```

**Implementatie vereist:**
- Elke voltooide level → **direct** opslaan in database
- Elke verdiende ster → **direct** opslaan
- Bij app start → laad ALLES uit database eerst
- Bij offline → localStorage als buffer, sync wanneer weer online
- NOOIT wachten tot einde sessie met opslaan

```javascript
// Voorbeeld: direct opslaan bij elke actie
const handleLevelComplete = async (levelId, starsEarned) => {
  // 1. Update lokale state (instant feedback)
  setCompletedLevels(prev => [...prev, levelId])
  setStars(prev => prev + starsEarned)
  
  // 2. Sla op in localStorage (backup)
  saveToLocalStorage({ completedLevels, stars })
  
  // 3. Sync naar database (persistent)
  await supabase.from('completed_levels').insert({...})
  await supabase.from('profiles').update({ stars: newTotal })
}
```

### 2. NOOIT Zelf Woorden Bedenken

Claude mag **NOOIT** zelf woorden genereren of lettergrepen splitsen. Alle woorden komen uit de gevalideerde JSON database.

```
❌ FOUT: "Ik genereer even een paar woorden voor niveau M4"
❌ FOUT: "Het woord 'kwaak' splitsen we als kwa-ak"
❌ FOUT: "Laten we 'vliegtuig' toevoegen als vlie-gtu-ig"
✅ GOED: Gebruik ALLEEN woorden uit /data/words/*.json
```

**Waarom?**
- "kwa-akt" lijkt 2 lettergrepen maar "kwaakt" is 1 lettergreep
- AI maakt fouten met Nederlandse lettergreep-regels
- Kinderen leren FOUTE patronen aan die moeilijk af te leren zijn
- Eén fout woord kan weken oefenwerk tenietdoen

### 3. ALTIJD Woorden Valideren Voordat Ze In Database Gaan

Elk woord moet voldoen aan ALLE checks:

| # | Check | Regel | Goed | Fout |
|---|-------|-------|------|------|
| 1 | **Bestaat** | Woord staat in woordenboek | planeet | ploneet |
| 2 | **Spelling** | Correct Nederlands gespeld | giraffe | giraf |
| 3 | **Lettergrepen tellen** | Tel hardop klappend | kro-ko-dil (3) | kwa-akt (1, niet 2!) |
| 4 | **Samengevoegd = woord** | syllables.join('') === word | ["pla","neet"] → "planeet" ✅ | ["pla","ne","et"] → "planeet" ❌ |
| 5 | **Niveau passend** | Lettergrepen passen bij AVI | M3: max 1 lettergreep | M3 met 3 lettergrepen ❌ |
| 6 | **Kind-vriendelijk** | Geen enge/moeilijke concepten | vlinder ✅ | doodskist ❌ |

**Lettergreep test methode:**
```
Klap in je handen bij elke lettergreep:
- "planeet" → KLAP-KLAP (pla-neet) = 2 ✅
- "kwaakt" → KLAP (kwaakt) = 1 ✅
- "kwa-akt" → FOUT, dit is geen 2 lettergrepen!
```

### 4. Text-to-Speech MOET ALTIJD Werken

Dit is **niet optioneel**. Kinderen met leesachterstand MOETEN woorden kunnen horen. Zonder werkende TTS is de app onbruikbaar voor de doelgroep.

```
❌ FOUT: "Speech synthesis wordt niet ondersteund" (en dan niks doen)
✅ GOED: Probeer alles tot het werkt:
   1. Web Speech API (native)
   2. ResponsiveVoice (fallback)
   3. Pre-recorded audio (laatste redmiddel voor kernwoorden)
```

**Implementatie:**
```javascript
const speak = async (text) => {
  // Poging 1: Native Web Speech API
  if ('speechSynthesis' in window) {
    try {
      await speakNative(text)
      return // Gelukt!
    } catch (e) {
      console.warn('Native speech failed:', e)
    }
  }
  
  // Poging 2: ResponsiveVoice
  if (window.responsiveVoice?.voiceSupport()) {
    try {
      await speakResponsiveVoice(text)
      return // Gelukt!
    } catch (e) {
      console.warn('ResponsiveVoice failed:', e)
    }
  }
  
  // Poging 3: Pre-recorded audio (als beschikbaar)
  const audioFile = getPreRecordedAudio(text)
  if (audioFile) {
    await playAudio(audioFile)
    return
  }
  
  // Als ALLES faalt: visuele feedback + waarschuwing
  showVisualFeedback(text)
  console.error('ALL SPEECH METHODS FAILED - this is critical!')
}
```

---

## Doelgroep

- **Leeftijd**: 6-10 jaar (groep 3-5)
- **Probleem**: Leesachterstand (lezen onder verwacht niveau)
- **Uitdaging**: Traditionele oefenmethodes zijn saai, frustrerend
- **Oplossing**: Ruimte-thema game die ongemerkt leesvaardigheden traint

### Gebruikersprofiel Voorbeeld
```
Naam: Emma
Leeftijd: 8 jaar
Groep: 4
Huidig niveau: AVI-E3 (niveau eind groep 3)
Doelniveau: AVI-M4 (niveau midden groep 4)
Achterstand: ~6 maanden
Interesses: Dieren, ruimte, prinsessen
```

---

## AVI Leesniveaus (Nederland)

Het AVI-systeem meet technisch lezen. Er zijn 12 niveaus:

| Niveau | Groep | Zinslengte | Max Lettergrepen | Woordkenmerken |
|--------|-------|------------|------------------|----------------|
| **Start** | Begin 3 | <6 woorden | 1 | Klankzuiver (maan, vis, rook), geen hoofdletters |
| **M3** | Midden 3 | ~6 woorden | 1 | + sch-, -ng, -nk klanken |
| **E3** | Eind 3 | ~7 woorden | 2 | + voet-bal, boek-je, hoofdletters |
| **M4** | Midden 4 | ~8 woorden | 3 (makkelijk) | + makkelijke 3-lettergreep |
| **E4** | Eind 4 | ~9 woorden | 3 | + ge-le-zen, ver-ge-ten |
| **M5** | Midden 5 | ~10 woorden | 4 | + samenstellingen |
| **E5** | Eind 5 | ~10-11 woorden | 4+ | + fan-tas-tisch |
| **M6** | Midden 6 | ~11 woorden | Geen limiet | + circus, categorie |
| **E6** | Eind 6 | ~11 woorden | Geen limiet | Complex |
| **M7** | Midden 7 | ~12 woorden | Geen limiet | Gevorderd |
| **E7** | Eind 7 | ~12+ woorden | Geen limiet | Bijna volwassen |
| **Plus** | Boven 7 | Geen limiet | Geen limiet | Vloeiend |

### Niveau Progressie Logica

```javascript
// Kind in groep 4 zou moeten zitten op:
// - Januari: AVI-M4
// - Juni: AVI-E4

// Achterstand berekenen:
const expectedLevel = getExpectedLevel(groep, maand)
const actualLevel = profile.aviLevel
const gap = levelDifference(expectedLevel, actualLevel)
// gap > 0 = achterstand
```

---

## Woorden Database

### Structuur

```
frontend/src/data/words/
├── index.js              # Hoofd export & helpers
├── avi-start.json        # Niveau Start (1 lettergreep, klankzuiver)
├── avi-m3.json           # Niveau M3 (1 lettergreep, + sch/ng/nk)
├── avi-e3.json           # Niveau E3 (max 2 lettergrepen)
├── avi-m4.json           # Niveau M4 (max 3 lettergrepen)
├── avi-e4.json           # Niveau E4 (max 3 lettergrepen + ge/be/ver)
├── avi-m5.json           # Niveau M5 (max 4 lettergrepen)
└── avi-e5.json           # Niveau E5 (max 4+ lettergrepen)
```

### JSON Format

```json
{
  "level": "E3",
  "description": "Eind groep 3",
  "maxSyllables": 2,
  "validated": true,
  "validatedBy": "Native speaker",
  "validatedDate": "2024-12-01",
  "words": [
    {
      "word": "voetbal",
      "syllables": ["voet", "bal"],
      "syllableCount": 2,
      "pronunciation": "voet-bal",
      "image": "⚽",
      "category": "sport"
    },
    {
      "word": "boekje",
      "syllables": ["boek", "je"],
      "syllableCount": 2,
      "pronunciation": "boek-je",
      "image": "📖",
      "category": "voorwerpen"
    }
  ],
  "stressWords": [
    {
      "word": "voetbal",
      "syllables": ["VOET", "bal"],
      "stressIndex": 0,
      "pronunciation": "VOET-bal"
    }
  ]
}
```

### Validatie Script (voor nieuwe woorden)

```javascript
const validateWord = (entry, aviLevel) => {
  const errors = []
  
  // Check 1: Syllables vormen het woord
  const joined = entry.syllables.join('')
  if (joined !== entry.word) {
    errors.push(`Syllables "${entry.syllables.join('-')}" vormen niet "${entry.word}"`)
  }
  
  // Check 2: Aantal lettergrepen klopt
  if (entry.syllables.length !== entry.syllableCount) {
    errors.push(`syllableCount ${entry.syllableCount} !== actual ${entry.syllables.length}`)
  }
  
  // Check 3: Past bij AVI niveau
  const maxAllowed = getMaxSyllables(aviLevel)
  if (entry.syllableCount > maxAllowed) {
    errors.push(`${entry.syllableCount} lettergrepen > max ${maxAllowed} voor ${aviLevel}`)
  }
  
  // Check 4: Geen lege syllables
  if (entry.syllables.some(s => s.length === 0)) {
    errors.push('Lege lettergreep gevonden')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## Personalisatie Systeem

### Profiel Data

```javascript
const userProfile = {
  // Basis
  id: "uuid",
  displayName: "Emma",
  age: 8,
  grade: 4,
  
  // AVI Niveaus (CRUCIAAL)
  currentAviLevel: "E3",    // Waar kind NU leest
  targetAviLevel: "M4",     // Waar kind HOORT te lezen
  
  // Interesses (voor thema's)
  interests: ["dieren", "ruimte", "sport"],
  
  // Voortgang (MOET PERSISTENT ZIJN)
  stars: 150,
  completedLevels: {
    code_kraken: [0, 1, 2],
    jumper: [0],
    troll: [],
    stories: [0, 1]
  },
  unlockedItems: ["plant-alien", "telescope"],
  
  // Leerdata
  strugglingWith: ["sch-woorden", "3-lettergreep"],
  strongAt: ["1-lettergreep", "klemtoon"]
}
```

### Adaptieve Moeilijkheid

```javascript
const getWordsForUser = (profile) => {
  const current = profile.currentAviLevel
  const target = profile.targetAviLevel
  
  // Mix: 60% huidig, 30% uitdaging, 10% makkelijk (zelfvertrouwen)
  return {
    practice: getWords(current, 6),
    challenge: getWords(nextLevel(current), 3),
    confidence: getWords(prevLevel(current), 1)
  }
}
```

---

## Games Overzicht

### 1. Code Kraken (Lettergreep puzzel)
- Woord in stukjes → kind zet in juiste volgorde
- **Elke klik spreekt lettergreep uit** (TTS!)
- Afbeelding als hint
- **Leerdoel**: Lettergrepen herkennen

### 2. De Brutelaars (Klemtoon)
- Trollen met lettergrepen
- Houd "sterkste" lettergreep ingedrukt
- Trol explodeert bij juiste antwoord
- **Leerdoel**: Klemtoon herkennen
- **Let op**: `onContextMenu={(e) => e.preventDefault()}` voor mobiel

### 3. Lettergreep Springer (Lezen)
- Kikker springt over leliebladen
- Elk blad = lettergreep van zin
- **TTS spreekt elke lettergreep bij klik**
- **Leerdoel**: Vloeiend lezen

### 4. Verhalen Lezer (Begrijpend lezen)
- Korte verhalen per AVI-niveau
- Reading ruler (gele balk volgt tekst)
- Auto-voorlees optie (TTS)
- **Leerdoel**: Leesvloeiendheid

### 5. Verhalen Fabriek (Creativiteit)
- Kind kiest: held, plek, voorwerp
- AI genereert kort verhaal op AVI-niveau
- **Leerdoel**: Leesplezier, motivatie

---

## Gamificatie

### Sterren Systeem
| Actie | Sterren |
|-------|---------|
| Woord correct (Code Kraken) | +5 |
| Level compleet | +10 bonus |
| Verhaal gelezen | +10 |
| Springer verhaal | +20 |
| Brutelaars compleet | +30 |

### Beloningen
- Bio-Koepel items (19 stuks, 0-500 sterren)
- Visuele progressie (ruimtestation groeit)
- NOOIT straffen voor fouten
- Altijd positieve feedback

---

## Technische Architectuur

```
Frontend (React + Vite + Tailwind)
├── Supabase Auth (Magic Link - geen wachtwoord)
├── Supabase Database
│   ├── profiles (gebruiker + AVI levels + sterren)
│   ├── completed_levels (PERSISTENT!)
│   ├── user_items
│   └── learning_analytics
├── localStorage (offline buffer)
└── Backend (Express)
    └── Gemini API (verhaal generatie)
```

### Persistence Flow

```
[Kind speelt] 
    ↓
[Level compleet]
    ↓
[Update React state] ← Instant feedback
    ↓
[Save localStorage] ← Offline backup
    ↓
[Save Supabase] ← Persistent
    ↓
[Sync check] ← Bij volgende app start
```

---

## Code Conventies

- **React**: Functionele componenten + hooks
- **Styling**: Tailwind CSS alleen
- **Taal UI**: Nederlands
- **Taal code**: Engels
- **State**: Direct opslaan, nooit wachten
- **TTS**: Altijd met fallback

### Component Template

```jsx
const GameComponent = ({ profile, onComplete, speak }) => {
  const [showIntro, setShowIntro] = useState(true)
  
  // Laad ALLEEN woorden uit database, genereer NOOIT
  const words = useMemo(() => 
    getWordsFromDatabase(profile.currentAviLevel),
    [profile.currentAviLevel]
  )
  
  const handleCorrect = async () => {
    await speak("Goed zo!") // TTS - moet werken!
    // Direct opslaan
    await saveProgress(...)
  }
  
  return (...)
}
```

---

## Test Checklist

### Kritiek (moet 100% werken)
- [ ] TTS werkt op iOS Safari
- [ ] TTS werkt op Android Chrome
- [ ] TTS werkt op Desktop
- [ ] Progress blijft na refresh
- [ ] Progress blijft na app sluiten
- [ ] Alle woorden correct gespeld
- [ ] Alle lettergrepen kloppen

### Belangrijk
- [ ] Kind begrijpt wat te doen
- [ ] Feedback is positief
- [ ] Niet frustrerend bij fouten

---

## Bronnen

- [Cito AVI-systeem](https://www.cito.nl)
- [Zwijsen AVI uitleg](https://www.zwijsen.nl/leren-lezen/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [ResponsiveVoice](https://responsivevoice.org/)
