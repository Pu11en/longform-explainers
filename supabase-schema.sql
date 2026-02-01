-- Longform Explainers Database Schema

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

-- Status enum reference:
-- projects.status: created, scripting, voice, video, broll, done, error
-- segments.status: pending, voice_processing, voice_done, video_processing, video_done, error

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE segments;
