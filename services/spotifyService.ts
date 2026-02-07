
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
    return response.json();
  },

  async getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
    const data = await this.fetchWithAuth('https://api.spotify.com/v1/me/playlists?limit=50', token);
    return data.items || [];
  },

  async getPlaylistTracks(
    token: string, 
    playlistId: string, 
    onProgress?: (scanned: number, found: number) => void
  ): Promise<SpotifyTrack[]> {
    let allTracksWithPreviews: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalScanned = 0;

    // Deep search: scan up to 500 tracks to find at least 15 playable ones
    while (allTracksWithPreviews.length < 15 && hasMore && offset < 500) {
      const data = await this.fetchWithAuth(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, 
        token
      );
      
      if (!data.items) break;

      const tracksFromBatch = data.items
        .map((item: any) => item.track)
        .filter((track: SpotifyTrack) => track && track.preview_url);
      
      allTracksWithPreviews = [...allTracksWithPreviews, ...tracksFromBatch];
      totalScanned += data.items.length;
      
      if (onProgress) {
        onProgress(totalScanned, allTracksWithPreviews.length);
      }

      offset += limit;
      hasMore = data.next !== null;
      
      // If we found at least 10, we have enough for a full game
      if (allTracksWithPreviews.length >= 10) break;
    }

    return allTracksWithPreviews;
  }
};
