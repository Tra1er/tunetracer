
import React, { useState, useEffect } from 'react';
import { SpotifyPlaylist, GameDifficulty, GameResult } from './types.ts';
import Auth from './components/Auth.tsx';
import PlaylistSelector from './components/PlaylistSelector.tsx';
import GameBoard from './components/GameBoard.tsx';
import GameOver from './components/GameOver.tsx';
import DifficultySelector from './components/DifficultySelector.tsx';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const error = params.get('error');

      if (accessToken) {
        setToken(accessToken);
        setAuthError(null);
        window.history.replaceState(null, '', window.location.pathname);
      } else if (error) {
        setAuthError(error);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handlePlaylistSelect = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
  };

  const handleDifficultySelect = (diff: GameDifficulty) => {
    setDifficulty(diff);
    setGameStarted(true);
  };

  const handleGameOver = (result: GameResult) => {
    setGameResult(result);
    setGameStarted(false);
  };

  const resetGame = () => {
    setGameResult(null);
    setSelectedPlaylist(null);
    setDifficulty(null);
    setGameStarted(false);
  };

  if (!token) return <Auth error={authError} />;

  if (gameResult) {
    return <GameOver result={gameResult} onRestart={resetGame} />;
  }

  if (gameStarted && selectedPlaylist && difficulty) {
    return (
      <GameBoard 
        token={token} 
        playlist={selectedPlaylist} 
        difficulty={difficulty} 
        onGameOver={handleGameOver} 
        onCancel={resetGame}
      />
    );
  }

  if (selectedPlaylist && !difficulty) {
    return <DifficultySelector onSelect={handleDifficultySelect} onBack={() => setSelectedPlaylist(null)} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">TuneTracer</h1>
        <p className="text-gray-400 font-medium">Select a playlist to start the challenge</p>
      </header>
      <PlaylistSelector token={token} onSelect={handlePlaylistSelect} />
      <button 
        onClick={() => { setToken(null); window.location.hash = ''; }}
        className="mt-12 text-gray-500 hover:text-white transition-colors text-sm font-semibold uppercase tracking-widest"
      >
        Logout
      </button>
    </div>
  );
};

export default App;
