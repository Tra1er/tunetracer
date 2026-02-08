
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
   * Cleans track names for better search results (removes common suffixes)
   */
  cleanName(name: string): string {
    return name
      .replace(/\(feat\..*?\)/gi, '')
      .replace(/\(with.*?\)/gi, '')
      .replace(/\(.*?(remaster|version|edition|mix|edit).*?\)/gi, '')
      .replace(/- .*?(remaster|version|edition|mix|edit).*?$/gi, '')
      .trim();
  },

  /**
   * Internal helper to get access token using Client Credentials
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
   * The core function mirroring spotifyPreviewFinder
   * Now with a fallback search strategy to ensure previews are found.
   */
  async spotifyPreviewFinder(songName: string, artistName: string, limit: number = 10): Promise<SpotifyPreviewResult> {
    const cleanedSong = this.cleanName(songName);
    const strictQuery = `track:"${cleanedSong}" artist:"${artistName}"`;
    const looseQuery = `${cleanedSong} ${artistName}`;
    
    try {
      const token = await this.getClientToken();
      if (!token) throw new Error("Authentication failed");

      // Try Stage 1: Strict Search
      let response = await this.fetchSearch(strictQuery, token, limit);
      let results = this.processTracks(response);

      // Try Stage 2: Loose Search (if no previews found)
      if (results.length === 0) {
        response = await this.fetchSearch(looseQuery, token, limit);
        results = this.processTracks(response);
      }

      return {
        success: results.length > 0,
        searchQuery: strictQuery,
        results: results
      };
    } catch (error: any) {
      return {
        success: false,
        searchQuery: strictQuery,
        results: [],
        error: error.message
      };
    }
  },

  async fetchSearch(query: string, token: string, limit: number) {
    const encoded = encodeURIComponent(query);
    const url = `https://api.spotify.com/v1/search?q=${encoded}&type=track&limit=${limit}`;
    const resp = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return resp.json();
  },

  processTracks(data: any) {
    if (!data.tracks || !data.tracks.items) return [];
    return data.tracks.items
      .map((track: any) => ({
        name: `${track.name} - ${track.artists.map((a: any) => a.name).join(', ')}`,
        spotifyUrl: track.external_urls.spotify,
        previewUrls: track.preview_url ? [track.preview_url] : [],
        trackId: track.id,
        albumName: track.album.name,
        releaseDate: track.album.release_date,
        popularity: track.popularity,
        durationMs: track.duration_ms
      }))
      .filter((r: any) => r.previewUrls.length > 0);
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
