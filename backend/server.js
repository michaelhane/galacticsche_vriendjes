import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3050;

// Middleware
const allowedOrigins = [
  'http://localhost:3051',
  'http://localhost:5173',
  'http://localhost:4173', // Vite preview
  process.env.FRONTEND_URL // Productie URL (Render of GitHub Pages)
].filter(Boolean);

// GitHub Pages pattern: https://<username>.github.io
const isGitHubPages = (origin) => origin && /^https:\/\/[\w-]+\.github\.io$/.test(origin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin) || isGitHubPages(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS niet toegestaan'));
    }
  },
  credentials: true
}));
// Increase payload limit for image uploads (10MB)
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Claude API - Story Generation
app.post('/api/generate-story', async (req, res) => {
  const { hero, place, item, gradeLevel = 3 } = req.body;

  if (!hero || !place || !item) {
    return res.status(400).json({ error: 'hero, place en item zijn verplicht' });
  }

  const gradeConfig = {
    3: { maxSentences: 6, maxWords: 6, avi: 'M3' },
    4: { maxSentences: 8, maxWords: 8, avi: 'E4' },
    5: { maxSentences: 10, maxWords: 10, avi: 'M5' }
  };
  const config = gradeConfig[gradeLevel] || gradeConfig[3];

  const systemPrompt = `Je bent een Nederlandse kinderboekenauteur voor kinderen in groep ${gradeLevel} (AVI ${config.avi}).

VEREISTEN:
- ${config.maxSentences} korte zinnen (max ${config.maxWords} woorden per zin)
- Eenvoudige woorden
- Grappig en leuk
- Positieve boodschap
- 1 weetje over het onderwerp

Antwoord met ALLEEN ruwe JSON. GEEN markdown, GEEN codeblokken.
Begin direct met { en eindig met }

Format: {"title":"...","content":["Zin 1.","Zin 2."],"fact":"Een leuk weetje."}`;

  const userPrompt = `Schrijf een verhaal met:
- Hoofdpersoon: ${hero}
- Locatie: ${place}
- Voorwerp: ${item}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    // Get response text
    let text = message.content[0].text;

    // Strip markdown code blocks if present
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    text = text.trim();

    const story = JSON.parse(text);

    console.log('✅ Story generated with Claude:', story.title);
    res.json(story);
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het maken van het verhaal' });
  }
});

// Claude API - Comprehension Quiz Generation
app.post('/api/generate-quiz', async (req, res) => {
  const { story, storyTitle, gradeLevel = 3 } = req.body;

  if (!story) {
    return res.status(400).json({ error: 'Verhaal is verplicht' });
  }

  // Join story array if needed
  const storyText = Array.isArray(story) ? story.join(' ') : story;

  const systemPrompt = `Je bent een Nederlandse onderwijsexpert voor kinderen in groep ${gradeLevel}.

Maak 3-4 begripvragen over het verhaal:
- 2 letterlijke vragen (antwoord staat direct in de tekst)
- 1 inferentiële vraag (kind moet nadenken/afleiden)
- Elke vraag heeft 4 antwoordopties (1 correct, 3 plausibel maar fout)

BELANGRIJK:
- Gebruik eenvoudige taal voor groep ${gradeLevel}
- Maak de foute opties geloofwaardig maar duidelijk fout
- Geef een korte uitleg waarom het antwoord correct is

Antwoord met ALLEEN ruwe JSON. GEEN markdown, GEEN codeblokken.
Begin direct met { en eindig met }

Format:
{"questions":[{"question":"Vraag hier?","type":"literal","options":["A","B","C","D"],"correct_index":0,"explanation":"Korte uitleg"}]}`;

  const userPrompt = `Maak begripvragen voor dit verhaal${storyTitle ? ` (${storyTitle})` : ''}:

"${storyText}"`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    let text = message.content[0].text;
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    text = text.trim();

    const quiz = JSON.parse(text);

    console.log('✅ Quiz generated with Claude:', quiz.questions?.length, 'questions');
    res.json(quiz);
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het maken van de quiz' });
  }
});

// Generate syllable words for Code Kraken
app.post('/api/generate-syllable-words', async (req, res) => {
  const { syllableCount = 2, theme = 'ruimte', gradeLevel = 3, quantity = 5 } = req.body;

  const gradeConfig = {
    3: { complexity: 'simpel', avi: 'M3' },
    4: { complexity: 'gemiddeld', avi: 'E4' },
    5: { complexity: 'uitdagend', avi: 'M5' }
  };
  const config = gradeConfig[gradeLevel] || gradeConfig[3];

  const prompt = `
    Je bent een Nederlandse taalexpert voor kinderen in groep ${gradeLevel} (AVI ${config.avi}).
    Genereer ${quantity} woorden met PRECIES ${syllableCount} lettergrepen over het thema "${theme}".

    Regels:
    - Alleen bekende woorden voor kinderen groep ${gradeLevel}
    - Het woord moet ${syllableCount} lettergrepen hebben
    - Geef de lettergrepen gescheiden door streepjes
    - Geef de uitspraak per lettergreep (bijv. "pla" wordt "plaa" als het lang klinkt, "pen" wordt "pun" bij de doffe e)
    - Kies een passende emoji die het woord voorstelt
    - Geen woorden die al bestaan in de basisset: planeet, raket, sterren, tijger, panda, zebra, auto, hamer

    Geef antwoord DIRECT als JSON (geen markdown):
    {
      "words": [
        {
          "word": "ko-nijn",
          "parts": [{"t": "ko", "s": "koo"}, {"t": "nijn", "s": "nijn"}],
          "image": "🐰"
        }
      ]
    }
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return res.status(500).json({ error: 'Woorden genereren mislukt' });
    }

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);

    res.json(result);
  } catch (error) {
    console.error('Error generating syllable words:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het maken van woorden' });
  }
});

