'use client';

interface VoteButtonsProps {
  voteCount: number;
  onVote: (value: 1 | -1) => void;
  disabled?: boolean;
  userVote?: number | null;
}

export default function VoteButtons({ voteCount, onVote, disabled, userVote }: VoteButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => onVote(1)}
        disabled={disabled}
        className={`text-2xl font-bold transition-all duration-200 ${
          userVote === 1
            ? 'text-emerald-500 scale-125 drop-shadow-lg'
            : 'text-slate-400 hover:text-emerald-500 hover:scale-110'
        } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100`}
        title="Artı oy"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 4l8 8h-6v8h-4v-8H4l8-8z"/>
        </svg>
      </button>
      
      <div className={`text-lg font-bold min-w-[3rem] text-center px-3 py-1 rounded-full ${
        voteCount > 0 
          ? 'text-emerald-600 bg-emerald-50' 
          : voteCount < 0 
          ? 'text-rose-600 bg-rose-50' 
          : 'text-slate-600 bg-slate-50'
      }`}>
        {voteCount > 0 ? '+' : ''}{voteCount}
      </div>
      
      <button
        onClick={() => onVote(-1)}
        disabled={disabled}
        className={`text-2xl font-bold transition-all duration-200 ${
          userVote === -1
            ? 'text-rose-500 scale-125 drop-shadow-lg'
            : 'text-slate-400 hover:text-rose-500 hover:scale-110'
        } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100`}
        title="Eksi oy"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 20l-8-8h6V4h4v8h6l-8 8z"/>
        </svg>
      </button>
    </div>
  );
}
