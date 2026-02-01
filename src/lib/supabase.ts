import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create client only at runtime, not during build
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables not configured');
    }
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

// For backward compatibility
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey) 
  : null as unknown as SupabaseClient;

// Types
export type ProjectStatus = 'created' | 'scripting' | 'voice' | 'video' | 'broll' | 'done' | 'error';
export type SegmentStatus = 'pending' | 'voice_processing' | 'voice_done' | 'video_processing' | 'video_done' | 'error';

export interface Project {
  id: string;
  topic: string;
  status: ProjectStatus;
  script_full: string | null;
  broll_prompts: string[] | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Segment {
  id: string;
  project_id: string;
  segment_number: number;
  script_text: string | null;
  voice_url: string | null;
  video_url: string | null;
  status: SegmentStatus;
  created_at: string;
  updated_at: string;
}
