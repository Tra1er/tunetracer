
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
    let offset = 0;
    const limit = 50;
    
    // Fetch up to 100 tracks to ensure variety and reduce repetition
    try {
      const firstBatch = await this.fetchWithAuth(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=0`, 
        token
      );
      
      const processBatch = (data: any) => {
        return data.items
          .map((item: any) => item.track)
          .filter((t: any) => t && t.id && t.name);
      };

      allTracks = processBatch(firstBatch);

      if (firstBatch.total > limit) {
        const secondBatch = await this.fetchWithAuth(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${limit}`, 
          token
        );
        allTracks = [...allTracks, ...processBatch(secondBatch)];
      }
    } catch (e) {
      console.error("Failed to load tracks", e);
    }

    return allTracks;
  }
};
