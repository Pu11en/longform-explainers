// Script generation using OpenRouter (Gemini)
// Uses SEALCaM framework for B-roll prompts

import { GeneratedScript } from './supabase';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const SEALCAM_FRAMEWORK = `
## SEALCaM B-Roll Prompting Framework

When generating B-roll prompts, use this EXACT structure in this EXACT order:

**S – Subject**: What the camera is optically prioritizing within the frame.
**E – Environment**: The physical or constructed space surrounding the subject.
**A – Action**: Observable motion within the frame (subject movement, camera movement, environmental motion).
**L – Lighting**: Lighting setup and exposure (key light, fill, rim, contrast ratio, color temperature).
**Ca – Camera**: MUST include ALL of:
  - Camera type (ARRI Alexa, RED, Sony FX, DSLR, mirrorless)
  - Lens type and focal length (35mm prime, 85mm portrait lens)
  - Framing and angle (wide, medium, close-up; eye-level, low-angle)
  - Camera motion (locked-off, handheld, dolly, pan, tilt, tracking)
**M – Metatokens**: Visual production qualifiers (realism level, texture/grain, motion cadence, render quality).

Format each prompt as:
"Subject: [desc]. Environment: [desc]. Action: [desc]. Lighting: [desc]. Camera: [desc]. Metatokens: [desc]."
`;

const SCRIPT_SYSTEM_PROMPT = `You are an expert video scriptwriter creating engaging, educational explainer content.

Your task is to create a structured video script with multiple scenes. Each scene should be engaging and flow naturally.

${SEALCAM_FRAMEWORK}

IMPORTANT: Return your response as valid JSON matching this exact structure:
{
  "scenes": [
    {
      "scene_name": "1 - Hook and Setup",
      "script": "The actual script text to be spoken...",
      "speech_prompt": "Energetic and curious tone",
      "estimate_mins": 0.5,
      "broll_prompts": [
        {
          "start_image_prompt": "SEALCaM formatted prompt for the starting image...",
          "video_prompt": "SEALCaM formatted prompt describing motion from image to video..."
        }
      ]
    }
  ]
}

Scene structure guidelines:
1. Scene 1: Hook and Setup (grab attention, introduce topic) - 30-45 seconds
2. Scene 2: Core Concepts (explain the basics) - 45-60 seconds
3. Scene 3: Deep Dive (explore details) - 45-60 seconds
4. Scene 4: Examples/Applications (real-world use) - 45-60 seconds
5. Scene 5: Conclusion and CTA (summary, call to action) - 30-45 seconds

For each scene:
- script: Write 75-150 words (30-60 seconds when spoken)
- speech_prompt: Describe the tone/emotion for the voice actor
- estimate_mins: Estimate duration (0.5-1.0 min per scene)
- broll_prompts: 1-2 SEALCaM formatted prompts per scene
  - start_image_prompt: Full SEALCaM prompt for the starting frame/image
  - video_prompt: SEALCaM prompt describing the motion/animation from that image

Return ONLY valid JSON, no markdown, no explanation.`;

export async function generateScript(topic: string): Promise<GeneratedScript> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Mock response if no API key
  if (!apiKey) {
    return getMockScript(topic);
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
        { role: 'system', content: SCRIPT_SYSTEM_PROMPT },
        { role: 'user', content: `Create a professional explainer video script about: ${topic}` }
      ],
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content in OpenRouter response');
  }

  try {
    const parsed = JSON.parse(content);
    return parsed as GeneratedScript;
  } catch {
    console.error('Failed to parse script JSON:', content);
    throw new Error('Invalid JSON from script generation');
  }
}

