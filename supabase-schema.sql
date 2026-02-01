-- Longform AI Explainers Database Schema
-- Matches the n8n workflow Airtable structure

-- Projects table (main video requests)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  input_request TEXT NOT NULL,           -- User's topic/request
  input_voice_id TEXT,                   -- Fish Audio voice reference ID
  input_image_url TEXT,                  -- Talking head image URL
  status TEXT NOT NULL DEFAULT 'create', -- create, scripting, processing, done, error
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenes table (video segments with script/voice/video)
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  scene_name TEXT,                       -- e.g., "1 - Hook and Setup"
  script TEXT,                           -- Generated script text
  speech_prompt TEXT,                    -- Voice direction/emotion
  estimate_mins DECIMAL(4,2),            -- Estimated duration
  status_voice TEXT DEFAULT 'pending',   -- pending, processing, done, error
  status_video TEXT DEFAULT 'pending',   -- pending, processing, done, error
  status_broll TEXT DEFAULT 'pending',   -- pending, processing, done, error
  scene_voice_url TEXT,                  -- Fish Audio output URL
  scene_video_url TEXT,                  -- WaveSpeed InfiniTalk output URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Segments table (B-Roll images/videos within scenes)
CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  segment_number INTEGER NOT NULL,
  segment_name TEXT,
  image_prompt TEXT,                     -- Prompt for Nano Banana image
  video_prompt TEXT,                     -- Prompt for Kling video
  status_image TEXT DEFAULT 'pending',   -- pending, processing, done, error
  status_video TEXT DEFAULT 'pending',   -- pending, processing, done, error
  segment_image_url TEXT,                -- Generated image URL
  segment_video_url TEXT,                -- Generated B-roll video URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_project_id ON segments(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_scene_id ON segments(scene_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can restrict later)
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on scenes" ON scenes FOR ALL USING (true);
CREATE POLICY "Allow all on segments" ON segments FOR ALL USING (true);
