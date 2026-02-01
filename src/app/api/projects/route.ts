import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, Project } from '@/lib/supabase';
import { generateScript } from '@/lib/script-generator';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: projects, error } = await supabase
      .from('longform_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

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
    const supabase = getSupabase();
    const body = await request.json();
    const { topic, voiceId, imageUrl } = body;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Generate project name from topic
    const projectName = topic.slice(0, 50) + (topic.length > 50 ? '...' : '');

    // Create the project
    const { data: project, error: createError } = await supabase
      .from('longform_projects')
      .insert({
        project_name: projectName,
        input_request: topic,
        input_voice_id: voiceId || null,
        input_image_url: imageUrl || null,
        status: 'create',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Start async processing (don't await - runs in background)
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

// Main processing pipeline
async function processProject(projectId: string) {
  const supabase = getSupabase();
  
  try {
    // Update status to scripting
    await updateProjectStatus(projectId, 'scripting');

    // Get project details
    const { data: project } = await supabase
      .from('longform_projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) throw new Error('Project not found');

    // Step 1: Generate script
    console.log(`[${projectId}] Generating script...`);
    const scriptData = await generateScript(project.input_request);

    // Create scenes from script
    for (let i = 0; i < scriptData.scenes.length; i++) {
      const scene = scriptData.scenes[i];
      
      const { data: sceneRecord, error: sceneError } = await supabase
        .from('longform_scenes')
        .insert({
          project_id: projectId,
          scene_number: i + 1,
          scene_name: scene.scene_name,
          script: scene.script,
          speech_prompt: scene.speech_prompt || scriptData.speech_prompt,
          estimate_mins: scene.estimate_mins,
          word_count: scene.word_count,
          status_voice: 'pending',
          status_video: 'pending',
          status_broll: 'pending',
        })
        .select()
        .single();

      if (sceneError) throw sceneError;

      // Create B-roll segments for this scene (using SEALCaM prompts)
      for (let j = 0; j < scene.broll_prompts.length; j++) {
        const broll = scene.broll_prompts[j];
        
        await supabase
          .from('longform_segments')
          .insert({
            project_id: projectId,
            scene_id: sceneRecord.id,
            segment_number: j + 1,
            segment_name: `Scene ${i + 1} - B-Roll ${j + 1}`,
            start_image_prompt: broll.start_image_prompt,  // SEALCaM formatted
            video_prompt: broll.video_prompt,              // SEALCaM formatted
            status_image: 'pending',
            status_video: 'pending',
          });
      }
    }

    // Step 2: Generate voice for each scene (if API key available)
    if (process.env.FISH_AUDIO_API_KEY) {
      await updateProjectStatus(projectId, 'voice');
      await processVoice(projectId, project.input_voice_id);
    }

    // Step 3: Generate video for each scene (if API key + image available)
    if (process.env.WAVESPEED_API_KEY && project.input_image_url) {
      await updateProjectStatus(projectId, 'video');
      await processVideo(projectId, project.input_image_url);
    }

    // Step 4: Generate B-roll (if API key available)
    if (process.env.WAVESPEED_API_KEY) {
      await updateProjectStatus(projectId, 'broll');
      await processBroll(projectId);
    }

    // Mark complete
    await updateProjectStatus(projectId, 'done');
    console.log(`[${projectId}] Processing complete!`);

  } catch (error) {
    console.error(`[${projectId}] Processing error:`, error);
    await supabase
      .from('longform_projects')
      .update({
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);
  }
}

async function updateProjectStatus(projectId: string, status: string) {
  const supabase = getSupabase();
  await supabase
    .from('longform_projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId);
}

// Process voice generation for all scenes
async function processVoice(projectId: string, voiceId: string | null) {
  const supabase = getSupabase();
  const { generateVoice } = await import('@/lib/fish-audio');

  const { data: scenes } = await supabase
    .from('longform_scenes')
    .select('*')
    .eq('project_id', projectId)
    .order('scene_number');

  if (!scenes) return;

  for (const scene of scenes) {
    try {
      await supabase
        .from('longform_scenes')
        .update({ status_voice: 'processing' })
        .eq('id', scene.id);

      const result = await generateVoice(scene.script || '', voiceId || undefined);

      await supabase
        .from('longform_scenes')
        .update({
          scene_voice_url: result.url,
          status_voice: 'done',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scene.id);

      console.log(`[${projectId}] Voice generated for scene ${scene.scene_number}`);
    } catch (error) {
      console.error(`Voice generation error for scene ${scene.id}:`, error);
      await supabase
        .from('longform_scenes')
        .update({ status_voice: 'error' })
        .eq('id', scene.id);
    }
  }
}

// Process video generation for all scenes
async function processVideo(projectId: string, imageUrl: string) {
  const supabase = getSupabase();
  const { generateTalkingHead } = await import('@/lib/wavespeed');

  const { data: scenes } = await supabase
    .from('longform_scenes')
    .select('*')
    .eq('project_id', projectId)
    .eq('status_voice', 'done')
    .order('scene_number');

  if (!scenes) return;

  for (const scene of scenes) {
    if (!scene.scene_voice_url) continue;

    try {
      await supabase
        .from('longform_scenes')
        .update({ status_video: 'processing' })
        .eq('id', scene.id);

      const videoUrl = await generateTalkingHead(imageUrl, scene.scene_voice_url);

      await supabase
        .from('longform_scenes')
        .update({
          scene_video_url: videoUrl,
          status_video: 'done',
          updated_at: new Date().toISOString(),
        })
        .eq('id', scene.id);

      console.log(`[${projectId}] Video generated for scene ${scene.scene_number}`);
    } catch (error) {
      console.error(`Video generation error for scene ${scene.id}:`, error);
      await supabase
        .from('longform_scenes')
        .update({ status_video: 'error' })
        .eq('id', scene.id);
    }
  }
}

// Process B-roll generation
async function processBroll(projectId: string) {
  const supabase = getSupabase();
  const { generateImage, generateBrollVideo } = await import('@/lib/wavespeed');

  const { data: segments } = await supabase
    .from('longform_segments')
    .select('*')
    .eq('project_id', projectId)
    .order('segment_number');

  if (!segments) return;

  for (const segment of segments) {
    try {
      // Generate image first using SEALCaM start_image_prompt
      if (segment.start_image_prompt) {
        await supabase
          .from('longform_segments')
          .update({ status_image: 'processing' })
          .eq('id', segment.id);

        const imageUrl = await generateImage(segment.start_image_prompt);

        await supabase
          .from('longform_segments')
          .update({
            segment_image_url: imageUrl,
            status_image: 'done',
          })
          .eq('id', segment.id);

        // Generate video from image
        if (segment.video_prompt) {
          await supabase
            .from('longform_segments')
            .update({ status_video: 'processing' })
            .eq('id', segment.id);

          const videoUrl = await generateBrollVideo(imageUrl, segment.video_prompt);

          await supabase
            .from('longform_segments')
            .update({
              segment_video_url: videoUrl,
              status_video: 'done',
              updated_at: new Date().toISOString(),
            })
            .eq('id', segment.id);
        }
      }

      console.log(`[${projectId}] B-roll generated for segment ${segment.id}`);
    } catch (error) {
      console.error(`B-roll generation error for segment ${segment.id}:`, error);
      await supabase
        .from('longform_segments')
        .update({ status_image: 'error', status_video: 'error' })
        .eq('id', segment.id);
    }
  }
}
