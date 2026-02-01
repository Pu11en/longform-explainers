// Fish Audio TTS API
// https://fish.audio/app/

const FISH_AUDIO_API = 'https://api.fish.audio/v1/tts';

export interface FishAudioRequest {
  text: string;
  reference_id?: string;  // Voice model ID
  format?: 'mp3' | 'wav' | 'opus';
  mp3_bitrate?: number;
  opus_bitrate?: number;
  latency?: 'normal' | 'balanced';
}

export interface FishAudioResponse {
  audio_url?: string;
  audio_base64?: string;
  duration?: number;
  error?: string;
}

export async function generateVoice(
  text: string,
  voiceId?: string
): Promise<{ url: string; duration?: number }> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('FISH_AUDIO_API_KEY not configured');
  }

  const response = await fetch(FISH_AUDIO_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      reference_id: voiceId || undefined,
      format: 'mp3',
      latency: 'normal',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio API error: ${response.status} - ${errorText}`);
  }

  // Fish Audio returns audio as binary stream
  const audioBuffer = await response.arrayBuffer();
  
  // For now, we'll need to upload this somewhere accessible
  // Options: Supabase Storage, Cloudinary, etc.
  // Return a placeholder for now
  const base64 = Buffer.from(audioBuffer).toString('base64');
  const dataUrl = `data:audio/mp3;base64,${base64}`;
  
  return {
    url: dataUrl,
    duration: undefined, // Would need to parse the audio to get duration
  };
}

// Upload audio to storage and return public URL
export async function uploadAudioToStorage(
  audioBuffer: ArrayBuffer,
  projectId: string,
  sceneNumber: number
): Promise<string> {
  // TODO: Implement Supabase Storage or Cloudinary upload
  // For now, return base64 data URL
  const base64 = Buffer.from(audioBuffer).toString('base64');
  return `data:audio/mp3;base64,${base64}`;
}
