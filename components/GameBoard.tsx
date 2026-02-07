
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
}

const GameBoard: React.FC<Props> = ({ token, initialTracks, difficulty, totalRounds, onGameOver, onCancel }) => {
  // Use the larger pool and shuffle it immediately
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
  
  // Track used indices to guarantee no repetition
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const config = DIFFICULTY_CONFIG[difficulty];

  const startNextRound = useCallback(async () => {
    if (round > totalRounds) {
      onGameOver({ score, streak, correctAnswers: correctCount, missedTracks });
      return;
    }

    // Pick a guaranteed fresh track from our 100-song pool
    let trackIndex = Math.floor(Math.random() * tracks.length);
    let attempts = 0;
    while (usedIndices.has(trackIndex) && attempts < tracks.length) {
      trackIndex = (trackIndex + 1) % tracks.length;
      attempts++;
    }
    
    // If we've somehow exhausted everything (unlikely with 100 tracks), reset pool
    if (usedIndices.size >= tracks.length) {
      setUsedIndices(new Set());
    } else {
      setUsedIndices(prev => new Set(prev).add(trackIndex));
    }

    const correct = tracks[trackIndex];
    
    // Pick 3 random decoys that are NOT the correct track
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

    // MULTI-STAGE AUDIO SEARCH (The "Finder" Logic)
    let previewUrl = null;

    // Stage 1: Check if the track object already has it
    if (correct.preview_url) {
      previewUrl = correct.preview_url;
    }

    // Stage 2: Spotify Finder Search (Mimicking spotify-preview-finder package)
    if (!previewUrl && token) {
      previewUrl = await audioService.findSpotifyPreview(correct.name, correct.artists[0].name, token);
    }

    // Stage 3: iTunes Public API Fallback
    if (!previewUrl) {
      previewUrl = await audioService.getItunesPreview(correct.name, correct.artists[0].name);
    }

    if (previewUrl && audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.play().then(() => {
        setLoadingAudio(false);
        startTimer();
      }).catch((e) => {
        console.warn("Audio play failed, skipping round", e);
        setLoadingAudio(false);
        handleAnswer(null); 
      });
    } else {
      // If absolutely no audio is found after all stages, skip this song automatically
      setRound(prev => prev + 1);
      startNextRound();
    }

  }, [round, tracks, config.duration, score, streak, correctCount, missedTracks, onGameOver, totalRounds, usedIndices, token]);

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

    // Delay slightly before next round so user sees result
    setTimeout(() => {
      setRound(prev => prev + 1);
      startNextRound();
    }, 2000);
  };

  const progressPercent = (timeLeft / config.duration) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      
      {/* Stats Bar */}
      <div className="w-full flex justify-between items-end mb-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-1">Round</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">{round}</span>
            <span className="text-xl text-gray-600 font-bold">/ {totalRounds}</span>
          </div>
        </div>

        <div className="flex flex-col items-center glass px-12 py-4 rounded-[2rem] border-2 border-white/5 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#1DB954] mb-1">Score</span>
          <span className="text-5xl font-black text-white tabular-nums">{score.toLocaleString()}</span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-1">Streak</span>
          <span className={`text-5xl font-black transition-colors ${streak > 0 ? 'text-yellow-400' : 'text-gray-700'}`}>{streak}</span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="w-full relative glass rounded-[4rem] p-8 md:p-16 overflow-hidden border-2 border-white/5 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-3 bg-white/5">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${timeLeft < 3 ? 'bg-red-500' : 'bg-[#1DB954]'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Audio Visualizer / Album Art Area */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 flex-shrink-0">
            <div className={`w-full h-full relative rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-1000 transform ${isAnswered ? 'scale-100 rotate-0' : 'scale-90 -rotate-2 bg-[#181818]'}`}>
              {isAnswered ? (
                <img src={currentTrack?.album.images[0].url} alt="Album Art" className="w-full h-full object-cover animate-[fadeIn_0.4s_ease-out]" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center border-2 border-white/5">
                   {loadingAudio ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-white/5 border-t-[#1DB954] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Searching Spotify...</p>
                      </div>
                   ) : (
                     <div className="flex gap-3 items-end h-24">
                       {[...Array(6)].map((_, i) => (
                         <div key={i} className="w-3 bg-[#1DB954] rounded-full animate-[bounce_1.2s_infinite]" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}></div>
                       ))}
                     </div>
                   )}
                </div>
              )}
            </div>
            
            {isAnswered && (
              <div className="mt-8 text-center animate-[pop_0.4s_ease-out]">
                <h3 className="text-3xl font-black text-white truncate leading-tight">{currentTrack?.name}</h3>
                <p className="text-gray-400 font-bold text-xl mt-1">{currentTrack?.artists[0].name}</p>
              </div>
            )}
          </div>

          {/* Options Grid */}
          <div className="flex-1 w-full grid grid-cols-1 gap-5">
            {options.map((option) => {
              const isCorrect = option.id === currentTrack?.id;
              const isSelected = option.id === selectedId;
              let btnClass = "bg-white/5 border-2 border-white/5 hover:bg-white/10 hover:scale-[1.02]";
              
              if (isAnswered) {
                if (isCorrect) btnClass = "bg-[#1DB954] border-[#1DB954] text-black shadow-lg scale-105 z-10";
                else if (isSelected) btnClass = "bg-red-500 border-red-500 text-white opacity-100";
                else btnClass = "opacity-20 grayscale scale-95 pointer-events-none";
              }

              return (
                <button
                  key={option.id}
                  disabled={isAnswered || loadingAudio}
                  onClick={() => handleAnswer(option.id)}
                  className={`group relative p-8 rounded-[2rem] transition-all flex items-center gap-6 text-left font-black ${btnClass} transform active:scale-95`}
                >
                  <span className="text-xl md:text-2xl truncate w-full">{option.name}</span>
                  {isAnswered && isCorrect && <span className="text-3xl">✅</span>}
                  {isAnswered && !isCorrect && isSelected && <span className="text-3xl">❌</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button onClick={onCancel} className="mt-16 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.5em]">
        End Session
      </button>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pop { 
          0% { opacity: 0; transform: scale(0.8); } 
          70% { transform: scale(1.05); } 
          100% { opacity: 1; transform: scale(1); } 
        }
      `}</style>
    </div>
  );
};

export default GameBoard;
