# 🎬 Longform AI Explainers

Generate professional explainer videos from any topic using AI.

**Live App**: https://longform-explainers.vercel.app

## Features

- 📝 Submit any topic to generate an explainer video script
- ✍️ AI-powered script generation (OpenRouter/Gemini)
- 🎙️ Text-to-speech voice narration (Fish Audio)
- 🎬 Talking-head video generation (WaveSpeed AI)
- 🎞️ B-roll image prompts for visual enhancement
- 📊 Real-time progress tracking

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **AI APIs**: OpenRouter, Fish Audio, WaveSpeed AI

## Setup

### 1. Create Supabase Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Projects table (main video requests)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  script_full TEXT,
  broll_prompts JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table (individual video segments)
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  script_text TEXT,
  voice_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);
```

### 2. Environment Variables

Set these in your Vercel project (or `.env.local` for local dev):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key (optional, uses mock data without)
FISH_AUDIO_API_KEY=your_fish_audio_key (optional)
WAVESPEED_API_KEY=your_wavespeed_key (optional)
```

### 3. Run Locally

```bash
npm install
npm run dev
```

## Pipeline Status Flow

1. **Created** - Project submitted
2. **Scripting** - AI generating script
3. **Voice** - TTS creating narration
4. **Video** - Generating talking-head segments
5. **B-Roll** - Creating B-roll prompts
6. **Done** - All segments complete

## License

MIT
