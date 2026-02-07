
import React from 'react';
import { GameResult } from '../types.ts';

interface Props {
  result: GameResult;
  onRestart: () => void;
}

const GameOver: React.FC<Props> = ({ result, onRestart }) => {
  const shareScore = () => {
    const text = `I just scored ${result.score.toLocaleString()} points on TuneTracer! 🎵🔥 Can you beat me?`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-4xl glass rounded-[40px] p-8 md:p-16 text-center border-2 border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 spotify-gradient"></div>
        
        <h2 className="text-sm font-black text-[#1DB954] uppercase tracking-[0.5em] mb-4">Challenge Complete</h2>
        <h1 className="text-7xl font-black text-white mb-8 tracking-tighter">GAME OVER</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col p-6 bg-white/5 rounded-3xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Final Score</span>
            <span className="text-4xl font-black text-white tabular-nums">{result.score.toLocaleString()}</span>
          </div>
          <div className="flex flex-col p-6 bg-white/5 rounded-3xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Accuracy</span>
            <span className="text-4xl font-black text-[#1DB954]">{result.correctAnswers} / 10</span>
          </div>
          <div className="flex flex-col p-6 bg-white/5 rounded-3xl">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Best Streak</span>
            <span className="text-4xl font-black text-yellow-500">{result.streak}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={onRestart}
            className="w-full sm:w-auto px-12 py-5 bg-white text-black text-lg font-black rounded-full hover:scale-105 transition-transform active:scale-95"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={shareScore}
            className="w-full sm:w-auto px-12 py-5 bg-[#1DA1F2] text-white text-lg font-black rounded-full hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            SHARE SCORE
          </button>
        </div>

        {result.missedTracks.length > 0 && (
          <div className="text-left w-full">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
              <span className="bg-red-500 w-2 h-8 rounded-full"></span>
              The Ones You Missed
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.missedTracks.map((track, i) => (
                <div key={`${track.id}-${i}`} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                  <img src={track.album.images[0].url} alt="" className="w-14 h-14 rounded-lg flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-white truncate">{track.name}</p>
                    <p className="text-xs text-gray-500 font-bold truncate">{track.artists[0].name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default GameOver;
