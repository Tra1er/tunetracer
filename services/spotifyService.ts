
import { SpotifyPlaylist, SpotifyTrack } from '../types.ts';

export const spotifyService = {
  async fetchWithAuth(url: string, token: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 401) {
      localStorage.removeItem('spotify_token');
      window.location.reload();
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP Error ${response.status}`);
    }
    
    return response.json();
  },

  async getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
    if (token === "DEMO_MODE") return [];
    try {
      const data = await this.fetchWithAuth('https://api.spotify.com/v1/me/playlists?limit=50', token);
      return data.items || [];
    } catch (e) {
      return [];
    }
  },

  async getFeaturedPlaylists(token: string): Promise<SpotifyPlaylist[]> {
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const url = 'https://api.spotify.com/v1/browse/featured-playlists?limit=12';
      const response = await fetch(url, { headers: authHeader as any });
      const data = await response.json();
      return data.playlists?.items || [];
    } catch (e) {
      return [];
    }
  },

  async getPlaylistTracks(token: string, playlistId: string): Promise<SpotifyTrack[]> {
    let allTracks: SpotifyTrack[] = [];
    const limit = 50;
    
    try {
      // Fetch batch 1 (0-50)
      const batch1 = await this.fetchWithAuth(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=0`, 
        token
      );
      
      const mapTracks = (items: any[]) => items
        .map((item: any) => item.track)
        .filter((t: any) => t && t.id && t.name && t.artists && t.artists.length > 0);

      allTracks = [...mapTracks(batch1.items)];

      // Fetch batch 2 (50-100) if available
      if (batch1.total > limit) {
        const batch2 = await this.fetchWithAuth(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${limit}`, 
          token
        );
        allTracks = [...allTracks, ...mapTracks(batch2.items)];
      }

      // Fetch batch 3 (100-150) for maximum variety
      if (batch1.total > limit * 2) {
        const batch3 = await this.fetchWithAuth(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${limit * 2}`, 
          token
        );
        allTracks = [...allTracks, ...mapTracks(batch3.items)];
      }
    } catch (e) {
      console.error("Variety Fetch Failed", e);
    }

    // Deduplicate and return
    return Array.from(new Map(allTracks.map(t => [t.id, t])).values());
  }
};
