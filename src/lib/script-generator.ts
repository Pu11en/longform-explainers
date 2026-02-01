/**
 * Script Generation Service
 * 
 * Uses OpenRouter (Gemini) to generate video scripts with the official
 * AGNT system prompt for human-sounding, properly segmented scripts.
 */

import { 
  SCRIPT_GENERATOR_SYSTEM_PROMPT, 
  DEFAULT_SPEECH_PROMPT,
  SCRIPT_CONFIG,
  ScriptGeneratorOutput 
} from './prompts/script-generator';
import { 
  BROLL_GENERATOR_SYSTEM_PROMPT,
  BROLL_CONFIG,
  BrollGeneratorOutput 
} from './prompts/broll-generator';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

// Combined output for our app
export interface GeneratedScript {
  total_minutes: number;
  speech_prompt: string;
  scenes: {
    scene_name: string;
    script: string;
    speech_prompt: string;
    estimate_mins: number;
    word_count: number;
    broll_prompts: {
      start_image_prompt: string;
      video_prompt: string;
    }[];
  }[];
}

/**
 * Generate a complete video script with B-roll prompts
 */
export async function generateScript(
  topic: string,
  options?: {
    toneOfVoice?: string;
    speechPrompt?: string;
    targetMinutes?: number;
  }
): Promise<GeneratedScript> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Use mock response if no API key
  if (!apiKey) {
    return getMockScript(topic);
  }

  // Step 1: Generate the main script
  const scriptData = await generateMainScript(topic, options);
  
  // Step 2: Generate B-roll for each segment
  const scenesWithBroll = await Promise.all(
    scriptData.segments.map(async (segment) => {
      const brollData = await generateBrollForScript(segment.script);
      return {
        scene_name: segment.scene,
        script: segment.script,
        speech_prompt: scriptData.speech_prompt,
        estimate_mins: segment.duration_minutes,
        word_count: segment.word_count,
        broll_prompts: brollData.segments.map(s => ({
          start_image_prompt: s.start_image_prompt,
          video_prompt: s.video_prompt,
        })),
      };
    })
  );

  return {
    total_minutes: scriptData.total_minutes,
    speech_prompt: scriptData.speech_prompt,
    scenes: scenesWithBroll,
  };
}

/**
 * Generate the main talking-head script
 */
async function generateMainScript(
  topic: string,
  options?: {
    toneOfVoice?: string;
    speechPrompt?: string;
    targetMinutes?: number;
  }
): Promise<ScriptGeneratorOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY!;
  const targetMinutes = options?.targetMinutes || SCRIPT_CONFIG.DEFAULT_VIDEO_LENGTH_MINUTES;
  
  const userPrompt = buildScriptUserPrompt(topic, options);

  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://longform-explainers.vercel.app',
      'X-Title': 'Longform Explainers',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: SCRIPT_GENERATOR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Script generation error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in script generation response');
  }

  try {
    return JSON.parse(content) as ScriptGeneratorOutput;
  } catch {
    console.error('Failed to parse script JSON:', content);
    throw new Error('Invalid JSON from script generation');
  }
}

/**
 * Generate B-roll segments for a script using SEALCaM framework
 */
