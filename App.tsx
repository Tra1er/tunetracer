
import React, { useState, useEffect } from 'react';
import { SpotifyPlaylist, GameDifficulty, GameResult, SpotifyTrack } from './types.ts';
import Auth from './components/Auth.tsx';
import PlaylistSelector from './components/PlaylistSelector.tsx';
import GameBoard from './components/GameBoard.tsx';
import GameOver from './components/GameOver.tsx';
import DifficultySelector from './components/DifficultySelector.tsx';
import { SPOTIFY_CLIENT_ID, REDIRECT_URI } from './constants.ts';
import { audioService } from './services/audioService.ts';
import { spotifyService } from './services/spotifyService.ts';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('spotify_token'));
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [difficulty, setDifficulty] = useState<GameDifficulty | null>(null);
  const [rounds, setRounds] = useState<number>(10);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loadingTracks, setLoadingTracks] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');

    if (code) {
      exchangeCodeForToken(code);
      window.history.replaceState(null, '', window.location.pathname);
    } else if (error) {
      setAuthError(error);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    const codeVerifier = localStorage.getItem('code_verifier');
    
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          code_verifier: codeVerifier || '',
        }),
      });

      const data = await response.json();
      if (data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('spotify_token', data.access_token);
        setAuthError(null);
        setIsDemoMode(false);
      } else {
        setAuthError(data.error_description || 'Failed to get token');
      }
    } catch (err) {
      setAuthError('Network error during token exchange');
    }
  };

  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    setLoadingTracks(true);
    try {
      let tracks: SpotifyTrack[] = [];
      if (isDemoMode) {
        tracks = await audioService.getTopHits();
      } else if (token) {
        tracks = await spotifyService.getPlaylistTracks(token, playlist.id);
      }
      setPlaylistTracks(tracks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleStartGame = (diff: GameDifficulty, roundCount: number) => {
    setDifficulty(diff);
    setRounds(roundCount);
    setGameStarted(true);
  };

  const handleGameOver = (result: GameResult) => {
    setGameResult(result);
    setGameStarted(false);
  };

  const resetGame = () => {
    setGameResult(null);
    setSelectedPlaylist(null);
    setPlaylistTracks([]);
    setDifficulty(null);
    setGameStarted(false);
  };

  const startDemoMode = async () => {
    setIsDemoMode(true);
    setToken("DEMO_MODE");
    const demoPlaylist: SpotifyPlaylist = {
      id: 'demo-global-hits',
      name: 'Global Top Hits (Demo)',
      images: [{ url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop' }],
      tracks: { total: 50 }
    };
    handlePlaylistSelect(demoPlaylist);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('spotify_token');
    setIsDemoMode(false);
    window.location.search = '';
  };

  if (!token) return <Auth error={authError} onDemoMode={startDemoMode} />;

  if (gameResult) {
    return <GameOver result={gameResult} onRestart={resetGame} />;
  }

  if (gameStarted && selectedPlaylist && difficulty) {
    return (
      <GameBoard 
        token={token} 
        playlist={selectedPlaylist} 
        initialTracks={playlistTracks}
        difficulty={difficulty} 
        totalRounds={rounds}
        onGameOver={handleGameOver} 
        onCancel={resetGame}
        isDemo={isDemoMode}
      />
    );
  }

  if (selectedPlaylist && !difficulty) {
    return (
      <DifficultySelector 
        tracks={playlistTracks}
        loading={loadingTracks}
        onSelect={handleStartGame} 
        onBack={() => {
          setSelectedPlaylist(null);
          setPlaylistTracks([]);
          if (isDemoMode && token === "DEMO_MODE") logout();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <header className="mb-12 text-center animate-[fadeIn_0.5s_ease-out]">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter">TuneTracer</h1>
        <p className="text-gray-400 font-medium">Pick a playlist to start the challenge</p>
      </header>
      <PlaylistSelector token={token} onSelect={handlePlaylistSelect} />
      <button 
        onClick={logout}
        className="mt-12 text-gray-500 hover:text-white transition-colors text-sm font-semibold uppercase tracking-widest"
      >
        {isDemoMode ? "Exit Quick Play" : "Logout"}
      </button>
    </div>
  );
};

export default App;
