import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

// Types matching the n8n workflow structure
export type ProjectStatus = 'create' | 'scripting' | 'voice' | 'video' | 'broll' | 'done' | 'error';
export type AssetStatus = 'pending' | 'processing' | 'done' | 'error';

export interface Project {
  id: string;
  project_name: string;
  input_request: string;
  input_voice_id: string | null;
  input_image_url: string | null;
  status: ProjectStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  scene_name: string | null;
  script: string | null;
  speech_prompt: string | null;
  estimate_mins: number | null;
  status_voice: AssetStatus;
  status_video: AssetStatus;
  status_broll: AssetStatus;
  scene_voice_url: string | null;
  scene_video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Segment {
  id: string;
  project_id: string;
  scene_id: string;
  segment_number: number;
  segment_name: string | null;
  image_prompt: string | null;
  video_prompt: string | null;
  status_image: AssetStatus;
  status_video: AssetStatus;
  segment_image_url: string | null;
  segment_video_url: string | null;
  created_at: string;
  updated_at: string;
}

// Script structure from LLM
export interface GeneratedScript {
  scenes: {
    scene_name: string;
    script: string;
    speech_prompt: string;
    estimate_mins: number;
    broll_prompts: {
      image_prompt: string;
      video_prompt: string;
    }[];
  }[];
}
