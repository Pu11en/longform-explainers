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
  BrollGeneratorOutput,
  convertToLegacyFormat,
  BrollGeneratorOutputLegacy
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
      onscreen_text?: string;
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
          onscreen_text: s.onscreen_text,
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
 * Returns legacy format for backward compatibility with app
 */
async function generateBrollForScript(script: string): Promise<BrollGeneratorOutputLegacy> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Calculate duration for conversion
  const wordCount = script.split(/\s+/).length;
  const durationSeconds = Math.ceil(wordCount / BROLL_CONFIG.WORDS_PER_MINUTE_AVG * 60);
  
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
    const parsed = JSON.parse(content) as BrollGeneratorOutput;
    // Convert to legacy format for app compatibility
    return convertToLegacyFormat(parsed, script, durationSeconds);
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
 * Uses proper SEALCaM format with newline-separated keys and required ending
 */
function getMockScript(topic: string): GeneratedScript {
  // Define consistent color palette for all segments
  const colorPalette = {
    primary: 'deep cyan (#0891B2)',
    secondary: 'rich purple (#7C3AED)',
    accent: 'warm gold (#F59E0B)',
  };

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
            onscreen_text: "Everything clicks",
            start_image_prompt: `Subject: Abstract visualization of ${topic} concept, glowing interconnected nodes forming a network pattern, on-screen text "Everything clicks" integrated naturally.
Environment: Dark void with deep cyan (${colorPalette.primary}) and rich purple (${colorPalette.secondary}) gradient, subtle particle field creating depth.
Action: Static starting frame, dormant energy state, no movement.
Lighting: Soft cyan key light from above-left, purple rim highlights on node edges, high contrast ratio 4:1, color temperature 6500K.
Camera: RED Komodo 6K, 24mm Sigma Art prime lens, centered wide shot, eye level angle, locked-off no movement.
Metatokens: photorealistic CGI, clean digital aesthetic, 4K resolution, cinematic color grade, subtle lens vignette, tech-modern style
ignore the colors of the reference image`,
            video_prompt: `Subject: Network nodes identical to start image, glowing interconnected pattern. Environment: Same dark void with ${colorPalette.primary} and ${colorPalette.secondary} gradient, identical to start. Action: Nodes fade out one by one from edges to center, particles drift away, resolving to clean solid ${colorPalette.primary} empty frame. Lighting: Key light maintains consistency then gently fades. Camera: RED Komodo 6K, 24mm Sigma Art, slow gentle dolly back over 3 seconds. Metatokens: smooth 24fps motion, photorealistic CGI, minimal transitions, resolves to solid color frame.`
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
            onscreen_text: "Three key principles",
            start_image_prompt: `Subject: Clean infographic with three key icons arranged in triangular composition, modern flat design with subtle 3D depth, on-screen text "Three key principles" centered below.
Environment: Pure white studio backdrop with soft drop shadows, maintaining ${colorPalette.primary} and ${colorPalette.accent} accent colors on icons.
Action: Static frame, all elements in final position, no movement.
Lighting: Large soft diffused key from front-above, minimal shadows, even 18% gray exposure, neutral 5600K temperature.
Camera: Sony FX6, 50mm Sony G Master prime, straight-on medium shot at eye level, locked-off no movement.
Metatokens: motion graphics aesthetic, vector-clean edges, broadcast quality finish, subtle film grain 5%, professional corporate style
ignore the colors of the reference image`,
            video_prompt: `Subject: Three icons identical to start image, triangular composition. Environment: Same pure white studio backdrop, identical to start. Action: Icons fade out one by one from left to right, connecting lines dissolve, resolving to clean solid white empty frame. Lighting: Consistent soft diffused key throughout. Camera: Sony FX6, 50mm G Master, slow gentle pan right over 3 seconds. Metatokens: 30fps smooth motion graphics, clean vector animation, minimal transitions, resolves to solid white frame.`
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
            onscreen_text: "Start with basics",
            start_image_prompt: `Subject: Hands positioned on laptop keyboard, screen displaying progress dashboard with upward metrics, coffee cup as secondary element, subtle on-screen text "Start with basics".
Environment: Contemporary home office with warm morning light, organized desk with plant, large window with soft city bokeh, ${colorPalette.accent} accent in decor elements.
Action: Typing paused, hands resting naturally on keyboard, steam from coffee frozen mid-rise, no movement.
Lighting: Warm morning sunlight as key from window-right at 45 degrees, soft bounce fill from white desk, golden hour 3200K temperature.
Camera: Canon R5, 35mm RF prime lens f/2.0, over-the-shoulder composition, slight high angle, shallow depth of field, locked-off no movement.
Metatokens: lifestyle realism, warm inviting color palette, subtle film emulation, relatable aspirational aesthetic, natural skin tones
ignore the colors of the reference image`,
            video_prompt: `Subject: Hands on laptop keyboard identical to start image, dashboard visible. Environment: Same contemporary home office with warm morning light, identical to start. Action: Screen elements fade out one by one, hands gently lift from keyboard, resolving to clean solid ${colorPalette.accent} warm empty frame. Lighting: Warm sunlight maintains consistency then gently fades. Camera: Canon R5, 35mm RF prime, slow gentle dolly back over 3 seconds. Metatokens: 24fps cinematic, lifestyle aesthetic, minimal transitions, resolves to warm solid color frame.`
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
            onscreen_text: "You've got this",
            start_image_prompt: `Subject: Person silhouette at mountain summit, arms at sides, overlooking vast landscape with sea of clouds below, on-screen text "You've got this" in lower third.
Environment: Epic mountain vista at golden hour, layered ridges receding into atmospheric haze, sky gradient from ${colorPalette.accent} to ${colorPalette.secondary}.
Action: Static hero moment, figure contemplating achievement, clouds frozen in position, no movement.
Lighting: Dramatic golden hour backlight creating strong silhouette, sun positioned just above horizon as rim light, warm atmospheric haze, 2800K temperature.
Camera: RED V-Raptor 8K, 24mm Cooke S7 anamorphic, wide establishing shot, eye level angle, locked-off heavy tripod, no movement.
Metatokens: epic cinematic realism, nature documentary quality, rich dynamic range, inspirational aspirational tone, 2.39:1 aspect ratio, film grain 10%
ignore the colors of the reference image`,
            video_prompt: `Subject: Person silhouette at mountain summit identical to start image, arms at sides. Environment: Same epic mountain vista at golden hour, identical to start. Action: Figure and landscape elements fade out gradually, sun glow intensifies then fades, resolving to clean solid ${colorPalette.accent} warm empty frame. Lighting: Golden hour backlight maintains then gently fades to solid. Camera: RED V-Raptor 8K, 24mm Cooke S7 anamorphic, slow gentle dolly back over 4 seconds. Metatokens: smooth 24fps, epic cinematic, minimal transitions, resolves to warm gold solid color frame.`
          }
        ]
      }
    ]
  };
}

