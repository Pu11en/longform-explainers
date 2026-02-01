// WaveSpeed AI APIs
// InfiniTalk: https://wavespeed.ai/models/wavespeed-ai/infinitetalk
// Nano Banana Pro: https://wavespeed.ai/models/google/nano-banana-pro
// Kling v2.6 Pro: https://wavespeed.ai/models/kwaivgi/kling-v2.6-pro

const WAVESPEED_BASE = 'https://api.wavespeed.ai/api/v3';

// API Endpoints
const INFINITETALK_API = `${WAVESPEED_BASE}/wavespeed-ai/infinitetalk`;
const NANO_BANANA_API = `${WAVESPEED_BASE}/google/nano-banana-pro`;
const KLING_API = `${WAVESPEED_BASE}/kwaivgi/kling-v2.6-pro/image-to-video`;
const UPLOAD_API = `${WAVESPEED_BASE}/media/upload/binary`;

interface WaveSpeedResponse {
  id?: string;
  status?: string;
  output?: string | string[];
  error?: string;
}

// Upload media (image/audio) to WaveSpeed
export async function uploadMedia(
  buffer: ArrayBuffer,
  contentType: string
): Promise<string> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not configured');

  const response = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': contentType,
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`WaveSpeed upload error: ${response.status}`);
  }

  const data = await response.json();
  return data.url || data.id;
}

// Generate talking head video with InfiniTalk
export async function generateTalkingHead(
  imageUrl: string,
  audioUrl: string
): Promise<string> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not configured');

  // Start the job
  const response = await fetch(INFINITETALK_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      audio_url: audioUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`InfiniTalk error: ${response.status} - ${error}`);
  }

  const data: WaveSpeedResponse = await response.json();
  
  if (data.error) {
    throw new Error(`InfiniTalk error: ${data.error}`);
  }

  // If async, poll for result
  if (data.id && data.status === 'processing') {
    return await pollForResult(data.id);
  }

  // Immediate result
  if (data.output) {
    return Array.isArray(data.output) ? data.output[0] : data.output;
  }

  throw new Error('No output from InfiniTalk');
}

// Generate image with Nano Banana Pro
export async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not configured');

  const response = await fetch(NANO_BANANA_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      num_images: 1,
      width: 1280,
      height: 720,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Nano Banana error: ${response.status} - ${error}`);
  }

  const data: WaveSpeedResponse = await response.json();

  if (data.id && data.status === 'processing') {
    return await pollForResult(data.id);
  }

  if (data.output) {
    return Array.isArray(data.output) ? data.output[0] : data.output;
  }

  throw new Error('No output from Nano Banana');
}

// Generate B-roll video with Kling
export async function generateBrollVideo(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not configured');

  const response = await fetch(KLING_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt,
      duration: 5, // 5 second clips
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kling error: ${response.status} - ${error}`);
  }

  const data: WaveSpeedResponse = await response.json();

  if (data.id && data.status === 'processing') {
    return await pollForResult(data.id);
  }

  if (data.output) {
    return Array.isArray(data.output) ? data.output[0] : data.output;
  }

  throw new Error('No output from Kling');
}

// Poll for async job result
async function pollForResult(jobId: string, maxAttempts = 60): Promise<string> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error('WAVESPEED_API_KEY not configured');

  const statusUrl = `${WAVESPEED_BASE}/status/${jobId}`;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const response = await fetch(statusUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!response.ok) continue;

    const data: WaveSpeedResponse = await response.json();

    if (data.status === 'completed' && data.output) {
      return Array.isArray(data.output) ? data.output[0] : data.output;
    }

    if (data.status === 'failed' || data.error) {
      throw new Error(`Job failed: ${data.error || 'Unknown error'}`);
    }
  }

  throw new Error('Job timed out');
}
