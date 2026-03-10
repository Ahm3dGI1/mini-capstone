import { useState } from 'react';
import { FiCheck, FiX, FiPlay } from 'react-icons/fi';

export default function CheckpointModal({ checkpoint, onSubmit, onResume }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const labels = ['A', 'B', 'C', 'D'];

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await onSubmit(checkpoint.id, selected);
      setResult(res);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 animate-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            Checkpoint @ {formatTime(checkpoint.timestamp_seconds)}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{checkpoint.question}</h3>

        {/* Options */}
        <div className="space-y-2 mb-6">
          {checkpoint.options.map((option, i) => {
            const label = labels[i];
            const isSelected = selected === label;
            const isCorrect = result && label === result.correct_option;
            const isWrong = result && isSelected && !result.correct;

            let style = 'border-gray-200 hover:border-primary-300 hover:bg-primary-50';
            if (result) {
              if (isCorrect) style = 'border-green-500 bg-green-50';
              else if (isWrong) style = 'border-red-500 bg-red-50';
              else style = 'border-gray-200 opacity-60';
            } else if (isSelected) {
              style = 'border-primary-500 bg-primary-50 ring-2 ring-primary-200';
            }

            return (
              <button
                key={label}
                disabled={!!result}
                onClick={() => setSelected(label)}
                className={`w-full text-left p-3 rounded-xl border-2 transition flex items-center gap-3 ${style}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isSelected && !result ? 'bg-primary-600 text-white' :
                  isCorrect ? 'bg-green-600 text-white' :
                  isWrong ? 'bg-red-600 text-white' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {result && isCorrect ? <FiCheck /> : result && isWrong ? <FiX /> : label}
                </span>
                <span className="text-sm">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {result && (
          <div className={`p-4 rounded-xl mb-4 ${result.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-semibold text-sm ${result.correct ? 'text-green-800' : 'text-red-800'}`}>
              {result.correct ? '✓ Correct!' : '✗ Incorrect'}
            </p>
            <p className="text-sm text-gray-700 mt-1">{result.explanation}</p>
          </div>
        )}

        {/* Actions */}
        {!result ? (
          <button
            onClick={handleSubmit}
            disabled={!selected || submitting}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        ) : (
          <button
            onClick={onResume}
            className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <FiPlay /> Resume Video
          </button>
        )}
      </div>
    </div>
  );
}
