'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, Segment } from '@/lib/supabase';

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch project');
      }
      
      setProject(data.project);
      setSegments(data.segments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string): number => {
    const steps: Record<string, number> = {
      created: 0,
      scripting: 1,
      voice: 2,
      video: 3,
      broll: 4,
      done: 5,
      error: -1,
    };
    return steps[status] ?? 0;
  };

  const steps = [
    { key: 'created', label: 'Created', icon: '📝' },
    { key: 'scripting', label: 'Script', icon: '✍️' },
    { key: 'voice', label: 'Voice', icon: '🎙️' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'broll', label: 'B-Roll', icon: '🎞️' },
    { key: 'done', label: 'Done', icon: '✅' },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8 flex items-center justify-center">
        <div className="text-xl">Loading project...</div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-400 hover:underline mb-4 block">
            ← Back to Projects
          </Link>
          <div className="text-red-400">{error || 'Project not found'}</div>
        </div>
      </main>
    );
  }

  const currentStep = getStatusStep(project.status);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 block">
          ← Back to Projects
        </Link>

        <h1 className="text-3xl font-bold mb-2">{project.topic}</h1>
        <p className="text-gray-400 mb-8">
          Created: {new Date(project.created_at).toLocaleString()}
        </p>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {steps.map((step, index) => {
              const isComplete = currentStep > index;
              const isCurrent = currentStep === index;
              const isError = project.status === 'error';
              
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                      ${isComplete ? 'bg-blue-500' : ''}
                      ${isCurrent && !isError ? 'bg-blue-500 ring-4 ring-blue-500/30' : ''}
                      ${isCurrent && isError ? 'bg-red-500 ring-4 ring-red-500/30' : ''}
                      ${!isComplete && !isCurrent ? 'bg-gray-700' : ''}
                    `}
                  >
                    {isError && isCurrent ? '❌' : step.icon}
                  </div>
                  <span className={`mt-2 text-sm ${isCurrent ? 'text-white font-semibold' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {project.error && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <h3 className="font-semibold text-red-400 mb-1">Error</h3>
            <p className="text-red-300">{project.error}</p>
          </div>
        )}

        {/* Script Section */}
        {project.script_full && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">📜 Script</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <pre className="whitespace-pre-wrap text-gray-300 font-sans">
                {project.script_full}
              </pre>
            </div>
          </div>
        )}

        {/* Segments Section */}
        {segments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">🎬 Segments</h2>
            <div className="space-y-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold">Segment {segment.segment_number}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      segment.status === 'video_done' ? 'bg-green-500' :
                      segment.status === 'error' ? 'bg-red-500' :
                      segment.status.includes('processing') ? 'bg-yellow-500' :
                      'bg-gray-600'
                    }`}>
                      {segment.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-4">{segment.script_text}</p>
                  
                  {segment.voice_url && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-400 mb-2">🎙️ Voice</h4>
                      <audio controls src={segment.voice_url} className="w-full" />
                    </div>
                  )}
                  
                  {segment.video_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">🎬 Video</h4>
                      <video controls src={segment.video_url} className="w-full rounded" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* B-Roll Prompts */}
        {project.broll_prompts && project.broll_prompts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">🎞️ B-Roll Prompts</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <ul className="space-y-2">
                {project.broll_prompts.map((prompt: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-blue-400">{index + 1}.</span>
                    <span className="text-gray-300">{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
