'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, Scene, Segment } from '@/lib/supabase';

interface SceneWithSegments extends Scene {
  segments: Segment[];
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<SceneWithSegments[]>([]);
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
      
      if (!res.ok) throw new Error(data.error || 'Failed to fetch project');
      
      setProject(data.project);
      setScenes(data.scenes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'create', label: 'Created', icon: '📝' },
    { key: 'scripting', label: 'Script', icon: '✍️' },
    { key: 'voice', label: 'Voice', icon: '🎙️' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'broll', label: 'B-Roll', icon: '🎞️' },
    { key: 'done', label: 'Done', icon: '✅' },
  ];

  const getStepIndex = (status: string) => {
    const idx = steps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-600',
      processing: 'bg-yellow-500 animate-pulse',
      done: 'bg-green-500',
      error: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8 flex items-center justify-center">
        <div className="text-xl animate-pulse">Loading project...</div>
      </main>
    );
  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-blue-400 hover:underline mb-4 block">← Back to Projects</Link>
          <div className="text-red-400 bg-red-900/20 p-4 rounded-lg">{error || 'Project not found'}</div>
        </div>
      </main>
    );
  }

  const currentStep = getStepIndex(project.status);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-400 hover:underline mb-4 block">← Back to Projects</Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{project.project_name}</h1>
          <p className="text-gray-400">{project.input_request}</p>
          <p className="text-sm text-gray-500 mt-2">
            Created: {new Date(project.created_at).toLocaleString()}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-700">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {steps.map((step, index) => {
              const isComplete = currentStep > index;
              const isCurrent = currentStep === index;
              const isError = project.status === 'error' && isCurrent;
              
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all
                    ${isComplete ? 'bg-blue-500' : ''}
                    ${isCurrent && !isError ? 'bg-blue-500 ring-4 ring-blue-500/30 animate-pulse' : ''}
                    ${isError ? 'bg-red-500 ring-4 ring-red-500/30' : ''}
                    ${!isComplete && !isCurrent ? 'bg-gray-700' : ''}
                  `}>
                    {isError ? '❌' : step.icon}
                  </div>
                  <span className={`mt-2 text-xs sm:text-sm ${isCurrent ? 'text-white font-semibold' : 'text-gray-400'}`}>
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
            <h3 className="font-semibold text-red-400 mb-1">⚠️ Error</h3>
            <p className="text-red-300">{project.error}</p>
          </div>
        )}

        {/* Scenes */}
        {scenes.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">📜 Scenes ({scenes.length})</h2>
            
            {scenes.map((scene) => (
              <div key={scene.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {/* Scene Header */}
                <div className="p-4 bg-gray-750 border-b border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{scene.scene_name}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(scene.status_voice)}`}>
                      🎙️ {scene.status_voice}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(scene.status_video)}`}>
                      🎬 {scene.status_video}
                    </span>
                  </div>
                </div>

                {/* Scene Content */}
                <div className="p-4 space-y-4">
                  {/* Script */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Script</h4>
                    <p className="text-gray-300 bg-gray-900/50 p-3 rounded-lg">{scene.script}</p>
                    {scene.speech_prompt && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        Voice direction: {scene.speech_prompt}
                      </p>
                    )}
                  </div>

                  {/* Audio Player */}
                  {scene.scene_voice_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">🎙️ Voice Audio</h4>
                      <audio controls src={scene.scene_voice_url} className="w-full" />
                    </div>
                  )}

                  {/* Video Player */}
                  {scene.scene_video_url && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">🎬 Talking Head Video</h4>
                      <video controls src={scene.scene_video_url} className="w-full rounded-lg" />
                    </div>
                  )}

                  {/* B-Roll Segments */}
                  {scene.segments && scene.segments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">🎞️ B-Roll Assets</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {scene.segments.map((segment) => (
                          <div key={segment.id} className="bg-gray-900/50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">{segment.segment_name}</span>
                              <div className="flex gap-1">
                                <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusBadge(segment.status_image)}`}>
                                  🖼️
                                </span>
                                <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusBadge(segment.status_video)}`}>
                                  🎥
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{segment.image_prompt}</p>
                            
                            {segment.segment_image_url && (
                              <img 
                                src={segment.segment_image_url} 
                                alt={segment.segment_name || 'B-roll'} 
                                className="w-full rounded mb-2"
                              />
                            )}
                            
                            {segment.segment_video_url && (
                              <video 
                                controls 
                                src={segment.segment_video_url} 
                                className="w-full rounded"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {scenes.length === 0 && project.status !== 'error' && (
          <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-4xl mb-4 animate-bounce">✨</p>
            <p>Generating your explainer video script...</p>
            <p className="text-sm mt-2">This usually takes 10-30 seconds</p>
          </div>
        )}

        {/* Project Settings */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3">⚙️ Project Settings</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Voice ID:</span>
              <span className="ml-2">{project.input_voice_id || 'Default'}</span>
            </div>
            <div>
              <span className="text-gray-400">Avatar Image:</span>
              <span className="ml-2">{project.input_image_url ? '✅ Set' : 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