// Claude API - OCR Scan for Book Scanner
app.post('/api/ocr-scan', async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'Geen afbeelding ontvangen' });
  }

  const systemPrompt = `Je bent een OCR-expert voor Nederlandse schoolboeken.

Analyseer de afbeelding en extraheer Nederlandse woorden geschikt voor kinderen groep 3-5.

INSTRUCTIES:
1. Herken alle Nederlandse woorden in de afbeelding
2. Splits elk woord in lettergrepen
3. Identificeer de beklemtoonde lettergreep (0-indexed)
4. Negeer: getallen, symbolen, woorden < 3 letters, buitenlandse woorden
5. Maximum 20 woorden

LETTERGREEP-REGELS:
- Twee medeklinkers tussen klinkers: splits na eerste (pen-nen, kat-ten)
- Eén medeklinker tussen klinkers: naar volgende lettergreep (lo-pen, ma-ken)
- Samenstellingen: splits op woordgrens (voet-bal)

Antwoord met ALLEEN ruwe JSON. GEEN markdown.

Format:
{"words":[{"word":"voetbal","syllables":["voet","bal"],"stress_index":0}],"totalTextFound":true}

Als geen tekst herkend: {"words":[],"totalTextFound":false}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image
              }
            },
            {
              type: 'text',
              text: 'Analyseer deze boekpagina en extraheer de Nederlandse woorden met lettergrepen.'
            }
          ]
        }
      ]
    });

    let text = message.content[0].text;
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    text = text.trim();

    const result = JSON.parse(text);

    // Valideer en filter resultaten
    const validWords = (result.words || []).filter(w =>
      w.word &&
      w.syllables &&
      w.syllables.length > 0 &&
      w.syllables.join('') === w.word.replace(/-/g, '')
    );

    console.log('✅ OCR scan with Claude:', validWords.length, 'words found');
    res.json({
      words: validWords,
      totalTextFound: result.totalTextFound ?? validWords.length > 0
    });
  } catch (error) {
    console.error('Error in OCR scan:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het scannen' });
  }
});

// Claude API - Reading Expression Analysis
app.post('/api/analyze-expression', async (req, res) => {
  const { storyText, readingDescription, gradeLevel = 3 } = req.body;

  if (!storyText || !readingDescription) {
    return res.status(400).json({ error: 'Verhaal en leesbeschrijving zijn verplicht' });
  }

  const systemPrompt = `Je bent een vriendelijke leescoach voor kinderen in groep ${gradeLevel}.

Beoordeel de voorleesprestatie op basis van de beschrijving.

BEOORDELINGSCRITERIA:
1. Tempo (te snel, goed, te langzaam)
2. Expressie (monotoon, enigszins expressief, zeer expressief)
3. Pauzes (geen, correct bij leestekens, overdreven)
4. Vloeiendheid (hakkelend, redelijk, vloeiend)

SCORES: 1 (moet oefenen) tot 5 (uitstekend)

BELANGRIJK:
- Geef altijd positieve, bemoedigende feedback
- Geef 1 concrete tip om te verbeteren
- Gebruik eenvoudige taal voor kinderen

Antwoord met ALLEEN ruwe JSON. GEEN markdown.

Format:
{"tempo_score":3,"expression_score":4,"pause_score":3,"fluency_score":4,"overall_score":3.5,"feedback_nl":"Positieve feedback in 1-2 zinnen","tip_nl":"1 concrete tip","encouragement":"Korte aanmoediging"}`;

  const userPrompt = `Het kind las dit verhaal:
"${storyText}"

Beschrijving van hoe het kind las:
${readingDescription}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    let text = message.content[0].text;
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    text = text.trim();

    const analysis = JSON.parse(text);

    console.log('✅ Expression analysis with Claude, overall:', analysis.overall_score);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing expression:', error);
    res.status(500).json({ error: 'Er ging iets mis bij de analyse' });
  }
});

// Claude API - Word Explanation for Woord Ontdekker
app.post('/api/explain-word', async (req, res) => {
  const { word, gradeLevel = 3 } = req.body;

  if (!word) {
    return res.status(400).json({ error: 'Woord is verplicht' });
  }

  const systemPrompt = `Je bent een vriendelijke Nederlandse woordenboek voor kinderen in groep ${gradeLevel}.

Leg dit woord uit op een eenvoudige, leuke manier:

REGELS:
1. Gebruik maximaal 2 korte zinnen
2. Gebruik alleen woorden die een kind in groep ${gradeLevel} kent
3. Geef een voorbeeld zin met het woord
4. Wees positief en bemoedigend

Antwoord met ALLEEN ruwe JSON. GEEN markdown.

Format:
{"simple":"Korte, kindvriendelijke uitleg (max 2 zinnen)","example":"Een voorbeeldzin met het woord."}`;

  const userPrompt = `Leg het woord "${word}" uit voor een kind in groep ${gradeLevel}.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 256,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    let text = message.content[0].text;
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    text = text.trim();

    const explanation = JSON.parse(text);

    console.log('✅ Word explanation for:', word);
    res.json(explanation);
  } catch (error) {
    console.error('Error explaining word:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het uitleggen' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Galactische Vrienden Backend draait op port ${PORT}`);
});
