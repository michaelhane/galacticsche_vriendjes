# School Content - Galactische Vrienden

Drop schoolmaterialen hier zodat Claude ze kan gebruiken om gepersonaliseerde woordenlijsten en levels te maken.

## Ondersteunde formaten

- **Foto's:** `.jpg`, `.png` (van werkbladen, boekpagina's)
- **PDF:** `.pdf` (gescande documenten)
- **Tekst:** `.txt`, `.md` (getypte lijsten)

## Mappen

```
school-content/
├── spelling/     # Spellingwoorden en regels
├── grammar/      # Grammatica onderwerpen (werkwoorden, etc.)
└── math/         # Rekenen (voor later)
```

## Voorbeeld gebruik

### Stap 1: Materiaal toevoegen
Maak een foto van de spellinglijst van deze week en sla op in `spelling/`:
```
spelling/week-12.jpg
```

Of typ de woorden in een tekstbestand:
```
spelling/week-12.txt
```

### Stap 2: Vraag Claude
Gebruik de slash command of vraag direct:

**Slash Command:**
```
/generate-school-levels
```

**Of vraag handmatig:**
- "Genereer Code Kraken levels van spelling week 12"
- "Maak klemtoon oefeningen van de woorden in spelling/week-12.txt"
- "Combineer de spellingwoorden met [kind]'s interesses"

### Stap 3: Review
De gegenereerde content wordt opgeslagen en kan gereviewd worden in de `*-CONTENT.md` bestanden in `frontend/src/data/`.

## Tips

1. **Duidelijke foto's:** Zorg dat tekst goed leesbaar is
2. **Eén onderwerp per bestand:** Niet spelling en rekenen in hetzelfde bestand
3. **Datum in bestandsnaam:** Maakt het makkelijker om terug te vinden (bijv. `week-12.jpg` of `2024-01-15.txt`)

## Voorbeeld tekstbestand

```txt
# Spellingwoorden Week 12
# Thema: De winter

sneeuw
schaatsen
ijspegel
muts
handschoenen
```

## Personalisatie met Kind's Interesses

Claude combineert automatisch schoolwoorden met de interesses die in het profiel zijn ingesteld:
- Dinosaurussen, Ruimte, Dieren, Voetbal, Auto's
- Prinsessen, Superhelden, Natuur, Robots, Piraten

**Voorbeeld:** Spellingwoorden over "winter" + interesse "dinosaurussen" =
Level "Dino's in de Winter" met woorden als sneeuw-vlok, ijs-pe-gel...

Interesses kunnen aangepast worden in de app via Instellingen.

## Privacy

Deze map staat in `.gitignore` - schoolmaterialen worden niet gedeeld via git.
