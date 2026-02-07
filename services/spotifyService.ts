
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
    try {
      const data = await this.fetchWithAuth('https://api.spotify.com/v1/me/playlists?limit=50', token);
      return data.items || [];
    } catch (e) {
      console.error("Failed to fetch user playlists", e);
      return [];
    }
  },

  async getFeaturedPlaylists(token: string): Promise<SpotifyPlaylist[]> {
    try {
      const data = await this.fetchWithAuth('https://api.spotify.com/v1/browse/featured-playlists?limit=10', token);
      return data.playlists.items || [];
    } catch (e) {
      return [];
    }
  },

  async getPlaylistTracks(
    token: string, 
    playlistId: string, 
    onProgress?: (scanned: number, found: number) => void
  ): Promise<SpotifyTrack[]> {
    let allTracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;
    let totalScanned = 0;

    // We scan for tracks. We now keep tracks EVEN IF they don't have previews
    // because we have the Gemini fallback.
    while (allTracks.length < 30 && hasMore && offset < 200) {
      // market=from_token is crucial for unlocking region-locked previews
      const data = await this.fetchWithAuth(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&market=from_token`, 
        token
      );
      
      if (!data.items) break;

      const tracksFromBatch = data.items
        .map((item: any) => item.track)
        .filter((track: SpotifyTrack) => track && track.id);
      
      allTracks = [...allTracks, ...tracksFromBatch];
      totalScanned += data.items.length;
      
      const foundWithPreviews = allTracks.filter(t => t.preview_url).length;
      if (onProgress) {
        onProgress(totalScanned, foundWithPreviews);
      }

      offset += limit;
      hasMore = data.next !== null;
      
      if (allTracks.length >= 40) break;
    }

    return allTracks;
  }
};
