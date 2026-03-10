export default function ProgressBar({ currentTime, duration, checkpoints }) {
  if (!duration) return null;

  const progress = (currentTime / duration) * 100;

  return (
    <div className="relative w-full h-3 bg-gray-200 rounded-full mt-2 group cursor-pointer">
      {/* Progress fill */}
      <div
        className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />

      {/* Checkpoint markers */}
      {checkpoints && checkpoints.map((cp) => {
        const pos = (cp.timestamp_seconds / duration) * 100;
        let color = 'bg-gray-400';  // not yet reached
        if (cp.user_answer !== null) {
          color = cp.user_answer === cp.correct_option ? 'bg-green-500' : 'bg-red-500';
        } else if (currentTime >= cp.timestamp_seconds) {
          color = 'bg-yellow-500';
        }

        return (
          <div
            key={cp.id}
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${color} rounded-full border-2 border-white shadow-sm transition-all group-hover:scale-110`}
            style={{ left: `${pos}%`, transform: `translateX(-50%) translateY(-50%)` }}
            title={`Checkpoint @ ${Math.floor(cp.timestamp_seconds / 60)}:${(cp.timestamp_seconds % 60).toString().padStart(2, '0')}`}
          />
        );
      })}
    </div>
  );
}
