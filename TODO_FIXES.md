# Galactische Vrienden - Bug Fixes & Verbeteringen

## ✅ VOLTOOID

### 1. Lettergreep Springer - Laatste lettergreep niet hoorbaar ✅
- **Probleem**: Bij de laatste lettergreep van een zin werd de audio afgebroken
- **Fix**: `speakAndWait` helper toegevoegd die wacht op `onend` event voordat naar volgende zin wordt gegaan
- **Commit**: fdad5a8

### 2. Lettergreep Springer - Laatste blok niet klikbaar ✅
- **Probleem**: Je kon niet naar het laatste blok springen
- **Fix**: `>= sentence.syllables.length` gewijzigd naar `> sentence.syllables.length - 1`
- **Commit**: fdad5a8

### 3. Lettergreep Springer - Achteruit springen ✅
- **Feature**: Klik op VORIGE blok om achteruit te springen en lettergreep nog een keer te horen
- **Fix**: `handleSyllableClick` uitgebreid voor `index === currentSyllableIndex - 1`
- **Visueel**: 🔄 icoon op vorig blok toont dat het klikbaar is
- **Commit**: fdad5a8

### 4. Speech Synthesis Timing ✅
- **Fix**: `speakAndWait(text)` helper functie toegevoegd die Promise returnt
- **Gebruikt**: `onend` event met fallback timeout (2000ms)
- **Commit**: fdad5a8

### 5. Demo Mode - Progress opslaan ✅
- **Fix**: localStorage gebruikt voor demo mode progress
- **Key**: `galactische_vrienden_demo_progress`
- **Opgeslagen**: stars, completedLevels, unlockedItems
- **Commit**: 70219ac

### 6. Render.com Deployment ✅
- **Git repo**: https://github.com/michaelhane/galacticsche_vriendjes.git
- **Frontend**: https://galactische-vrienden-web.onrender.com
- **Backend**: https://galactische-vrienden-api.onrender.com
- **Commits**: render.yaml fixes (ca1f431, f87a782, 2e50acb)

## Medium Prioriteit

### 7. Demo Mode UX
- Duidelijker maken dat je in demo mode zit
- Optie om naar echte login te gaan

### 8. TrollGame - Scheetgeluid/animatie sync
- Scheetgeluid en visuele animatie beter synchroniseren

## Lage Prioriteit

### 9. Generated Story Reader
- Route `currentView === 'generated-reader'` implementeren
- Zelfde ReadingRuler als StoryMenu gebruiken

## Notities

De speech synthesis timing verschilt per browser. Implementatie:
1. `utterance.onend` callback voor betrouwbare timing ✅
2. Fallback timeout (2000ms) als onend niet fired ✅
3. `speakAndWait(text)` helper die Promise returnt ✅
