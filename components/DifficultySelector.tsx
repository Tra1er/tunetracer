
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
        <h2 className="text-2xl font-black uppercase tracking-widest">Gathering Tracks...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto flex flex-col p-4 md:p-8 animate-[fadeIn_0.4s_ease-out]">
      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        
        {/* Left: Configuration */}
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div>
            <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">BATTLE ROOM</h2>
            <p className="text-gray-400 font-medium">Fine-tune your challenge parameters.</p>
          </div>

          <section>
            <h3 className="text-[10px] font-black text-[#1DB954] uppercase tracking-[0.4em] mb-4">Round Count</h3>
            <div className="flex flex-wrap gap-2">
              {roundOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setRounds(opt)}
                  className={`px-8 py-4 rounded-2xl font-black text-lg transition-all border-2 ${rounds === opt ? 'bg-[#1DB954] text-black border-[#1DB954] scale-105' : 'bg-white/5 text-white border-white/5 hover:bg-white/10'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-[#1DB954] uppercase tracking-[0.4em] mb-4">Choose Difficulty</h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => {
                const diffKey = key as GameDifficulty;
                return (
                  <button
                    key={key}
                    onClick={() => onSelect(diffKey, rounds)}
                    className="group bg-white/5 p-6 rounded-[2rem] border-2 border-transparent hover:border-[#1DB954] hover:bg-white/10 transition-all flex items-center justify-between text-left shadow-xl"
                  >
                    <div>
                      <h4 className="text-2xl font-black uppercase tracking-widest mb-1">{key}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{config.label}</p>
                    </div>
                    <div className="text-4xl opacity-40 group-hover:opacity-100 transition-opacity">
                      {diffKey === GameDifficulty.EASY && "⭐"}
                      {diffKey === GameDifficulty.PRO && "🔥"}
                      {diffKey === GameDifficulty.LEGEND && "👑"}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <button
            onClick={onBack}
            className="text-gray-500 hover:text-white flex items-center gap-3 transition-colors font-black uppercase tracking-widest text-xs mt-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeWidth={3}/></svg>
            Change Playlist
          </button>
        </div>

        {/* Right: Track Preview */}
        <div className="w-full lg:w-[450px] flex flex-col glass rounded-[3rem] border-2 border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 bg-white/5 border-b border-white/5">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Playlist Pool ({tracks.length})</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {tracks.map((track, i) => (
              <div key={track.id + i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className="relative">
                  <img src={track.album.images[0]?.url} className="w-12 h-12 rounded-xl shadow-lg group-hover:scale-105 transition-transform" alt="" />
                  <span className="absolute -top-2 -left-2 bg-black/80 text-[10px] font-black px-2 py-0.5 rounded-full border border-white/10 text-gray-400">{i + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">{track.name}</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{track.artists[0].name}</p>
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
