
import { SpotifyPlaylist, SpotifyTrack } from '../types.ts';

export const spotifyService = {
  async fetchWithAuth(url: string, token: string) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (response.status === 401) {
      window.location.hash = '';
      window.location.reload();
      throw new Error('Unauthorized');
    }
    return response.json();
  },

  async getUserPlaylists(token: string): Promise<SpotifyPlaylist[]> {
    const data = await this.fetchWithAuth('https://api.spotify.com/v1/me/playlists?limit=50', token);
    return data.items;
  },

  async getPlaylistTracks(token: string, playlistId: string): Promise<SpotifyTrack[]> {
    const data = await this.fetchWithAuth(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`, token);
    return data.items
      .map((item: any) => item.track)
      .filter((track: SpotifyTrack) => track && track.preview_url);
  }
};