async function generateBrollForScript(script: string): Promise<BrollGeneratorOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return getMockBroll(script);
  }

  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://longform-explainers.vercel.app',
      'X-Title': 'Longform Explainers',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        { role: 'system', content: BROLL_GENERATOR_SYSTEM_PROMPT },
        { role: 'user', content: `Generate SEALCaM B-roll prompts for this script:\n\n${script}` }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`B-roll generation error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in B-roll generation response');
  }

  try {
    return JSON.parse(content) as BrollGeneratorOutput;
  } catch {
    console.error('Failed to parse B-roll JSON:', content);
    throw new Error('Invalid JSON from B-roll generation');
  }
}

/**
 * Build the user prompt for script generation
 */
function buildScriptUserPrompt(
  topic: string,
  options?: {
    toneOfVoice?: string;
    speechPrompt?: string;
    targetMinutes?: number;
  }
): string {
  const parts = [
    `Create a ${options?.targetMinutes || SCRIPT_CONFIG.DEFAULT_VIDEO_LENGTH_MINUTES} minute video script about: ${topic}`,
  ];

  if (options?.toneOfVoice) {
    parts.push(`Tone of voice: ${options.toneOfVoice}`);
  }

  if (options?.speechPrompt) {
    parts.push(`Speech/delivery prompt: ${options.speechPrompt}`);
  }

  return parts.join('\n\n');
}

/**
 * Mock script for testing without API key
 */
function getMockScript(topic: string): GeneratedScript {
  return {
    total_minutes: 2,
    speech_prompt: DEFAULT_SPEECH_PROMPT,
    scenes: [
      {
        scene_name: "1 - Hook and Setup",
        script: `You know what's fascinating about ${topic}? It's something most people completely overlook, but once you understand it, everything clicks into place. I'm going to break this down for you in a way that actually makes sense.`,
        speech_prompt: DEFAULT_SPEECH_PROMPT,
        estimate_mins: 0.5,
        word_count: 45,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Abstract visualization of ${topic} concept, glowing interconnected nodes forming a network pattern. Environment: Dark void with deep blue-purple gradient, subtle particle field creating depth. Action: Static starting frame, dormant energy state. Lighting: Soft cyan key light from above-left, purple rim highlights on node edges, high contrast ratio 4:1. Camera: RED Komodo 6K, 24mm Sigma Art prime lens, centered wide shot, locked-off tripod position. Metatokens: Photorealistic CGI, clean digital aesthetic, 4K resolution, cinematic color grade, subtle lens vignette.`,
            video_prompt: `Subject: Network nodes activating in sequence, connection lines illuminating with flowing energy pulses. Environment: Same dark void, particles beginning gentle drift toward camera. Action: Nodes pulse and glow brighter, energy ripples expand outward, slow 2-second dolly push-in. Lighting: Key light intensity increases 20%, additional fill emerges from activated nodes. Camera: RED Komodo 6K, 24mm Sigma Art, slow dolly push from wide to medium-wide, 2 seconds duration. Metatokens: Smooth 24fps motion, photorealistic CGI, subtle lens bloom on bright highlights, cinematic motion blur.`
          }
        ]
      },
      {
        scene_name: "2 - Core Explanation",
        script: `Here's the thing about ${topic} that nobody talks about. The foundation is simpler than you'd think. When you strip away all the complexity, there are really just three key principles driving everything. Let me walk you through each one.`,
        speech_prompt: DEFAULT_SPEECH_PROMPT,
        estimate_mins: 0.5,
        word_count: 50,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Clean infographic with three key icons arranged in triangular composition, modern flat design with subtle 3D depth. Environment: Pure white studio backdrop, soft drop shadows grounding elements. Action: Static frame, all elements in final position. Lighting: Large soft diffused key from front-above, minimal shadows, even 18% gray exposure. Camera: Sony FX6, 50mm Sony G Master prime, straight-on medium shot at eye level, locked tripod. Metatokens: Motion graphics aesthetic, vector-clean edges, broadcast quality finish, subtle film grain 5%.`,
            video_prompt: `Subject: Icons animate in sequence with smooth ease-out, connecting lines draw between them with energy pulse. Environment: White backdrop maintains clean consistency throughout. Action: Elements scale from 80% to 100% with bounce easing, lines draw left-to-right at 0.5s intervals. Lighting: Consistent soft lighting, no changes. Camera: Sony FX6, 50mm G Master, static locked-off shot throughout. Metatokens: 30fps smooth motion graphics, clean vector animation style, professional broadcast aesthetic, subtle ambient occlusion.`
          }
        ]
      },
      {
        scene_name: "3 - Practical Application",
        script: `Now let's make this real. Say you're starting from scratch today. Here's exactly what you'd do first. You'd focus on getting the basics right before anything else. That foundation is what separates people who struggle from those who succeed quickly.`,
        speech_prompt: DEFAULT_SPEECH_PROMPT,
        estimate_mins: 0.5,
        word_count: 50,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Hands positioned on laptop keyboard, screen displaying progress dashboard with metrics, coffee cup as secondary element. Environment: Contemporary home office, warm morning light, organized desk with plant, large window with soft city bokeh background. Action: Typing paused, hands resting naturally on keyboard. Lighting: Warm morning sunlight as key from window-right at 45 degrees, soft bounce fill from white desk surface, golden hour color temperature 3200K. Camera: Canon R5, 35mm RF prime lens f/2.0, over-the-shoulder composition, slight high angle, shallow depth of field. Metatokens: Lifestyle realism, warm inviting color palette, subtle film emulation, relatable aspirational aesthetic.`,
            video_prompt: `Subject: Hands resume purposeful typing, screen metrics animate upward, success notification slides in from top. Environment: Steam rises gently from coffee cup, plant leaves shift slightly. Action: Confident typing rhythm 3 seconds, dashboard numbers climb with easing, subtle celebration micro-gesture. Lighting: Consistent warm sunlight, screen glow increasing on face by 10%. Camera: Canon R5, 35mm RF prime, slow push-in from OTS to CU of screen over 4 seconds, subtle handheld organic movement. Metatokens: 24fps cinematic, lifestyle commercial aesthetic, motivated positive energy, warm grade with lifted shadows.`
          }
        ]
      },
      {
        scene_name: "4 - Takeaway",
        script: `That's ${topic} in a nutshell. Remember these three things and you'll be ahead of most people. If this was helpful, save it for later. And I'll see you in the next one.`,
        speech_prompt: DEFAULT_SPEECH_PROMPT,
        estimate_mins: 0.5,
        word_count: 35,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Person silhouette at mountain summit, arms at sides, overlooking vast landscape with sea of clouds below. Environment: Epic mountain vista at golden hour, layered mountain ridges receding into atmospheric haze, dramatic sky gradient. Action: Static hero moment, figure contemplating achievement. Lighting: Dramatic golden hour backlight creating strong silhouette, sun positioned just above horizon as rim light, warm atmospheric haze diffusing light. Camera: RED V-Raptor 8K, 24mm Cooke S7 anamorphic, wide establishing shot, locked-off heavy tripod. Metatokens: Epic cinematic realism, nature documentary quality, rich dynamic range, inspirational aspirational tone, 2.39:1 aspect ratio.`,
            video_prompt: `Subject: Figure slowly raises arms in achievement pose, sun crests horizon creating natural lens flare. Environment: Clouds drift slowly below, golden light intensifies and spreads across landscape. Action: Triumphant arm raise over 3 seconds, subtle wind movement in clothing and hair, sun rising creates dynamic real-time light change. Lighting: Sun breaks fully over horizon, backlight intensifies 40%, golden rays spread across frame. Camera: RED V-Raptor 8K, 24mm Cooke S7 anamorphic, slow tilt-up following arm movement, locked tripod. Metatokens: Smooth 24fps, epic scale and grandeur, anamorphic lens flare artifacts, peak cinematic inspirational moment.`
          }
        ]
      }
    ]
  };
}

/**
 * Mock B-roll for testing without API key
 */
function getMockBroll(script: string): BrollGeneratorOutput {
  const wordCount = script.split(/\s+/).length;
  const durationSeconds = Math.ceil(wordCount / BROLL_CONFIG.WORDS_PER_MINUTE_AVG * 60);
  const numSegments = Math.max(1, Math.ceil(durationSeconds / BROLL_CONFIG.SEGMENT_DURATION_SECONDS));
  
  return {
    total_segments: numSegments,
    estimated_duration_seconds: durationSeconds,
    segments: [{
      segment_number: 1,
      script_excerpt: script.slice(0, 100) + '...',
      duration_seconds: durationSeconds,
      start_image_prompt: `Subject: Abstract conceptual visualization related to the topic. Environment: Clean modern backdrop with subtle depth. Action: Static starting frame. Lighting: Soft diffused key light, balanced fill. Camera: Sony FX6, 35mm prime, medium shot, locked-off. Metatokens: Professional broadcast quality, clean aesthetic.`,
      video_prompt: `Subject: Elements animate with purpose and intention. Environment: Backdrop maintains consistency. Action: Smooth motion with clear direction and purpose. Lighting: Consistent throughout. Camera: Sony FX6, 35mm prime, subtle push-in. Metatokens: Smooth 24fps, professional motion graphics quality.`
    }]
  };
}
