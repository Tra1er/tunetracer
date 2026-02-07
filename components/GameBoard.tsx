
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpotifyPlaylist, SpotifyTrack, GameDifficulty, DIFFICULTY_CONFIG, GameResult } from '../types.ts';
import { spotifyService } from '../services/spotifyService.ts';
import { GoogleGenAI } from "@google/genai";

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
  const [scanStats, setScanStats] = useState({ scanned: 0, found: 0 });
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
  const [aiClue, setAiClue] = useState<string | null>(null);
  const [clueLoading, setClueLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const config = DIFFICULTY_CONFIG[difficulty];
  const totalRounds = 10;

  const loadTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedTracks = await spotifyService.getPlaylistTracks(
        token, 
        playlist.id, 
        (scanned, found) => setScanStats({ scanned, found })
      );

      if (fetchedTracks.length < 4) {
        setError("This playlist is too small or restricted. Please try a different one.");
        setLoading(false);
        return;
      }
      setTracks(fetchedTracks);
      setLoading(false);
    } catch (err) {
      setError("Failed to connect to Spotify. If you're using a different account, ensure it's whitelisted in the Developer Dashboard.");
      setLoading(false);
    }
  }, [token, playlist.id]);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  const getAiClue = async (track: SpotifyTrack) => {
    setClueLoading(true);
    setAiClue(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Describe the musical style, mood, instruments, and famous elements of the song "${track.name}" by "${track.artists[0].name}" in 2 sentences. DO NOT mention the song title or artist name in your description. Start directly with the description.`,
      });
      setAiClue(response.text || "No description available.");
    } catch (e) {
      setAiClue("A mysterious track with a unique sound...");
    } finally {
      setClueLoading(false);
    }
  };

  const startNextRound = useCallback(async () => {
    if (round > totalRounds) {
      onGameOver({ score, streak, correctAnswers: correctCount, missedTracks });
      return;
    }

    // Prefer tracks with previews, but use AI fallback if none available
    const availablePool = tracks.length > 10 ? tracks : tracks; 
    const correct = availablePool[Math.floor(Math.random() * availablePool.length)];
    
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
    setAiClue(null);

    if (correct.preview_url) {
      if (audioRef.current) {
        audioRef.current.src = correct.preview_url;
        audioRef.current.play().catch(() => {
          // If audio fails to play, fallback to AI description
          getAiClue(correct);
        });
      }
    } else {
      // No audio? Get AI clue immediately
      getAiClue(correct);
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
    }, 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="relative w-32 h-32 mb-10">
           <div className="absolute inset-0 border-[6px] border-[#1DB954]/10 rounded-full"></div>
           <div className="absolute inset-0 border-[6px] border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">Synchronizing</h2>
        <p className="text-gray-400 font-medium mb-8 max-w-xs leading-relaxed">
          Downloading metadata and checking regional audio availability...
        </p>
        <button onClick={onCancel} className="text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest">Cancel</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
        <div className="bg-black/40 border-2 border-red-500/30 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl">
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Access Error</h2>
          <p className="text-gray-400 mb-8 leading-relaxed text-lg">{error}</p>
          <button 
            onClick={onCancel}
            className="w-full py-5 bg-[#1DB954] text-black font-black text-xl rounded-2xl hover:scale-105 transition-transform"
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
          <span className={`text-4xl font-black transition-colors ${streak > 0 ? 'text-yellow-400' : 'text-gray-700'}`}>{streak}</span>
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
                <img src={currentTrack?.album.images[0].url} alt="Album Art" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center border-2 border-white/10">
                   {clueLoading ? (
                     <div className="animate-pulse space-y-4 w-full">
                       <div className="h-4 bg-white/10 rounded w-full"></div>
                       <div className="h-4 bg-white/10 rounded w-3/4 mx-auto"></div>
                     </div>
                   ) : aiClue ? (
                     <div className="animate-[fadeIn_0.5s_ease-out]">
                       <span className="text-[#1DB954] text-xs font-black uppercase tracking-widest block mb-4">AI Musical Clue:</span>
                       <p className="text-lg font-medium text-gray-200 italic leading-relaxed">"{aiClue}"</p>
                     </div>
                   ) : (
                     <>
                      <div className="flex gap-1 items-end h-12 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-1.5 bg-[#1DB954] rounded-full animate-[bounce_1s_infinite]" style={{ height: `${30 + Math.random() * 70}%`, animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                      </div>
                      <p className="text-[#1DB954] font-black uppercase tracking-[0.2em] text-xs">Audio Stream Active</p>
                     </>
                   )}
                </div>
              )}
            </div>
            
            {isAnswered && (
              <div className="mt-6 text-center animate-[fadeIn_0.5s_ease-out]">
                <h3 className="text-xl font-black text-white truncate">{currentTrack?.name}</h3>
                <p className="text-gray-400 font-bold truncate">{currentTrack?.artists[0].name}</p>
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
                  disabled={isAnswered}
                  onClick={() => handleAnswer(option.id)}
                  className={`group relative p-6 rounded-2xl transition-all flex items-center gap-4 text-left font-bold ${btnClass} transform ${!isAnswered && 'hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  <span className="text-lg truncate">{option.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