/**
 * Mock B-roll for testing without API key
 * Returns legacy format with proper video_prompt rules (elements animate out, resolve to empty frame)
 */
function getMockBroll(script: string): BrollGeneratorOutputLegacy {
  const wordCount = script.split(/\s+/).length;
  const durationSeconds = Math.ceil(wordCount / BROLL_CONFIG.WORDS_PER_MINUTE_AVG * 60);
  const numSegments = Math.max(1, Math.ceil(durationSeconds / BROLL_CONFIG.SEGMENT_DURATION_SECONDS));
  
  return {
    total_segments: numSegments,
    estimated_duration_seconds: durationSeconds,
    color_palette: {
      primary: 'deep cyan (#0891B2)',
      secondary: 'rich purple (#7C3AED)',
      accent: 'warm gold (#F59E0B)',
    },
    segments: [{
      segment_number: 1,
      script_excerpt: script.slice(0, 100) + '...',
      duration_seconds: durationSeconds,
      onscreen_text: 'Key insight',
      start_image_prompt: `Subject: Abstract conceptual visualization related to the topic, on-screen text "Key insight" integrated naturally.
Environment: Clean modern backdrop with subtle depth, deep cyan (#0891B2) and purple (#7C3AED) gradient.
Action: Static starting frame, no movement.
Lighting: Soft diffused key light from front-above, balanced fill, 5600K color temperature.
Camera: Sony FX6, 35mm prime lens, medium shot, eye level, locked-off no movement.
Metatokens: professional broadcast quality, clean aesthetic, modern corporate style, 4K resolution
ignore the colors of the reference image`,
      video_prompt: `Subject: Abstract visualization elements, identical to start image. Environment: Same clean modern backdrop with deep cyan and purple gradient, identical to start. Action: Elements animate out of frame one by one, resolving to clean solid deep cyan (#0891B2) empty frame. Lighting: Soft diffused key maintains consistency, gentle fade. Camera: Sony FX6, 35mm prime lens, medium shot, slow gentle dolly back over 3 seconds. Metatokens: smooth 24fps, professional motion graphics, clean minimal transitions, resolves to solid color.`
    }]
  };
}
