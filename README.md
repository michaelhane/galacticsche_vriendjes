# 🚀 Galactische Vrienden

Een interactieve leesapp voor kinderen in groep 3-5, met focus op lettergrepen, klemtoon en woordstructuur.

## 🎮 Features

- **Code Kraken**: Lettergreep puzzels (13 levels)
- **Lettergreep Springer**: Spring door verhalen 🐸
- **De Brutelaars**: Klemtoon oefenen met exploderende trollen 👾
- **Verhalen Fabriek**: AI-gegenereerde verhalen (Gemini)
- **Bio-Koepel**: Winkel met 19 items (0-500 sterren)

## 🏗️ Architectuur

```
Frontend (React/Vite) ←→ Supabase (Auth + Database)
         ↓
Backend (Express) ←→ Gemini API
```

## 📦 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd galactische-vrienden

# Backend
cd backend
npm install
cp .env.example .env
# Vul GEMINI_API_KEY in

# Frontend  
cd ../frontend
npm install
cp .env.example .env
# Vul Supabase credentials in
```

### 2. Supabase Setup

1. Maak project op [supabase.com](https://supabase.com)
2. Ga naar SQL Editor
3. Voer `supabase_schema.sql` uit
4. Kopieer URL + anon key naar frontend `.env`

### 3. Gemini API Setup

1. Ga naar [Google AI Studio](https://aistudio.google.com/)
2. Maak API key aan
3. Voeg toe aan backend `.env`
4. **Belangrijk**: Lock domein op `*.onrender.com` in Google Cloud Console

### 4. Run Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

Open http://localhost:5173

## 🚀 Deploy naar Render

### Optie A: Via Blueprint (aanbevolen)

1. Push code naar GitHub
2. Ga naar [Render Dashboard](https://dashboard.render.com)
3. New → Blueprint
4. Selecteer je repo
5. Render leest `render.yaml` automatisch
6. Vul environment variables in

### Optie B: Handmatig

**Backend:**
- New Web Service
- Root Directory: `backend`
- Build: `npm install`
- Start: `npm start`
- Add env: `GEMINI_API_KEY`

**Frontend:**
- New Static Site
- Root Directory: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`
- Add env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

## 📊 Database Schema

```
profiles
├── id (UUID, PK)
├── display_name
├── age
├── grade
├── stars
└── timestamps

user_items
├── user_id (FK)
└── item_id

completed_levels
├── user_id (FK)
├── game_type
├── level_id
└── stars_earned

user_settings
├── user_id (FK)
├── theme
├── font_type
├── text_size
└── letter_spacing
```

## 🔐 Beveiliging

- ✅ Gemini API key alleen op backend
- ✅ Supabase RLS policies
- ✅ Magic Link auth (geen wachtwoorden)
- ✅ CORS geconfigureerd

## 📝 Nieuwe Levels Toevoegen

Levels worden automatisch "locked" voor bestaande gebruikers:

```javascript
// frontend/src/data/codeKrakenLevels.js
export const codeKrakenLevels = [
  // ... bestaande levels
  {
    id: 13,  // Nieuwe ID
    title: "Level 14: Nieuwe Level",
    desc: "Beschrijving",
    words: [...]
  }
]
```

Het systeem slaat **voltooide** levels op (niet unlocked), dus:
- Level 14 is automatisch locked
- Zodra iemand level 13 voltooit → level 14 unlocked

## 🤝 Contributing

1. Fork de repo
2. Maak feature branch
3. Commit changes
4. Push en open PR

## 📄 License

MIT
