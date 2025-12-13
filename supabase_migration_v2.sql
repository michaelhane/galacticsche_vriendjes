-- ============================================
-- GALACTISCHE VRIENDEN - DATABASE MIGRATIE V2
-- ============================================
-- Voer dit uit in Supabase SQL Editor NA de basis schema
-- Dashboard → SQL Editor → New Query → Plak dit → Run
--
-- NIEUW IN V2:
-- - word_attempts (Spaced Repetition tracking)
-- - week_words (Ouder weekwoorden input)
-- - Uitbreiding profiles tabel (personalisatie)

-- ============================================
-- 1. UITBREIDING PROFILES TABEL
-- ============================================
-- Nieuwe kolommen voor personalisatie

-- Avatar configuratie (foto of preset)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_config JSONB DEFAULT '{"type": "preset", "preset": "astronaut"}';

-- Favoriete kleur (UI thema accent)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS favorite_color TEXT DEFAULT 'purple';

-- Huisdier info (voor personalisatie in verhalen)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pet_info JSONB DEFAULT NULL;
-- Voorbeeld: {"name": "Max", "type": "hond", "emoji": "🐕"}

-- Held/Idool (voor personalisatie in verhalen)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS idol TEXT DEFAULT NULL;
-- Voorbeeld: "Spiderman"

-- AVI niveau (huidig leesniveau)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avi_level TEXT DEFAULT 'E3';

-- Doel AVI niveau
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS target_avi_level TEXT DEFAULT 'M4';

-- Parent ID (koppeling aan ouder account, voor later)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- ============================================
-- 2. WORD_ATTEMPTS TABEL (Spaced Repetition)
-- ============================================
-- Houdt bij welke woorden een kind moeilijk vindt

CREATE TABLE IF NOT EXISTS public.word_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  game_type TEXT NOT NULL,  -- 'code_kraken', 'troll', 'jumper'
  time_taken_ms INTEGER DEFAULT NULL,  -- Optioneel: reactietijd
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes voor snelle queries
CREATE INDEX IF NOT EXISTS idx_word_attempts_user
  ON public.word_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_word_attempts_user_word
  ON public.word_attempts(user_id, word);

CREATE INDEX IF NOT EXISTS idx_word_attempts_timestamp
  ON public.word_attempts(user_id, timestamp DESC);

-- RLS Policies
ALTER TABLE public.word_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own word attempts"
  ON public.word_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own word attempts"
  ON public.word_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. WEEK_WORDS TABEL (Ouder Weekwoorden)
-- ============================================
-- Woorden die ouders/school hebben toegevoegd voor deze week

CREATE TABLE IF NOT EXISTS public.week_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  syllables TEXT[] NOT NULL,  -- ['lo', 'pen']
  stress_index INTEGER DEFAULT 0,  -- Welke lettergreep heeft klemtoon
  added_by TEXT DEFAULT 'parent',  -- 'parent', 'scan', 'teacher'
  active_until DATE NOT NULL,  -- Tot wanneer actief
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word)  -- Geen dubbele woorden per kind
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_week_words_user
  ON public.week_words(user_id);

CREATE INDEX IF NOT EXISTS idx_week_words_active
  ON public.week_words(user_id, active_until);

-- RLS Policies
ALTER TABLE public.week_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own week words"
  ON public.week_words FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own week words"
  ON public.week_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own week words"
  ON public.week_words FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own week words"
  ON public.week_words FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. HELPER VIEWS (Optioneel maar handig)
-- ============================================

-- View: Moeilijke woorden per gebruiker
CREATE OR REPLACE VIEW public.difficult_words AS
SELECT
  user_id,
  word,
  COUNT(*) as attempts,
  SUM(CASE WHEN correct THEN 1 ELSE 0 END) as correct_count,
  ROUND(SUM(CASE WHEN correct THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric, 2) as success_rate
FROM public.word_attempts
GROUP BY user_id, word
HAVING COUNT(*) >= 2
  AND SUM(CASE WHEN correct THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric < 0.5
ORDER BY success_rate ASC;

-- View: Actieve weekwoorden
CREATE OR REPLACE VIEW public.active_week_words AS
SELECT *
FROM public.week_words
WHERE active_until >= CURRENT_DATE;

-- ============================================
-- 5. UPDATE TRIGGER VOOR PROFILES
-- ============================================
-- Automatisch updated_at bijwerken

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- DONE! ✅
-- ============================================
-- Database is nu klaar voor:
-- - Spaced Repetition (word_attempts)
-- - Ouder Weekwoorden (week_words)
-- - Personalisatie (uitgebreide profiles)
--
-- Volgende stap: Test met je applicatie!
