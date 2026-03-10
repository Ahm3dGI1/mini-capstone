import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, answerCheckpoint } from '../api/api';
import VideoPlayer from '../components/VideoPlayer';
import CheckpointModal from '../components/CheckpointModal';
import ProgressBar from '../components/ProgressBar';
import TutorChat from '../components/TutorChat';
import SessionSummary from '../components/SessionSummary';
import { FiArrowLeft, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  const [session, setSession] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await getSession(id);
      setSession(res.data.session);
      setCheckpoints(res.data.session.checkpoints || []);
      setChatMessages(res.data.session.chat_messages || []);
    } catch (err) {
      toast.error('Session not found');
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleCheckpointReached = useCallback((checkpoint) => {
    setActiveCheckpoint(checkpoint);
  }, []);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
    // Update duration from player
    if (playerRef.current) {
      const d = playerRef.current.getDuration();
      if (d > 0) setDuration(d);
    }
  }, []);

  const handleAnswerSubmit = async (checkpointId, answer) => {
    try {
      const res = await answerCheckpoint(id, checkpointId, answer);
      // Update checkpoint in local state
      setCheckpoints((prev) =>
        prev.map((cp) =>
          cp.id === checkpointId
            ? { ...cp, user_answer: answer, answered_at: new Date().toISOString() }
            : cp
        )
      );
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit answer');
      throw err;
    }
  };

  const handleResumeFromCheckpoint = () => {
    setActiveCheckpoint(null);
    playerRef.current?.play();

    // Check if all checkpoints are answered
    const allAnswered = checkpoints.every((cp) => cp.user_answer !== null);
    if (allAnswered && checkpoints.length > 0) {
      // Show summary after a short delay
      setTimeout(() => setShowSummary(true), 2000);
    }
  };

  const handleChatOpen = () => {
    setShowChat(true);
    playerRef.current?.pause();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-gray-500 hover:text-primary-600 transition text-sm"
          >
            <FiArrowLeft /> Dashboard
          </button>
          <h1 className="text-sm font-medium text-gray-700 truncate max-w-md">{session.video_title}</h1>
          <button
            onClick={() => setShowChat(!showChat)}
            className="lg:hidden flex items-center gap-1 text-gray-500 hover:text-primary-600 transition text-sm"
          >
            <FiMessageCircle /> Chat
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4" style={{ height: 'calc(100vh - 140px)' }}>
          {/* Left: Video Column */}
          <div className="lg:w-[65%] flex flex-col">
            <div className="relative">
              <VideoPlayer
                ref={playerRef}
                videoId={session.video_id}
                checkpoints={checkpoints}
                onCheckpointReached={handleCheckpointReached}
                onTimeUpdate={handleTimeUpdate}
              />

              {/* Checkpoint Modal Overlay */}
              {activeCheckpoint && (
                <CheckpointModal
                  checkpoint={activeCheckpoint}
                  onSubmit={handleAnswerSubmit}
                  onResume={handleResumeFromCheckpoint}
                />
              )}
            </div>

            {/* Progress Bar */}
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              checkpoints={checkpoints}
            />

            {/* Video Info */}
            <div className="mt-3 px-1">
              <h2 className="text-lg font-semibold text-gray-900">{session.video_title}</h2>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                <span>{checkpoints.length} checkpoints</span>
                <span>
                  {checkpoints.filter((c) => c.user_answer !== null).length} / {checkpoints.length} answered
                </span>
              </div>
            </div>

            {/* Summary (shown after all checkpoints answered) */}
            {showSummary && (
              <div className="mt-6">
                <SessionSummary
                  checkpoints={checkpoints}
                  onAskTutor={() => {
                    setShowSummary(false);
                    setShowChat(true);
                  }}
                />
              </div>
            )}
          </div>

          {/* Right: Chat Column */}
          <div className={`lg:w-[35%] ${showChat ? 'block' : 'hidden lg:block'}`} style={{ height: '100%' }}>
            <TutorChat
              sessionId={session.id}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              currentTime={currentTime}
              onChatOpen={handleChatOpen}
            />
          </div>
        </div>
      </div>

      {/* Mobile Chat Toggle */}
      {!showChat && (
        <button
          onClick={handleChatOpen}
          className="lg:hidden fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-xl hover:bg-primary-700 transition z-40"
        >
          <FiMessageCircle className="text-xl" />
        </button>
      )}
    </div>
  );
}
