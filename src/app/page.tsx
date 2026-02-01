'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/lib/supabase';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects on load
  useEffect(() => {
    fetchProjects();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
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
        body: JSON.stringify({ topic }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setTopic('');
      fetchProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-500';
      case 'scripting': return 'bg-yellow-500';
      case 'voice': return 'bg-blue-500';
      case 'video': return 'bg-purple-500';
      case 'broll': return 'bg-indigo-500';
      case 'done': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return '⏳ Created';
      case 'scripting': return '✍️ Generating Script';
      case 'voice': return '🎙️ Creating Voice';
      case 'video': return '🎬 Generating Video';
      case 'broll': return '🎞️ B-Roll Prompts';
      case 'done': return '✅ Done';
      case 'error': return '❌ Error';
      default: return status;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">
          🎬 Longform AI Explainers
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Generate professional explainer videos from any topic
        </p>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your video topic..."
              className="flex-1 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Creating...' : 'Generate Video'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-400">{error}</p>
          )}
        </form>

        {/* Projects List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No projects yet. Submit a topic to get started!</p>
            </div>
          ) : (
            projects.map((project) => (
              <a
                key={project.id}
                href={`/project/${project.id}`}
                className="block p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-2">{project.topic}</h3>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(project.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                {project.error && (
                  <p className="mt-2 text-red-400 text-sm">{project.error}</p>
                )}
              </a>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
