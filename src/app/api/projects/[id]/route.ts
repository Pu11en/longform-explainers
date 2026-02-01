import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// GET /api/projects/[id] - Get a single project with segments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      if (projectError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      throw projectError;
    }

    // Fetch segments
    const { data: segments, error: segmentsError } = await supabase
      .from('segments')
      .select('*')
      .eq('project_id', id)
      .order('segment_number', { ascending: true });

    if (segmentsError) {
      throw segmentsError;
    }

    return NextResponse.json({ project, segments });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
