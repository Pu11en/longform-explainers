// Script generation using OpenRouter (Gemini)

import { GeneratedScript } from './supabase';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';

const SCRIPT_SYSTEM_PROMPT = `You are an expert video scriptwriter creating engaging, educational explainer content.

Your task is to create a structured video script with multiple scenes. Each scene should be engaging and flow naturally.

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
          "image_prompt": "Visual description for image generation",
          "video_prompt": "Motion description for video generation from the image"
        }
      ]
    }
  ]
}

Scene structure guidelines:
1. Scene 1: Hook and Setup (grab attention, introduce topic)
2. Scene 2: Core Concepts (explain the basics)
3. Scene 3: Deep Dive (explore details)
4. Scene 4: Examples/Applications (real-world use)
5. Scene 5: Conclusion and CTA (summary, call to action)

For each scene:
- script: Write 75-150 words (30-60 seconds when spoken)
- speech_prompt: Describe the tone/emotion for the voice actor
- estimate_mins: Estimate duration (0.5-1.0 min per scene)
- broll_prompts: 1-2 visual prompts per scene for B-roll footage

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
      max_tokens: 4000,
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
        speech_prompt: "Energetic, curious, inviting tone",
        estimate_mins: 0.5,
        broll_prompts: [
          {
            image_prompt: `Eye-catching abstract visualization representing ${topic}, modern design, vibrant colors`,
            video_prompt: "Slow zoom in with subtle particle effects"
          }
        ]
      },
      {
        scene_name: "2 - Core Concepts",
        script: `Let's start with the basics. ${topic} is fundamentally about understanding key principles that drive results. The first thing to know is that it's not as complicated as it might seem. When you break it down, there are really just a few core concepts you need to master.`,
        speech_prompt: "Clear, educational, confident tone",
        estimate_mins: 0.75,
        broll_prompts: [
          {
            image_prompt: `Clean infographic showing key concepts of ${topic}, minimalist design, professional`,
            video_prompt: "Elements appearing one by one with smooth transitions"
          },
          {
            image_prompt: `Person studying or learning about ${topic}, focused expression, modern setting`,
            video_prompt: "Subtle nodding motion, engaged expression"
          }
        ]
      },
      {
        scene_name: "3 - Deep Dive",
        script: `Now here's where it gets interesting. The real power of ${topic} comes from understanding how these pieces fit together. When you combine these elements strategically, you start to see results that compound over time. This is what separates beginners from experts.`,
        speech_prompt: "Insightful, revelatory, building excitement",
        estimate_mins: 0.75,
        broll_prompts: [
          {
            image_prompt: `Complex system visualization showing interconnected elements of ${topic}`,
            video_prompt: "Connections lighting up, showing flow and relationships"
          }
        ]
      },
      {
        scene_name: "4 - Real World Applications",
        script: `So how does this apply to you? Let me give you a practical example. Imagine you're starting from scratch. By applying what we've discussed, you can begin seeing results within days, not months. The key is to start small and iterate quickly.`,
        speech_prompt: "Practical, encouraging, relatable tone",
        estimate_mins: 0.75,
        broll_prompts: [
          {
            image_prompt: `Person successfully applying ${topic} in a professional setting, achievement moment`,
            video_prompt: "Celebratory gesture, satisfied expression"
          }
        ]
      },
      {
        scene_name: "5 - Conclusion and CTA",
        script: `And that's the essentials of ${topic}. Remember: start with the fundamentals, build systematically, and don't be afraid to experiment. If you found this helpful, make sure to save it for later and share it with someone who needs to hear this. Until next time!`,
        speech_prompt: "Warm, conclusive, motivating tone",
        estimate_mins: 0.5,
        broll_prompts: [
          {
            image_prompt: `Inspiring success visualization related to ${topic}, bright future, possibilities`,
            video_prompt: "Slow reveal with light rays, uplifting motion"
          }
        ]
      }
    ]
  };
}
