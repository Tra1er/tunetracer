
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants.ts';

/**
 * BROWSER-COMPATIBLE IMPLEMENTATION OF spotify-preview-finder
 * Strictly follows the logic and API structure of the package:
 * https://www.npmjs.com/package/spotify-preview-finder
 */

export interface SpotifyPreviewResult {
  success: boolean;
  searchQuery: string;
  results: Array<{
    name: string;
    spotifyUrl: string;
    previewUrls: string[];
    trackId: string;
    albumName: string;
    releaseDate: string;
    popularity: number;
    durationMs: number;
  }>;
  error?: string;
}

export const audioService = {
  /**
   * Internal helper to get access token using Client Credentials
   * This mirrors the package's automatic authentication handling.
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
      console.error("Auth Error:", e);
      return null;
    }
  },

  /**
   * The core function mirroring spotifyPreviewFinder(songName, artistName, limit)
   * Uses advanced field-restricted search to find p.scdn.co previews.
   */
  async spotifyPreviewFinder(songName: string, artistName: string, limit: number = 10): Promise<SpotifyPreviewResult> {
    const searchQuery = `track:"${songName}" artist:"${artistName}"`;
    try {
      const token = await this.getClientToken();
      if (!token) throw new Error("Authentication failed");

      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${limit}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.tracks || !data.tracks.items) {
        return { success: false, searchQuery, results: [] };
      }

      const results = data.tracks.items.map((track: any) => ({
        name: `${track.name} - ${track.artists.map((a: any) => a.name).join(', ')}`,
        spotifyUrl: track.external_urls.spotify,
        previewUrls: track.preview_url ? [track.preview_url] : [],
        trackId: track.id,
        albumName: track.album.name,
        releaseDate: track.album.release_date,
        popularity: track.popularity,
        durationMs: track.duration_ms
      }));

      // Filter for versions that actually have a preview_url
      const validResults = results.filter(r => r.previewUrls.length > 0);

      return {
        success: validResults.length > 0,
        searchQuery,
        results: validResults
      };
    } catch (error: any) {
      return {
        success: false,
        searchQuery,
        results: [],
        error: error.message
      };
    }
  },

  /**
   * Helper for Demo Mode / Quick Play
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
