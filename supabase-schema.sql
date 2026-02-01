-- Longform AI Explainers Database Schema
-- Uses SEALCaM framework for B-roll prompts
-- Table prefix: longform_

-- Projects table (main video requests)
CREATE TABLE IF NOT EXISTS longform_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  input_request TEXT NOT NULL,           -- User's topic/request
  input_voice_id TEXT,                   -- Fish Audio voice reference ID
  input_image_url TEXT,                  -- Talking head image URL
  input_tone_of_voice TEXT,              -- Optional tone of voice for script
  input_speech_prompt TEXT,              -- Optional speech/delivery prompt
  input_target_minutes INTEGER DEFAULT 2, -- Target video length in minutes
  speech_prompt TEXT,                    -- Generated global speech prompt from AI
  total_minutes DECIMAL(4,2),            -- Total estimated duration
  status TEXT NOT NULL DEFAULT 'create', -- create, scripting, voice, video, broll, done, error
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes table (video segments with script/voice/video)
CREATE TABLE IF NOT EXISTS longform_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES longform_projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  scene_name TEXT,                       -- e.g., "1 - Hook and Setup"
  script TEXT,                           -- Generated script text
  speech_prompt TEXT,                    -- Voice direction/emotion (from AGNT prompt)
  estimate_mins DECIMAL(4,2),            -- Estimated duration
  word_count INTEGER,                    -- Word count for timing calculations
  status_voice TEXT DEFAULT 'pending',   -- pending, processing, done, error
  status_video TEXT DEFAULT 'pending',   -- pending, processing, done, error
  status_broll TEXT DEFAULT 'pending',   -- pending, processing, done, error
  scene_voice_url TEXT,                  -- Fish Audio output URL
  scene_voice_task_id TEXT,              -- Fish Audio task ID for polling
  scene_video_url TEXT,                  -- WaveSpeed InfiniTalk output URL
  scene_video_task_id TEXT,              -- WaveSpeed task ID for polling
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table (B-Roll images/videos using SEALCaM prompts)
CREATE TABLE IF NOT EXISTS longform_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES longform_projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES longform_scenes(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  segment_name TEXT,
  -- SEALCaM formatted prompts (Subject, Environment, Action, Lighting, Camera, Metatokens)
  start_image_prompt TEXT,               -- SEALCaM prompt for starting image (Nano Banana)
  video_prompt TEXT,                     -- SEALCaM prompt for video motion (Kling)
  status_image TEXT DEFAULT 'pending',   -- pending, processing, done, error
  status_video TEXT DEFAULT 'pending',   -- pending, processing, done, error
  segment_image_url TEXT,                -- Generated image URL
  segment_video_url TEXT,                -- Generated B-roll video URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_longform_scenes_project ON longform_scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_longform_segments_project ON longform_segments(project_id);
CREATE INDEX IF NOT EXISTS idx_longform_segments_scene ON longform_segments(scene_id);

-- Enable Row Level Security
ALTER TABLE longform_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE longform_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE longform_segments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (customize for production)
DROP POLICY IF EXISTS "Allow all on longform_projects" ON longform_projects;
DROP POLICY IF EXISTS "Allow all on longform_scenes" ON longform_scenes;
DROP POLICY IF EXISTS "Allow all on longform_segments" ON longform_segments;

CREATE POLICY "Allow all on longform_projects" ON longform_projects FOR ALL USING (true);
CREATE POLICY "Allow all on longform_scenes" ON longform_scenes FOR ALL USING (true);
CREATE POLICY "Allow all on longform_segments" ON longform_segments FOR ALL USING (true);
