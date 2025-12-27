-- ============================================
-- GALACTISCHE VRIENDEN - SUPABASE DATABASE SCHEMA
-- ============================================
-- Voer dit uit in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Plak dit → Run

-- 1. PROFILES TABEL
-- Uitbreiding van Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  age INTEGER,
  grade INTEGER DEFAULT 3,
  stars INTEGER DEFAULT 20,
  interests TEXT[] DEFAULT ARRAY['dinosaurussen', 'ruimte', 'dieren'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add interests column if table exists
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT ARRAY['dinosaurussen', 'ruimte', 'dieren'];

-- 2. USER ITEMS TABEL
-- Gekochte winkel items
CREATE TABLE IF NOT EXISTS public.user_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- 3. COMPLETED LEVELS TABEL
-- Voltooide game levels (slim voor nieuwe levels!)
CREATE TABLE IF NOT EXISTS public.completed_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,  -- 'code_kraken', 'stories', 'jumper', 'troll'
  level_id INTEGER NOT NULL,
  stars_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_type, level_id)
);

-- 4. USER SETTINGS TABEL
-- Persoonlijke instellingen
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'space-light',
  font_type TEXT DEFAULT 'sans',
  text_size TEXT DEFAULT 'normal',
  letter_spacing BOOLEAN DEFAULT false
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Dit zorgt ervoor dat gebruikers alleen hun eigen data kunnen zien/wijzigen

-- Enable RLS op alle tabellen
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- USER_ITEMS policies
CREATE POLICY "Users can view own items"
  ON public.user_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON public.user_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON public.user_items FOR DELETE
  USING (auth.uid() = user_id);

-- COMPLETED_LEVELS policies
CREATE POLICY "Users can view own completed levels"
  ON public.completed_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed levels"
  ON public.completed_levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completed levels"
  ON public.completed_levels FOR UPDATE
  USING (auth.uid() = user_id);

-- USER_SETTINGS policies
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
-- Maakt automatisch een profiel aan wanneer iemand zich registreert

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, stars)
  VALUES (NEW.id, 20);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Gratis starter item
  INSERT INTO public.user_items (user_id, item_id)
  VALUES (NEW.id, 'plant-alien');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger koppelen aan auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES voor snellere queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_completed_levels_user_game 
  ON public.completed_levels(user_id, game_type);

CREATE INDEX IF NOT EXISTS idx_user_items_user 
  ON public.user_items(user_id);

-- ============================================
-- 5. WORD ATTEMPTS TABEL
-- Spaced repetition tracking voor woord pogingen
-- ============================================
CREATE TABLE IF NOT EXISTS public.word_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  game_type TEXT NOT NULL,  -- 'code_kraken', 'troll', 'jumper'
  time_taken_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS voor word_attempts
ALTER TABLE public.word_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own word attempts"
  ON public.word_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own word attempts"
  ON public.word_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index voor snelle queries
CREATE INDEX IF NOT EXISTS idx_word_attempts_user_word
  ON public.word_attempts(user_id, word);

CREATE INDEX IF NOT EXISTS idx_word_attempts_user_timestamp
  ON public.word_attempts(user_id, timestamp DESC);

-- ============================================
-- DONE! ✅
-- ============================================
-- Je database is nu klaar voor Galactische Vrienden!
