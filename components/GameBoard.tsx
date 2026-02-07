
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpotifyPlaylist, SpotifyTrack, GameDifficulty, DIFFICULTY_CONFIG, GameResult } from '../types.ts';
import { spotifyService } from '../services/spotifyService.ts';

interface Props {
  token: string;
  playlist: SpotifyPlaylist;
  difficulty: GameDifficulty;
  onGameOver: (result: GameResult) => void;
  onCancel: () => void;
}

const GameBoard: React.FC<Props> = ({ token, playlist, difficulty, onGameOver, onCancel }) => {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [options, setOptions] = useState<SpotifyTrack[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DIFFICULTY_CONFIG[difficulty].duration);
  const [isAnswered, setIsAnswered] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [missedTracks, setMissedTracks] = useState<SpotifyTrack[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [round, setRound] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];
  const totalRounds = 10;

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTracks = await spotifyService.getPlaylistTracks(token, playlist.id);
      if (fetchedTracks.length < 4) {
        setError("This playlist doesn't have enough tracks with audio previews. Spotify restricts previews for some songs.");
        setLoading(false);
        return;
      }
      setTracks(fetchedTracks);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load tracks. Please check your connection.");
      setLoading(false);
    }
  }, [token, playlist.id]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const startNextRound = useCallback(() => {
    if (round > totalRounds) {
      onGameOver({ score, streak, correctAnswers: correctCount, missedTracks });
      return;
    }

    const availableTracks = tracks.filter(t => t.preview_url);
    const correct = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    
    const decoys = tracks
      .filter(t => t.id !== correct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const shuffledOptions = [correct, ...decoys].sort(() => Math.random() - 0.5);

    setCurrentTrack(correct);
    setOptions(shuffledOptions);
    setTimeLeft(config.duration);
    setIsAnswered(false);
    setSelectedId(null);

    if (audioRef.current) {
      audioRef.current.src = correct.preview_url!;
      audioRef.current.play().catch(e => console.warn("Autoplay blocked", e));
    }

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          handleAnswer(null); 
          return 0;
        }
        return prev - 0.1;
      });
    }, 100) as unknown as number;

  }, [round, tracks, config.duration, score, streak, correctCount, missedTracks, onGameOver]);

  useEffect(() => {
    if (!loading && !error && tracks.length > 0 && !currentTrack) {
      startNextRound();
    }
  }, [loading, error, tracks, currentTrack, startNextRound]);

  const handleAnswer = (trackId: string | null) => {
    if (isAnswered) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedId(trackId);
    
    if (audioRef.current) audioRef.current.pause();

    const isCorrect = trackId === currentTrack?.id;
    
    if (isCorrect) {
      const multiplier = Math.floor(streak / 3) + 1;
      const roundScore = Math.floor(timeLeft * 100 * multiplier);
      setScore(prev => prev + roundScore);
      setStreak(prev => prev + 1);
      setCorrectCount(prev => prev + 1);
    } else {
      setStreak(0);
      if (currentTrack) setMissedTracks(prev => [...prev, currentTrack]);
    }

    setTimeout(() => {
      setRound(prev => prev + 1);
      startNextRound();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-[#1DB954]/20 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-3xl font-black mb-2 animate-pulse tracking-tighter uppercase">Scanning Library</h2>
        <p className="text-gray-500 font-medium">Hunting for playable audio previews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[2.5rem] backdrop-blur-xl">
          <div className="text-6xl mb-6">🔇</div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">Incompatible Playlist</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {error}
          </p>
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-white text-black font-black rounded-2xl hover:scale-105 transition-transform active:scale-95"
          >
            TRY ANOTHER PLAYLIST
          </button>
        </div>
      </div>
    );
  }

  const multiplier = Math.floor(streak / 3) + 1;
  const progressPercent = (timeLeft / config.duration) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      
      <div className="w-full flex justify-between items-end mb-8">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Round</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{round}</span>
            <span className="text-xl text-gray-600 font-bold">/ {totalRounds}</span>
          </div>
        </div>

        <div className="flex flex-col items-center glass px-6 py-3 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1DB954] mb-1">Score</span>
          <span className="text-4xl font-black text-white tabular-nums">{score.toLocaleString()}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Streak</span>
          <div className="flex items-center gap-2">
            <span className={`text-4xl font-black transition-colors ${streak > 0 ? 'text-yellow-400' : 'text-gray-700'}`}>{streak}</span>
            {multiplier > 1 && (
              <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-black animate-pulse">x{multiplier}</span>
            )}
          </div>
        </div>
      </div>

      <div className="w-full relative glass rounded-[40px] p-8 md:p-12 overflow-hidden border-2 border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 bg-white/5">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${timeLeft < 3 ? 'bg-red-500' : 'bg-[#1DB954]'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0 group">
            <div className={`absolute -inset-4 bg-[#1DB954] rounded-[3rem] opacity-20 blur-3xl transition-opacity duration-500 ${!isAnswered ? 'animate-pulse' : 'opacity-0'}`}></div>
            
            <div className={`w-full h-full relative rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 transform ${isAnswered ? 'scale-100 rotate-0' : 'scale-90'}`}>
              {isAnswered ? (
                <img 
                  src={currentTrack?.album.images[0].url} 
                  alt="Album Art" 
                  className="w-full h-full object-cover animate-[pop_0.5s_ease-out]"
                />
              ) : (
                <div className="w-full h-full bg-[#181818] flex flex-col items-center justify-center p-8 text-center border-2 border-white/10">
                  <div className="flex gap-1 items-end h-12 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1.5 bg-[#1DB954] rounded-full animate-[bounce_1s_infinite]`} style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>
                    ))}
                  </div>
                  <p className="text-[#1DB954] font-black uppercase tracking-[0.2em] text-xs">Listening...</p>
                </div>
              )}
            </div>
            
            {isAnswered && (
              <div className="mt-6 text-center lg:text-left animate-[fadeIn_0.5s_ease-out]">
                <h3 className="text-xl font-black text-white leading-tight mb-1">{currentTrack?.name}</h3>
                <p className="text-gray-400 font-bold">{currentTrack?.artists.map(a => a.name).join(', ')}</p>
              </div>
            )}
          </div>

          <div className="flex-1 w-full grid grid-cols-1 gap-4">
            {options.map((option) => {
              const isCorrect = option.id === currentTrack?.id;
              const isSelected = option.id === selectedId;
              
              let btnClass = "bg-white/5 border-2 border-white/5 hover:bg-white/10 hover:border-white/20";
              if (isAnswered) {
                if (isCorrect) btnClass = "bg-[#1DB954] border-[#1DB954] text-black shadow-[0_0_30px_rgba(29,185,84,0.3)]";
                else if (isSelected) btnClass = "bg-red-500 border-red-500 text-white";
                else btnClass = "opacity-30 border-transparent grayscale";
              }

              return (
                <button
                  key={option.id}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(option.id)}
                  className={`group relative p-6 rounded-2xl transition-all flex items-center gap-4 text-left font-bold ${btnClass} transform ${!isAnswered && 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 ${isAnswered && isCorrect ? 'bg-black/20 border-black/20' : 'bg-white/5 border-white/10'}`}>
                    {isAnswered && isCorrect && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-lg truncate">{option.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button 
        onClick={onCancel}
        className="mt-12 text-gray-500 hover:text-white transition-colors text-sm font-semibold uppercase tracking-[0.2em]"
      >
        Quit Session
      </button>

      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default GameBoard;
