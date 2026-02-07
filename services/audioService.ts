
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants.ts';

export const audioService = {
  /**
   * Gets a Client Credentials token for Demo Mode (no user login required)
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
      return null;
    }
  },

  /**
   * Mimics spotify-preview-finder logic:
   * Searches Spotify for the track to find ANY version with a preview_url.
   */
  async getSpotifyPreview(trackName: string, artistName: string, token: string): Promise<string | null> {
    if (!token || token === "DEMO_MODE") return null;
    try {
      const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
      const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Look for the first result that has a preview_url
      const bestMatch = data.tracks?.items?.find((t: any) => t.preview_url);
      return bestMatch?.preview_url || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Ultimate fallback: iTunes Search API
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
   * Fetches a list of global hits using Client Credentials
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
