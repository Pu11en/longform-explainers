# 🎬 Longform AI Explainers

Generate professional explainer videos from any topic using AI-powered scripts, voice narration, and talking-head videos.

**Live App**: https://longform-explainers.vercel.app

Based on the R52 course lesson workflow.

## Features

- 📝 Submit any topic to generate a multi-scene video script
- ✍️ AI-powered script generation with scene structure (OpenRouter/Gemini)
- 🎙️ Text-to-speech voice narration per scene (Fish Audio)
- 🎬 Talking-head video generation (WaveSpeed InfiniTalk)
- 🎞️ B-roll image and video generation (Nano Banana + Kling)
- 📊 Real-time progress tracking

## Pipeline Flow

```
Topic Input
    ↓
1. Script Generation (OpenRouter/Gemini)
   → Creates 5 scenes with scripts, voice prompts, B-roll prompts
    ↓
2. Voice Generation (Fish Audio TTS)
   → Creates audio for each scene
    ↓
3. Video Generation (WaveSpeed InfiniTalk)
   → Creates talking-head video for each scene
    ↓
4. B-Roll Generation (Nano Banana + Kling)
   → Creates images and videos for B-roll
    ↓
Complete Explainer Video Assets
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **AI APIs**:
  - [OpenRouter](https://openrouter.ai) - Script generation (Gemini)
  - [Fish Audio](https://fish.audio) - Text-to-speech
  - [WaveSpeed AI](https://wavespeed.ai) - Video generation

## Setup

### 1. Create Supabase Tables

Run this SQL in your [Supabase SQL Editor](https://supabase.com/dashboard/project/swvljsixpvvcirjmflze/sql/new):

```sql
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  input_request TEXT NOT NULL,
  input_voice_id TEXT,
  input_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'create',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  scene_name TEXT,
  script TEXT,
  speech_prompt TEXT,
  estimate_mins DECIMAL(4,2),
  status_voice TEXT DEFAULT 'pending',
  status_video TEXT DEFAULT 'pending',
  status_broll TEXT DEFAULT 'pending',
  scene_voice_url TEXT,
  scene_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table (B-Roll)
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  segment_name TEXT,
  image_prompt TEXT,
  video_prompt TEXT,
  status_image TEXT DEFAULT 'pending',
  status_video TEXT DEFAULT 'pending',
  segment_image_url TEXT,
  segment_video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_scene_id ON segments(scene_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (customize for production)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on scenes" ON scenes FOR ALL USING (true);
CREATE POLICY "Allow all on segments" ON segments FOR ALL USING (true);
```

### 2. Environment Variables

Set these in Vercel (or `.env.local` for local dev):

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional - API integrations
OPENROUTER_API_KEY=your_openrouter_key    # For AI script generation
FISH_AUDIO_API_KEY=your_fish_audio_key    # For TTS
WAVESPEED_API_KEY=your_wavespeed_key      # For video generation
```

### 3. Run Locally

```bash
npm install
npm run dev
```

## API Integrations

### Fish Audio TTS
- Endpoint: `POST https://api.fish.audio/v1/tts`
- Get voice IDs: https://fish.audio/app/

### WaveSpeed AI
- InfiniTalk: `POST https://api.wavespeed.ai/api/v3/wavespeed-ai/infinitetalk`
- Nano Banana: `POST https://api.wavespeed.ai/api/v3/google/nano-banana-pro`
- Kling: `POST https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.6-pro/image-to-video`

### OpenRouter
- Endpoint: `POST https://openrouter.ai/api/v1/chat/completions`
- Model: `google/gemini-2.0-flash-001`

## Data Model

### Projects
- `project_name` - Display name
- `input_request` - User's topic/request
- `input_voice_id` - Fish Audio voice reference
- `input_image_url` - Talking head avatar image
- `status` - create → scripting → voice → video → broll → done

### Scenes
- `scene_name` - e.g., "1 - Hook and Setup"
- `script` - Generated text for scene
- `speech_prompt` - Voice direction
- `scene_voice_url` - Generated audio
- `scene_video_url` - Generated video

### Segments (B-Roll)
- `image_prompt` - Prompt for image generation
- `video_prompt` - Prompt for video from image
- `segment_image_url` - Generated B-roll image
- `segment_video_url` - Generated B-roll video

## License

MIT
