import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

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
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini API Proxy - houdt API key veilig op server
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

  const prompt = `
    Je bent een schrijver voor kinderen in groep ${gradeLevel} (AVI ${config.avi}).
    Schrijf een heel kort, grappig verhaaltje.
    Onderwerpen: Hoofdpersoon: ${hero}, Locatie: ${place}, Voorwerp: ${item}.
    Regels: Maximaal ${config.maxSentences} zinnen. Korte zinnen (max ${config.maxWords} woorden). Geen moeilijke woorden.
    Geef antwoord DIRECT als JSON in dit formaat (geen markdown):
    {
        "title": "Een leuke titel",
        "content": ["Zin 1.", "Zin 2.", "Zin 3."],
        "fact": "Een kort, leuk weetje over ${place} of ${hero} (max 1 zin)."
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
      return res.status(500).json({ error: 'Verhaal genereren mislukt' });
    }

    const data = await response.json();
    const story = JSON.parse(data.candidates[0].content.parts[0].text);
    
    res.json(story);
  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het maken van het verhaal' });
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

// Generate stress/klemtoon words for Troll Game
app.post('/api/generate-stress-words', async (req, res) => {
  const { syllableCount = 2, gradeLevel = 3, quantity = 5 } = req.body;

  const gradeConfig = {
    3: { complexity: 'simpel', avi: 'M3' },
    4: { complexity: 'gemiddeld', avi: 'E4' },
    5: { complexity: 'uitdagend', avi: 'M5' }
  };
  const config = gradeConfig[gradeLevel] || gradeConfig[3];

  const prompt = `
    Je bent een Nederlandse taalexpert voor kinderen in groep ${gradeLevel} (AVI ${config.avi}).
    Genereer ${quantity} woorden met PRECIES ${syllableCount} lettergrepen voor een klemtoon-oefening.

    Regels:
    - Alleen bekende woorden voor kinderen groep ${gradeLevel}
    - Het woord moet ${syllableCount} lettergrepen hebben
    - Markeer de lettergreep met KLEMTOON in HOOFDLETTERS
    - Varieer de klemtoonpositie (niet allemaal op dezelfde plek)
    - stressIndex is 0 voor eerste lettergreep, 1 voor tweede, etc.
    - Geen woorden die al bestaan: lopen, tafels, rennen, spinnen, ballon, kanon, computer, telefoon

    Geef antwoord DIRECT als JSON (geen markdown):
    {
      "words": [
        {
          "word": "fiet-sen",
          "parts": ["FIET", "sen"],
          "stressIndex": 0
        },
        {
          "word": "pi-a-no",
          "parts": ["pi", "A", "no"],
          "stressIndex": 1
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
      return res.status(500).json({ error: 'Klemtoon woorden genereren mislukt' });
    }

    const data = await response.json();
    const result = JSON.parse(data.candidates[0].content.parts[0].text);

    res.json(result);
  } catch (error) {
    console.error('Error generating stress words:', error);
    res.status(500).json({ error: 'Er ging iets mis bij het maken van klemtoon woorden' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Galactische Vrienden Backend draait op port ${PORT}`);
});
