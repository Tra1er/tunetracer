
import { SpotifyPlaylist, SpotifyTrack } from '../types.ts';

export const spotifyService = {
  async fetchWithAuth(url: string, token: string) {
    if (token === "DEMO_MODE") return null;
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
      console.error("Failed to fetch user playlists", e);
      return [];
    }
  },

  async getFeaturedPlaylists(token: string): Promise<SpotifyPlaylist[]> {
    const authHeader = token !== "DEMO_MODE" ? { Authorization: `Bearer ${token}` } : {};
    try {
      // Use a more generic fetch if in demo mode or if auth fails
      const url = 'https://api.spotify.com/v1/browse/featured-playlists?limit=12';
      const response = await fetch(url, { headers: authHeader as any });
      const data = await response.json();
      return data.playlists?.items || [];
    } catch (e) {
      return [];
    }
  },

  async getPlaylistTracks(
    token: string, 
    playlistId: string
  ): Promise<SpotifyTrack[]> {
    if (token === "DEMO_MODE") return [];
    
    let allTracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    // Fetch up to 100 tracks to ensure variety
    while (allTracks.length < 100 && hasMore) {
      const data = await this.fetchWithAuth(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&market=from_token`, 
        token
      );
      
      if (!data || !data.items) break;

      const tracksFromBatch = data.items
        .map((item: any) => item.track)
        .filter((track: SpotifyTrack) => track && track.id && track.name);
      
      allTracks = [...allTracks, ...tracksFromBatch];
      offset += limit;
      hasMore = data.next !== null;
    }

    return allTracks;
  }
};
