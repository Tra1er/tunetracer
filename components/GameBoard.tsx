
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpotifyPlaylist, SpotifyTrack, GameDifficulty, DIFFICULTY_CONFIG, GameResult } from '../types.ts';
import { audioService } from '../services/audioService.ts';

interface Props {
  token: string;
  playlist: SpotifyPlaylist;
  initialTracks: SpotifyTrack[];
  difficulty: GameDifficulty;
  totalRounds: number;
  onGameOver: (result: GameResult) => void;
  onCancel: () => void;
  isDemo?: boolean;
}

const GameBoard: React.FC<Props> = ({ initialTracks, difficulty, totalRounds, onGameOver, onCancel }) => {
  const [tracks] = useState<SpotifyTrack[]>(() => [...initialTracks].sort(() => Math.random() - 0.5));
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
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];

  const startNextRound = useCallback(async () => {
    if (round > totalRounds) {
      onGameOver({ score, streak, correctAnswers: correctCount, missedTracks });
      return;
    }

    // Pick a track that hasn't been used yet to avoid repetition
    let trackIndex = Math.floor(Math.random() * tracks.length);
    let attempts = 0;
    while (usedIndices.has(trackIndex) && attempts < tracks.length) {
      trackIndex = (trackIndex + 1) % tracks.length;
      attempts++;
    }
    
    setUsedIndices(prev => new Set(prev).add(trackIndex));
    const correct = tracks[trackIndex];
    
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
    setLoadingAudio(true);

    let previewUrl = correct.preview_url;
    if (!previewUrl) {
      previewUrl = await audioService.getPreviewUrl(correct.name, correct.artists[0].name);
    }

    if (previewUrl && audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.play().then(() => {
        setLoadingAudio(false);
        startTimer();
      }).catch(() => {
        setLoadingAudio(false);
        handleAnswer(null); 
      });
    } else {
      setLoadingAudio(false);
      setRound(prev => prev + 1);
      startNextRound();
    }

  }, [round, tracks, config.duration, score, streak, correctCount, missedTracks, onGameOver, totalRounds, usedIndices]);

  const startTimer = () => {
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
  };

  useEffect(() => {
    if (tracks.length > 0 && !currentTrack) {
      startNextRound();
    }
  }, [tracks, currentTrack, startNextRound]);

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

  const progressPercent = (timeLeft / config.duration) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      
      <div className="w-full flex justify-between items-end mb-8">
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Round</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{round}</span>
            <span className="text-xl text-gray-600 font-bold">/ {totalRounds}</span>
          </div>
        </div>

        <div className="flex flex-col items-center glass px-8 py-3 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1DB954]">Score</span>
          <span className="text-4xl font-black text-white tabular-nums">{score.toLocaleString()}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Streak</span>
          <span className={`text-4xl font-black ${streak > 0 ? 'text-yellow-400' : 'text-gray-700'}`}>{streak}</span>
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
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
            <div className={`w-full h-full relative rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 transform ${isAnswered ? 'scale-100' : 'scale-90 bg-[#181818]'}`}>
              {isAnswered ? (
                <img src={currentTrack?.album.images[0].url} alt="Album Art" className="w-full h-full object-cover animate-[fadeIn_0.3s_ease-out]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center border-2 border-white/10">
                   {loadingAudio ? (
                      <div className="w-12 h-12 border-4 border-white/10 border-t-[#1DB954] rounded-full animate-spin"></div>
                   ) : (
                     <div className="flex gap-2 items-end h-16">
                       {[...Array(5)].map((_, i) => (
                         <div key={i} className="w-2 bg-[#1DB954] rounded-full animate-[bounce_1s_infinite]" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }}></div>
                       ))}
                     </div>
                   )}
                </div>
              )}
            </div>
            
            {isAnswered && (
              <div className="mt-6 text-center animate-[fadeIn_0.5s_ease-out]">
                <h3 className="text-2xl font-black text-white truncate">{currentTrack?.name}</h3>
                <p className="text-gray-400 font-bold text-lg">{currentTrack?.artists[0].name}</p>
              </div>
            )}
          </div>

          <div className="flex-1 w-full grid grid-cols-1 gap-4">
            {options.map((option) => {
              const isCorrect = option.id === currentTrack?.id;
              const isSelected = option.id === selectedId;
              let btnClass = "bg-white/5 border-2 border-white/5 hover:bg-white/10";
              
              if (isAnswered) {
                if (isCorrect) btnClass = "bg-[#1DB954] border-[#1DB954] text-black shadow-lg";
                else if (isSelected) btnClass = "bg-red-500 border-red-500 text-white";
                else btnClass = "opacity-30 grayscale";
              }

              return (
                <button
                  key={option.id}
                  disabled={isAnswered || loadingAudio}
                  onClick={() => handleAnswer(option.id)}
                  className={`group relative p-6 rounded-2xl transition-all flex items-center gap-4 text-left font-bold ${btnClass} transform ${!isAnswered && !loadingAudio && 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  <span className="text-lg truncate">{option.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={onCancel} className="mt-12 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
        End Game
      </button>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default GameBoard;
