
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants.ts';

export const audioService = {
  /**
   * Gets a Client Credentials token for high-privilege searching
   */
  async getClientToken(): Promise<string | null> {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
        },
        body: 'grant_type=client_credentials'
      });
      const data = await response.json();
      return data.access_token;
    } catch (e) {
      console.error("Token fetch failed", e);
      return null;
    }
  },

  /**
   * The "Spotify Preview Finder" logic implemented for the browser.
   * Scans global Spotify search results for the best available preview URL.
   */
  async findSpotifyPreview(trackName: string, artistName: string, token: string): Promise<string | null> {
    try {
      // Package logic: build a targeted search query
      const query = encodeURIComponent(`track:"${trackName}" artist:"${artistName}"`);
      const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (!data.tracks || !data.tracks.items) return null;

      // Logic: Iterate through results to find ANY version with a preview_url
      // This bypasses regional restrictions on specific album versions
      const matchWithPreview = data.tracks.items.find((track: any) => track.preview_url);
      
      return matchWithPreview ? matchWithPreview.preview_url : null;
    } catch (e) {
      console.error("Spotify Finder failed", e);
      return null;
    }
  },

  /**
   * Final fallback: iTunes Search API
   */
  async getItunesPreview(trackName: string, artistName: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`${trackName} ${artistName}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
      const data = await response.json();
      return data.results?.[0]?.previewUrl || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Fetches a list of global hits for Demo Mode
   */
  async getGlobalTopTracks(token: string): Promise<any[]> {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwfs21s/tracks?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      return data.items.map((item: any) => item.track).filter((t: any) => t && t.id);
    } catch (e) {
      return [];
    }
  }
};
