import { FiCheck, FiX, FiAward, FiMessageCircle } from 'react-icons/fi';

export default function SessionSummary({ checkpoints, onAskTutor }) {
  const answered = checkpoints.filter((c) => c.user_answer !== null);
  const correct = answered.filter((c) => c.user_answer === c.correct_option);
  const incorrect = answered.filter((c) => c.user_answer !== c.correct_option);
  const skipped = checkpoints.filter((c) => c.user_answer === null);
  const score = answered.length > 0 ? Math.round((correct.length / checkpoints.length) * 100) : 0;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 max-w-md mx-auto">
      {/* Score */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-50 mb-3">
          <FiAward className={`text-3xl ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'}`} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Session Complete!</h2>
        <p className="text-4xl font-bold mt-2">
          <span className={score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'}>{correct.length}</span>
          <span className="text-gray-400 text-2xl"> / {checkpoints.length}</span>
        </p>
        <p className="text-gray-500 text-sm mt-1">checkpoints correct ({score}%)</p>
      </div>

      {/* Breakdown */}
      <div className="space-y-2 mb-6">
        {correct.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <FiCheck /> {correct.length} correct
          </div>
        )}
        {incorrect.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
            <FiX /> {incorrect.length} incorrect
            <span className="text-xs text-red-500 ml-auto">
              at {incorrect.map((c) => formatTime(c.timestamp_seconds)).join(', ')}
            </span>
          </div>
        )}
        {skipped.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            {skipped.length} skipped
          </div>
        )}
      </div>

      {/* Actions */}
      {onAskTutor && (
        <button
          onClick={onAskTutor}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition"
        >
          <FiMessageCircle /> Ask the Tutor Questions
        </button>
      )}
    </div>
  );
}
