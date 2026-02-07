
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

  async getPlaylistTracks(token: string, playlistId: string): Promise<SpotifyTrack[]> {
    let allTracksWithPreviews: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    // We try to find at least 20 tracks with previews, or stop if we've checked 300 tracks
    // to avoid hitting API rate limits or long wait times.
    while (allTracksWithPreviews.length < 20 && hasMore && offset < 300) {
      const data = await this.fetchWithAuth(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, 
        token
      );
      
      const tracksFromBatch = data.items
        .map((item: any) => item.track)
        .filter((track: SpotifyTrack) => track && track.preview_url);
      
      allTracksWithPreviews = [...allTracksWithPreviews, ...tracksFromBatch];
      
      offset += limit;
      hasMore = data.next !== null;
      
      // If we already have enough to play (at least 10), we can stop early
      if (allTracksWithPreviews.length >= 12) break;
    }

    return allTracksWithPreviews;
  }
};
