'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/supabase';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, voiceId: voiceId || null, imageUrl: imageUrl || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project');

      setTopic('');
      setVoiceId('');
      setImageUrl('');
      fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      create: 'bg-gray-500',
      scripting: 'bg-yellow-500',
      voice: 'bg-blue-500',
      video: 'bg-purple-500',
      broll: 'bg-indigo-500',
      done: 'bg-green-500',
      error: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      create: '📝 Created',
      scripting: '✍️ Writing Script',
      voice: '🎙️ Generating Voice',
      video: '🎬 Creating Video',
      broll: '🎞️ B-Roll Generation',
      done: '✅ Complete',
      error: '❌ Error',
    };
    return labels[status] || status;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">
          🎬 Longform AI Explainers
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Generate professional explainer videos with AI-powered scripts, voice, and video
        </p>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="mb-12 bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Video Topic *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., How AI is transforming healthcare"
                className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              {showAdvanced ? '▼ Hide' : '▶ Show'} Advanced Options
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-gray-700">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fish Audio Voice ID
                    <span className="text-gray-400 font-normal ml-2">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    placeholder="e.g., abc123..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get voice IDs from <a href="https://fish.audio/app/" target="_blank" className="text-blue-400 hover:underline">fish.audio</a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Talking Head Image URL
                    <span className="text-gray-400 font-normal ml-2">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Image of person for InfiniTalk video generation
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? '⏳ Creating Project...' : '🚀 Generate Explainer Video'}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-red-400 text-center">{error}</p>
          )}
        </form>

        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-4xl mb-4">🎥</p>
              <p>No projects yet. Submit a topic to get started!</p>
            </div>
          ) : (
            projects.map((project) => (
              <a
                key={project.id}
                href={`/project/${project.id}`}
                className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-500 transition-all hover:shadow-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <h3 className="text-xl font-medium mb-1">{project.project_name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">{project.input_request}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(project.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.error && (
                  <p className="mt-3 text-red-400 text-sm bg-red-900/20 p-2 rounded">
                    {project.error}
                  </p>
                )}
              </a>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by OpenRouter • Fish Audio • WaveSpeed AI</p>
        </footer>
      </div>
    </main>
  );
}
