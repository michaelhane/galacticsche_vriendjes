# Generate School Levels

Analyze school content and generate personalized game levels for Galactische Vrienden.

## Instructions

When this command is run, follow these steps:

### 1. Scan School Content Folder
Read all files in `school-content/` folder:
- `school-content/spelling/` - Spelling words and rules
- `school-content/grammar/` - Grammar topics
- `school-content/math/` - Math topics (for future use)

### 2. Analyze Content
For each file found:

**Text files (.txt, .md):**
- Parse line by line
- Identify word lists (single words per line)
- Detect themes from headers/comments (lines starting with #)
- Note any difficulty indicators

**Images (.jpg, .png):**
- Use vision to read text from worksheets
- Identify word lists and instructions
- Note the educational context/theme

**PDFs (.pdf):**
- Read page by page
- Extract text and identify curriculum topics

### 3. Get Child Profile
Read the child's interests from their Supabase profile. The interests are stored as an array, such as:
- dinosaurussen (Dinosaurs)
- ruimte (Space/rockets)
- dieren (Animals)
- voetbal (Football)
- robots (Robots)
- etc.

### 4. Generate Themed Levels
Combine school curriculum with child's interests:

**For Code Kraken (lettergrepen):**
- Take school words and split into syllables
- Add phonetic pronunciation
- Choose emoji that combines school theme + interest
- Create themed level title (e.g., "Dino's Leren Spelling")

**For Troll Game (klemtoon):**
- Identify stressed syllables in school words
- Mark stress with uppercase
- Add stressIndex

### 5. Output Format
Generate markdown content that can be reviewed:

```markdown
## Generated Level: [Title]
**Source:** school-content/spelling/week-XX.txt
**Interest:** [child's interest used]
**Date:** [today's date]

### Code Kraken Words
| Woord | Lettergrepen | Uitspraak | Emoji |
|-------|--------------|-----------|-------|
| [word] | [parts] | [phonetic] | [emoji] |

### Troll/Klemtoon Words
| Woord | Lettergrepen | Klemtoon Op |
|-------|--------------|-------------|
| [word] | [STRESS, other] | [stressed part] |
```

### 6. Save Results
Append generated content to:
- `frontend/src/data/CODE-KRAKEN-CONTENT.md` (for syllable games)
- `frontend/src/data/TROLL-CONTENT.md` (for stress games)

## Example Prompts After Running

After analyzing, you might say:
"Ik heb 12 spellingwoorden gevonden in week-15.txt over het thema 'winter'.
Gecombineerd met [naam]'s interesse in dinosaurussen, maak ik een level:
'Dino's in de Winter' met woorden als sneeuw-vlok, ijs-pe-gel..."

## Notes

- Always verify the syllable count is correct for Dutch words
- Use child-appropriate emojis
- Keep pronunciation accurate for Dutch phonetics
- The generated content is for review - parent/teacher can approve before adding to game
