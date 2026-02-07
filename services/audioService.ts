
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants.ts';

/**
 * BROWSER-COMPATIBLE VERSION OF spotify-preview-finder
 * This mimics the exact API and logic described at 
 * https://www.npmjs.com/package/spotify-preview-finder
 */

interface SpotifyPreviewResult {
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
   * (Equivalent to the package's automatic auth)
   * Fix: Renamed from getAccessToken to getClientToken to match the expected property name in App.tsx
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
   * The core function mirroring spotifyPreviewFinder(songName, [artistOrLimit], [limit])
   */
  async spotifyPreviewFinder(songName: string, artistName?: string, limit: number = 5): Promise<SpotifyPreviewResult> {
    try {
      // Fix: Updated to call getClientToken instead of getAccessToken
      const token = await this.getClientToken();
      if (!token) throw new Error("Could not authenticate with Spotify");

      // Use the "Enhanced Search" logic from the package
      const searchQuery = artistName 
        ? `track:"${songName}" artist:"${artistName}"` 
        : songName;
      
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${limit}`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.tracks) {
        return { success: false, searchQuery, results: [], error: "No tracks found" };
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

      return {
        success: true,
        searchQuery,
        results
      };
    } catch (error: any) {
      return {
        success: false,
        searchQuery: songName,
        results: [],
        error: error.message
      };
    }
  },

  /**
   * Final fallback for when Spotify has absolutely no preview for any version
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
   * Helper for Demo Mode
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
