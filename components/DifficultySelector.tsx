
import React, { useState } from 'react';
import { GameDifficulty, DIFFICULTY_CONFIG, SpotifyTrack } from '../types.ts';

interface Props {
  tracks: SpotifyTrack[];
  loading: boolean;
  onSelect: (diff: GameDifficulty, rounds: number) => void;
  onBack: () => void;
}

const DifficultySelector: React.FC<Props> = ({ tracks, loading, onSelect, onBack }) => {
  const [rounds, setRounds] = useState<number>(10);
  
  const roundOptions = [5, 10, 20];
  if (tracks.length > 20) roundOptions.push(Math.min(tracks.length, 50));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-black uppercase tracking-widest">Loading Playlist...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto flex flex-col p-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
        
        {/* Left: Configuration */}
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Setup Game</h2>
            <p className="text-gray-400">Configure your challenge parameters.</p>
          </div>

          <section>
            <h3 className="text-xs font-black text-[#1DB954] uppercase tracking-[0.3em] mb-4">1. Choose Rounds</h3>
            <div className="flex gap-2">
              {roundOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setRounds(opt)}
                  className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all border-2 ${rounds === opt ? 'bg-[#1DB954] text-black border-[#1DB954]' : 'bg-white/5 text-white border-transparent hover:bg-white/10'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-black text-[#1DB954] uppercase tracking-[0.3em] mb-4">2. Choose Difficulty</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => {
                const diffKey = key as GameDifficulty;
                return (
                  <button
                    key={key}
                    onClick={() => onSelect(diffKey, rounds)}
                    className="group bg-white/5 p-6 rounded-2xl border-2 border-transparent hover:border-[#1DB954] hover:bg-white/10 transition-all flex items-center justify-between text-left"
                  >
                    <div>
                      <h4 className="text-xl font-black uppercase tracking-widest mb-1">{key}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase">{config.label}</p>
                    </div>
                    <div className="text-3xl opacity-50 group-hover:opacity-100 transition-opacity">
                      {diffKey === GameDifficulty.EASY && "☕"}
                      {diffKey === GameDifficulty.PRO && "🔥"}
                      {diffKey === GameDifficulty.LEGEND && "⚡"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            onClick={onBack}
            className="text-gray-500 hover:text-white flex items-center gap-2 transition-colors font-semibold uppercase tracking-widest text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={3}/></svg>
            Change Playlist
          </button>
        </div>

        {/* Right: Track Preview */}
        <div className="w-full md:w-[400px] flex flex-col glass rounded-[2.5rem] border-2 border-white/5 overflow-hidden">
          <div className="p-6 bg-white/5 border-b border-white/5">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Playlist Contents ({tracks.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {tracks.map((track, i) => (
              <div key={track.id + i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <img src={track.album.images[0]?.url} className="w-10 h-10 rounded-md shadow-lg" alt="" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{track.name}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase truncate">{track.artists[0].name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default DifficultySelector;
