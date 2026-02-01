import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project and start processing
export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Create the project
    const { data: project, error: createError } = await supabase
      .from('projects')
      .insert({ topic, status: 'created' })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Start async processing (don't await)
    processProject(project.id).catch(console.error);

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

// Async processing function
async function processProject(projectId: string) {
  try {
    // Update status to scripting
    await supabase
      .from('projects')
      .update({ status: 'scripting', updated_at: new Date().toISOString() })
      .eq('id', projectId);

    // Get project details
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error('Project not found');

    // Generate script using OpenRouter/Gemini
    const scriptResult = await generateScript(project.topic);
    
    // Parse segments from script
    const segments = parseScriptSegments(scriptResult.script);
    
    // Save script and create segments
    await supabase
      .from('projects')
      .update({ 
        script_full: scriptResult.script,
        broll_prompts: scriptResult.brollPrompts,
        status: 'voice',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    // Create segment records
    for (let i = 0; i < segments.length; i++) {
      await supabase
        .from('segments')
        .insert({
          project_id: projectId,
          segment_number: i + 1,
          script_text: segments[i],
          status: 'pending'
        });
    }

    // For now, skip voice and video generation (needs API keys)
    // Mark as done with what we have
    await supabase
      .from('projects')
      .update({ 
        status: 'done',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

  } catch (error) {
    console.error('Error processing project:', error);
    await supabase
      .from('projects')
      .update({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);
  }
}

// Generate script using OpenRouter/Gemini
async function generateScript(topic: string): Promise<{ script: string; brollPrompts: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // If no API key, return a mock script for testing
  if (!apiKey) {
    return {
      script: `# Video Script: ${topic}

## Segment 1: Introduction
Welcome to this explainer video about ${topic}. Today we'll explore the key concepts and insights that make this topic fascinating.

## Segment 2: Core Concepts
Let's dive into the fundamental aspects of ${topic}. Understanding these basics will help you grasp the bigger picture.

## Segment 3: Deep Dive
Now that we've covered the basics, let's explore some more advanced aspects of ${topic} that experts find particularly interesting.

## Segment 4: Real-World Applications
How does ${topic} apply to our daily lives? Let's look at some practical examples and use cases.

## Segment 5: Conclusion
To wrap up, we've explored the key aspects of ${topic}. Remember the main points and consider how you might apply this knowledge.`,
      brollPrompts: [
        `Abstract visualization of ${topic} concept`,
        `Professional setting related to ${topic}`,
        `Infographic style illustration of ${topic}`,
        `Modern technology representing ${topic}`,
        `Inspiring conclusion image for ${topic}`
      ]
    };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://longform-explainers.vercel.app',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [
        {
          role: 'system',
          content: `You are an expert video scriptwriter. Create engaging, segmented video scripts for explainer content. 
          
Format your response as:
1. A full script divided into 4-6 segments (marked with ## Segment N: Title)
2. After the script, provide 5 B-roll image prompts (one per segment) marked with ## B-Roll Prompts

Each segment should be 30-60 seconds when read aloud (about 75-150 words).`
        },
        {
          role: 'user',
          content: `Create a professional explainer video script about: ${topic}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';

  // Parse B-roll prompts
  const brollMatch = content.match(/## B-Roll Prompts([\s\S]*?)$/);
  const brollSection = brollMatch ? brollMatch[1] : '';
  const brollPrompts = brollSection
    .split('\n')
    .filter((line: string) => line.trim().match(/^\d+\.|^-/))
    .map((line: string) => line.replace(/^\d+\.|^-/, '').trim())
    .filter(Boolean);

  // Get script without B-roll section
  const script = content.replace(/## B-Roll Prompts[\s\S]*$/, '').trim();

  return { script, brollPrompts };
}

// Parse script into segments
function parseScriptSegments(script: string): string[] {
  const segmentRegex = /## Segment \d+[:\s].*?\n([\s\S]*?)(?=## Segment \d+|$)/g;
  const segments: string[] = [];
  let match;

  while ((match = segmentRegex.exec(script)) !== null) {
    segments.push(match[1].trim());
  }

  // If no segments found, treat whole script as one segment
  if (segments.length === 0) {
    segments.push(script);
  }

  return segments;
}
