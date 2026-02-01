import { supabase } from './supabase';

let initialized = false;

export async function ensureTablesExist() {
  if (initialized) return;
  
  try {
    // Try to query projects table - if it fails, tables don't exist
    const { error } = await supabase.from('projects').select('id').limit(1);
    
    if (error && error.code === 'PGRST205') {
      console.log('Tables do not exist. Please create them in Supabase dashboard.');
      console.log('SQL Schema:');
      console.log(`
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  script_full TEXT,
  broll_prompts JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE segments (
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

CREATE INDEX idx_segments_project_id ON segments(project_id);
      `);
      throw new Error('Database tables not initialized. Please run the SQL schema in Supabase dashboard.');
    }
    
    initialized = true;
  } catch (error) {
    console.error('Database initialization check failed:', error);
    throw error;
  }
}
