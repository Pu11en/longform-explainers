import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET /api/projects/[id] - Get project with scenes and segments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('longform_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      throw projectError;
    }

    // Fetch scenes
    const { data: scenes, error: scenesError } = await supabase
      .from('longform_scenes')
      .select('*')
      .eq('project_id', id)
      .order('scene_number', { ascending: true });

    if (scenesError) throw scenesError;

    // Fetch segments
    const { data: segments, error: segmentsError } = await supabase
      .from('longform_segments')
      .select('*')
      .eq('project_id', id)
      .order('segment_number', { ascending: true });

    if (segmentsError) throw segmentsError;

    // Group segments by scene
    const scenesWithSegments = scenes?.map(scene => ({
      ...scene,
      segments: segments?.filter(s => s.scene_id === scene.id) || [],
    }));

    return NextResponse.json({
      project,
      scenes: scenesWithSegments || [],
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('longform_projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