function getMockScript(topic: string): GeneratedScript {
  return {
    scenes: [
      {
        scene_name: "1 - Hook and Setup",
        script: `Have you ever wondered about ${topic}? In the next few minutes, I'm going to break down everything you need to know in a way that's easy to understand and actually useful. Whether you're a complete beginner or just looking to refresh your knowledge, you're in the right place.`,
        speech_prompt: "Energetic, curious, inviting tone with rising inflection on the hook question",
        estimate_mins: 0.5,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Abstract digital visualization representing ${topic}, glowing nodes and connection lines forming a conceptual network. Environment: Dark void with deep blue gradient, subtle particle field in background. Action: Static starting frame with dormant energy. Lighting: Soft cyan key light from above, purple rim highlights on edges, high contrast ratio. Camera: RED Komodo, 24mm wide prime lens, centered wide shot, locked-off position. Metatokens: Photorealistic CGI, clean digital aesthetic, 4K resolution, cinematic color grade.`,
            video_prompt: `Subject: Network nodes activating sequentially, connection lines illuminating with energy pulses. Environment: Same dark void, particles beginning subtle drift. Action: Slow push-in dolly movement, nodes pulse and glow brighter, energy ripples outward. Lighting: Key light intensifies, additional fill emerges from active nodes. Camera: RED Komodo, 24mm wide prime, slow 2-second dolly push-in to medium-wide. Metatokens: Smooth 24fps motion, photorealistic CGI, subtle lens bloom on highlights.`
          }
        ]
      },
      {
        scene_name: "2 - Core Concepts",
        script: `Let's start with the basics. ${topic} is fundamentally about understanding key principles that drive results. The first thing to know is that it's not as complicated as it might seem. When you break it down, there are really just a few core concepts you need to master to get started.`,
        speech_prompt: "Clear, educational, confident tone - like a knowledgeable friend explaining",
        estimate_mins: 0.75,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Clean infographic with three key concept icons arranged in a triangle, modern flat design. Environment: Pure white studio backdrop with subtle drop shadows, minimalist presentation space. Action: Static frame, elements in final position. Lighting: Soft diffused key light from front, minimal shadows, even exposure across frame. Camera: Sony FX6, 50mm prime lens, straight-on medium shot at eye level, locked-off tripod. Metatokens: Motion graphics style, vector-clean edges, broadcast quality, subtle grain.`,
            video_prompt: `Subject: Icons animate in sequence with smooth easing, connecting lines draw between them. Environment: White backdrop maintains consistency. Action: Elements scale up from 0% with bounce easing, lines draw left-to-right, subtle 3D rotation on icons. Lighting: Consistent soft lighting throughout. Camera: Sony FX6, 50mm prime, static locked-off shot. Metatokens: 30fps smooth motion, clean vector animation, professional motion graphics aesthetic.`
          },
          {
            start_image_prompt: `Subject: Professional person at modern desk, thoughtful expression, looking slightly off-camera. Environment: Contemporary office with plants, natural wood, large window with city view bokeh. Action: Static portrait moment. Lighting: Large soft window key light from left, warm practical desk lamp fill, natural color temperature. Camera: Canon R5, 85mm f/1.4 portrait lens, medium close-up, slight low angle, shallow depth of field. Metatokens: Cinematic realism, film-like skin tones, subtle film grain, documentary style.`,
            video_prompt: `Subject: Person nods thoughtfully, slight smile emerges, eyes engage with understanding. Environment: Background maintains soft bokeh, slight movement in leaves. Action: Subtle head movement, micro-expressions of comprehension, gentle handheld sway. Lighting: Consistent window light with subtle flicker from practical. Camera: Canon R5, 85mm f/1.4, handheld with stabilization, slight organic movement. Metatokens: 24fps cinematic, natural skin motion, documentary authenticity, warm grade.`
          }
        ]
      },
      {
        scene_name: "3 - Deep Dive",
        script: `Now here's where it gets interesting. The real power of ${topic} comes from understanding how these pieces fit together. When you combine these elements strategically, you start to see results that compound over time. This is what separates beginners from experts in the field.`,
        speech_prompt: "Insightful, revelatory tone - building excitement, slightly faster pace",
        estimate_mins: 0.75,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Complex 3D system diagram with interconnected layers, translucent panels showing data flow. Environment: Dark tech environment with holographic display aesthetic, floating interface elements. Action: System at rest, all connections visible. Lighting: Cyan holographic glow as key, orange accent highlights on active nodes, high contrast. Camera: ARRI Alexa Mini, 35mm anamorphic lens, wide establishing shot, slight dutch angle. Metatokens: Sci-fi realism, clean holographic render, anamorphic lens flares, cinematic 2.39:1 aspect.`,
            video_prompt: `Subject: Data pulses flow through connections, layers separate and reconnect, system comes alive. Environment: Holographic elements intensify, additional UI appears. Action: Smooth orbital camera movement around system, elements animate with purpose, energy builds. Lighting: Dynamic lighting follows data flow, pulses create moving shadows. Camera: ARRI Alexa Mini, 35mm anamorphic, slow 180-degree orbit, steady dolly. Metatokens: Smooth 24fps, sci-fi production quality, lens breathing on focus pulls, cinematic motion blur.`
          }
        ]
      },
      {
        scene_name: "4 - Real World Applications",
        script: `So how does this apply to you? Let me give you a practical example. Imagine you're starting from scratch. By applying what we've discussed, you can begin seeing results within days, not months. The key is to start small and iterate quickly based on feedback.`,
        speech_prompt: "Practical, encouraging, relatable - speaking directly to viewer's situation",
        estimate_mins: 0.75,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Hands typing on laptop keyboard, screen showing progress dashboard with upward metrics. Environment: Cozy home office, morning light, coffee cup nearby, organized desk. Action: Typing paused, hands resting on keyboard. Lighting: Warm morning sunlight key from window right, soft bounce fill from white desk, golden hour warmth. Camera: Sony A7S III, 35mm prime lens, over-the-shoulder close-up, slight high angle. Metatokens: Lifestyle realism, warm color palette, subtle film emulation, relatable aesthetic.`,
            video_prompt: `Subject: Hands resume typing with purpose, screen metrics animate upward, success notification appears. Environment: Steam rises gently from coffee, light shifts subtly. Action: Confident typing rhythm, dashboard numbers climb, subtle celebration gesture. Lighting: Consistent warm sunlight, screen glow increases on face. Camera: Sony A7S III, 35mm prime, slow push-in from OTS to CU of screen, handheld stability. Metatokens: 24fps cinematic, lifestyle commercial feel, motivated energy, warm grade.`
          }
        ]
      },
      {
        scene_name: "5 - Conclusion and CTA",
        script: `And that's the essentials of ${topic}. Remember: start with the fundamentals, build systematically, and don't be afraid to experiment. If you found this helpful, make sure to save it for later and share it with someone who needs to hear this. Until next time!`,
        speech_prompt: "Warm, conclusive, motivating - ending on an uplifting, memorable note",
        estimate_mins: 0.5,
        broll_prompts: [
          {
            start_image_prompt: `Subject: Sunrise over mountain horizon, silhouette of person standing at summit with arms slightly raised. Environment: Epic mountain landscape, sea of clouds below, golden sky gradient. Action: Static hero moment at peak. Lighting: Dramatic golden hour backlight, sun as key creating silhouette, warm atmospheric haze. Camera: RED V-Raptor, 24mm wide cinema lens, wide establishing shot, locked-off tripod. Metatokens: Epic cinematic realism, nature documentary quality, rich dynamic range, inspirational tone.`,
            video_prompt: `Subject: Figure raises arms in victory pose, sun crests horizon creating lens flare. Environment: Clouds drift slowly below, light intensifies across landscape. Action: Triumphant arm raise, gentle wind movement in clothing, sun rising creates dynamic light change. Lighting: Sun breaks over horizon, backlight intensifies, golden rays spread. Camera: RED V-Raptor, 24mm wide, slow tilt up following arm movement, locked tripod. Metatokens: Smooth 24fps, epic scale, lens flare artifacts, peak cinematic moment, inspirational crescendo.`
          }
        ]
      }
    ]
  };
}
