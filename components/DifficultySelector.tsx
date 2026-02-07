
import React from 'react';
import { GameDifficulty, DIFFICULTY_CONFIG } from '../types.ts';

interface Props {
  onSelect: (diff: GameDifficulty) => void;
  onBack: () => void;
}

const DifficultySelector: React.FC<Props> = ({ onSelect, onBack }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Choose Your Challenge</h2>
      <p className="text-gray-400 mb-12 max-w-md mx-auto">Shorter snippets earn higher point multipliers. How sharp are your ears?</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => {
          const diffKey = key as GameDifficulty;
          let bgColor = "bg-gray-800 hover:bg-[#1DB954]";
          
          if (diffKey === GameDifficulty.PRO) bgColor = "bg-gray-800 hover:bg-yellow-500";
          if (diffKey === GameDifficulty.LEGEND) bgColor = "bg-gray-800 hover:bg-red-500";
          
          return (
            <button
              key={key}
              onClick={() => onSelect(diffKey)}
              className={`group ${bgColor} p-8 rounded-3xl transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center gap-4 text-white`}
            >
              <div className="text-4xl">
                {diffKey === GameDifficulty.EASY && "☕"}
                {diffKey === GameDifficulty.PRO && "🔥"}
                {diffKey === GameDifficulty.LEGEND && "⚡"}
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest">{key}</h3>
              <p className="text-sm font-bold bg-black/20 py-1 px-4 rounded-full">{config.label}</p>
              <p className="text-xs opacity-70 mt-2 font-medium">
                {diffKey === GameDifficulty.EASY && "Relaxed listening."}
                {diffKey === GameDifficulty.PRO && "The gold standard."}
                {diffKey === GameDifficulty.LEGEND && "Split-second recognition."}
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        className="mt-12 text-gray-500 hover:text-white flex items-center gap-2 transition-colors font-semibold"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Playlists
      </button>
    </div>
  );
};

export default DifficultySelector;
