# Galactische Vrienden - Bug Fixes & Verbeteringen

## Kritieke Bugs (voor volgende sprint)

### 1. Lettergreep Springer - Laatste lettergreep niet hoorbaar
- **Probleem**: Bij de laatste lettergreep van een zin wordt de audio afgebroken
- **Oorzaak**: `handleSyllableClick` checkt `nextIndex >= sentence.syllables.length - 1` en gaat direct naar volgende zin
- **Fix**: Wacht tot speech klaar is voordat naar volgende zin wordt gegaan

### 2. Lettergreep Springer - Laatste blok niet klikbaar
- **Probleem**: Je kunt niet naar het laatste blok springen
- **Oorzaak**: `if (nextIndex >= sentence.syllables.length) return` blokkeert de laatste sprong
- **Fix**: Logica aanpassen zodat laatste blok wel bereikbaar is

### 3. Lettergreep Springer - Achteruit springen
- **Feature request**: Als je op het VORIGE blok klikt, spring achteruit
- **Doel**: Kind kan lettergreep nog een keer horen
- **Implementatie**: `handleSyllableClick` uitbreiden voor `index === currentSyllableIndex - 1`

### 4. TrollGame - Laatste woord breekt af
- **Probleem**: Bij het laatste woord wordt soms te vroeg afgebroken
- **Oorzaak**: Vergelijkbare timing issues met speech synthesis
- **Fix**: Speech completion callback gebruiken

### 5. Code Kraken - Mogelijk zelfde probleem
- **Check**: Testen of laatste level/woord correct werkt

## Medium Prioriteit

### 6. Speech Synthesis Timing
- Algemene verbetering: `onend` event gebruiken i.p.v. vaste timeouts
- Helper functie maken: `speakAndWait(text)` die Promise returnt

### 7. Demo Mode - Progress opslaan
- **Huidige situatie**: Demo mode heeft GEEN persistent geheugen
- **Fix**: Progress opslaan in localStorage voor demo users
- **Locatie**: `useProgress.js` - check voor demo mode en gebruik localStorage

### 8. Demo Mode UX
- Duidelijker maken dat je in demo mode zit
- Optie om naar echte login te gaan

## Lage Prioriteit

### 7. Animatie synchronisatie TrollGame
- Scheet geluid en visuele animatie beter syncen

### 8. Generated Story Reader
- Route `currentView === 'generated-reader'` implementeren
- Zelfde ReadingRuler als StoryMenu gebruiken

## Deployment Checklist

- [ ] Git repo initialiseren
- [ ] .gitignore check (node_modules, .env)
- [ ] Environment variables documenteren
- [ ] Build testen (`npm run build`)
- [ ] Render.com deployment

## Notities

De speech synthesis timing verschilt per browser. Overweeg:
1. `utterance.onend` callback voor betrouwbare timing
2. Fallback timeout als onend niet fired
3. Queue systeem voor meerdere utterances
