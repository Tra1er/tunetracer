
import React, { useEffect, useState } from 'react';
import { spotifyService } from '../services/spotifyService.ts';
import { SpotifyPlaylist } from '../types.ts';

interface Props {
  token: string;
  onSelect: (playlist: SpotifyPlaylist) => void;
}

const PlaylistSelector: React.FC<Props> = ({ token, onSelect }) => {
  const [userPlaylists, setUserPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      spotifyService.getUserPlaylists(token),
      spotifyService.getFeaturedPlaylists(token)
    ]).then(([user, featured]) => {
      setUserPlaylists(user || []);
      setFeaturedPlaylists(featured || []);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white/5 rounded-2xl aspect-square"></div>
        ))}
      </div>
    );
  }

  const allPlaylists = [...userPlaylists, ...featuredPlaylists];

  if (allPlaylists.length === 0) {
    return (
      <div className="text-center p-12 glass rounded-3xl max-w-2xl w-full">
        <h3 className="text-2xl font-black mb-4">No Playlists Found</h3>
        <p className="text-gray-400 mb-8 leading-relaxed">
          If you're using a different Spotify account, it must be added to the whitelist in the Spotify Developer Dashboard.
        </p>
        <div className="flex gap-4 justify-center">
           <button onClick={() => window.location.reload()} className="px-8 py-3 bg-[#1DB954] text-black font-black rounded-full">Refresh</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 w-full max-w-6xl">
      {userPlaylists.length > 0 && (
        <section>
          <h2 className="text-xs font-black text-[#1DB954] uppercase tracking-[0.4em] mb-6">Your Library</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {userPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}

      {featuredPlaylists.length > 0 && (
        <section>
          <h2 className="text-xs font-black text-[#1DB954] uppercase tracking-[0.4em] mb-6">Featured / Trending</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} onSelect={onSelect} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Fix: Use React.FC to allow React-specific props like 'key' and provide proper typing for props
const PlaylistCard: React.FC<{ playlist: SpotifyPlaylist; onSelect: (p: SpotifyPlaylist) => void }> = ({ playlist, onSelect }) => (
  <button
    onClick={() => onSelect(playlist)}
    className="group relative bg-[#181818] hover:bg-[#282828] p-4 rounded-2xl transition-all hover:-translate-y-2 text-left flex flex-col items-start shadow-xl border border-transparent hover:border-white/10"
  >
    <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-xl shadow-lg bg-gray-800">
      {playlist.images?.[0]?.url && (
        <img 
          src={playlist.images[0].url} 
          alt={playlist.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
          <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
    </div>
    <h3 className="font-bold text-white truncate w-full mb-1 group-hover:text-[#1DB954] transition-colors">{playlist.name}</h3>
    <p className="text-gray-500 text-xs font-bold uppercase">{playlist.tracks.total} tracks</p>
  </button>
);

export default PlaylistSelector;
