
import React, { useEffect, useState } from 'react';
import { spotifyService } from '../services/spotifyService.ts';
import { SpotifyPlaylist } from '../types.ts';

interface Props {
  token: string;
  onSelect: (playlist: SpotifyPlaylist) => void;
}

const PlaylistSelector: React.FC<Props> = ({ token, onSelect }) => {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    spotifyService.getUserPlaylists(token)
      .then(setPlaylists)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl aspect-square"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
      {playlists.map((playlist) => (
        <button
          key={playlist.id}
          onClick={() => onSelect(playlist)}
          className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-2xl transition-all hover:-translate-y-2 text-left flex flex-col items-start shadow-xl border border-transparent hover:border-white/10"
        >
          <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-xl shadow-lg">
            {playlist.images?.[0]?.url ? (
              <img 
                src={playlist.images[0].url} 
                alt={playlist.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="font-bold text-white truncate w-full mb-1 group-hover:text-[#1DB954] transition-colors">{playlist.name}</h3>
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-tighter">{playlist.tracks.total} tracks</p>
        </button>
      ))}
    </div>
  );
};

export default PlaylistSelector;
