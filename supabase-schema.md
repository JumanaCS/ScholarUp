# Supabase Database Schema

This file tracks all SQL migrations that have been run on the Supabase database.

---

## Initial Schema (Completed)

```sql
-- Flashcard Sets
CREATE TABLE flashcard_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📚',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  set_id UUID REFERENCES flashcard_sets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Lists
CREATE TABLE task_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📝',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES task_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Timer Sessions
CREATE TABLE timer_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Stats
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_study_time INTEGER DEFAULT 0,
  tasks_created INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  cards_created INTEGER DEFAULT 0,
  cards_studied INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can manage their own flashcard_sets" ON flashcard_sets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own flashcards" ON flashcards
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own task_lists" ON task_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own timer_sessions" ON timer_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own user_stats" ON user_stats
  FOR ALL USING (auth.uid() = user_id);
```

---

## Storage Policies (Completed)

```sql
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'user-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Gallery Images Table (Completed)

```sql
CREATE TABLE gallery_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gallery" ON gallery_images
  FOR ALL USING (auth.uid() = user_id);
```

---

## Flashcard Image Support (Completed)

```sql
ALTER TABLE flashcards ADD COLUMN image_url TEXT;
```

---

## Timer Stats Columns (Completed)

```sql
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS total_break_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS focus_sessions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS break_sessions INTEGER DEFAULT 0;
```

---

## Flashcard Learned Field (Completed)

```sql
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS learned BOOLEAN DEFAULT FALSE;
```

---

## Quiz Perfect Scores Column (Completed)

```sql
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS quizzes_passed INTEGER DEFAULT 0;
```

---

## Timer Default Settings (Completed)

```sql
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS default_focus_time INTEGER DEFAULT 1500,
ADD COLUMN IF NOT EXISTS default_break_time INTEGER DEFAULT 300;
```

---

## RLS Policy Performance Optimization (Completed)

Optimized RLS policies by wrapping `auth.uid()` in a subquery to evaluate once per query instead of once per row.

```sql
-- Drop and recreate policies for flashcard_sets
DROP POLICY IF EXISTS "Users can manage their own flashcard_sets" ON public.flashcard_sets;
CREATE POLICY "Users can manage their own flashcard_sets" ON public.flashcard_sets
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for flashcards
DROP POLICY IF EXISTS "Users can manage their own flashcards" ON public.flashcards;
CREATE POLICY "Users can manage their own flashcards" ON public.flashcards
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for task_lists
DROP POLICY IF EXISTS "Users can manage their own task_lists" ON public.task_lists;
CREATE POLICY "Users can manage their own task_lists" ON public.task_lists
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for tasks
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
CREATE POLICY "Users can manage their own tasks" ON public.tasks
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for timer_sessions
DROP POLICY IF EXISTS "Users can manage their own timer_sessions" ON public.timer_sessions;
CREATE POLICY "Users can manage their own timer_sessions" ON public.timer_sessions
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for user_stats
DROP POLICY IF EXISTS "Users can manage their own user_stats" ON public.user_stats;
CREATE POLICY "Users can manage their own user_stats" ON public.user_stats
  FOR ALL USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for gallery_images
DROP POLICY IF EXISTS "Users can manage their own gallery" ON public.gallery_images;
CREATE POLICY "Users can manage their own gallery" ON public.gallery_images
  FOR ALL USING (user_id = (SELECT auth.uid()));
```
