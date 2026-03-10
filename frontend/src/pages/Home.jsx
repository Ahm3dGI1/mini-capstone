import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createSession } from '../api/api';
import { FiPlay, FiBookOpen, FiMessageCircle, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const res = await createSession(url.trim());
      toast.success('Session created! Let\'s learn!');
      navigate(`/session/${res.data.session.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create session');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Turn YouTube Videos Into<br />
            <span className="text-yellow-300">Active Learning</span> Sessions
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Paste any YouTube URL and get AI-generated quizzes at key moments, plus a personal AI tutor to answer your questions.
          </p>

          {/* URL Input */}
          <form onSubmit={handleStart} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a YouTube URL..."
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-yellow-300/50 shadow-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!url.trim() || loading}
                className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiPlay /> Start Learning
                  </>
                )}
              </button>
            </div>
            {loading && (
              <p className="text-blue-200 text-sm mt-3">
                Fetching transcript and generating checkpoints... this may take 15-30 seconds.
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiPlay className="text-2xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">1. Paste a YouTube URL</h3>
              <p className="text-gray-500 text-sm">Enter any YouTube video with captions. We'll extract the transcript automatically.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="text-2xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">2. Answer Checkpoint Quizzes</h3>
              <p className="text-gray-500 text-sm">AI generates quizzes at key moments. The video pauses for you to answer.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiMessageCircle className="text-2xl" />
              </div>
              <h3 className="text-lg font-semibold mb-2">3. Chat with AI Tutor</h3>
              <p className="text-gray-500 text-sm">Ask questions anytime. The tutor knows the full video transcript and your progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto text-center px-4">
            <h2 className="text-2xl font-bold mb-4">Ready to learn smarter?</h2>
            <p className="text-gray-500 mb-6">Create a free account to save your progress and revisit sessions.</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-700 transition"
            >
              Get Started <FiArrowRight />
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <p>LearnTube &mdash; Transform passive watching into active learning.</p>
      </footer>
    </div>
  );
}
