
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../constants.ts';

/**
 * ADVANCED BROWSER-COMPATIBLE AUDIO ENGINE
 * Implements "Cross-Catalog Crawling" to find valid Spotify previews (p.scdn.co)
 */

interface SpotifyPreviewResult {
  success: boolean;
  searchQuery: string;
  results: Array<{
    name: string;
    artist: string;
    previewUrl: string;
    trackId: string;
    popularity: number;
    isRemix: boolean;
  }>;
  error?: string;
}

export const audioService = {
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
   * The "Deep Crawler" logic used by top Spotify guessing sites.
   * Finds the hidden p.scdn.co links by searching across all catalog versions.
   */
  async spotifyPreviewFinder(songName: string, artistName: string): Promise<SpotifyPreviewResult> {
    try {
      const token = await this.getClientToken();
      if (!token) throw new Error("Auth failed");

      const cleanSongName = songName.split(' - ')[0].split(' (')[0].trim();
      const isOriginalRemix = songName.toLowerCase().includes('remix');
      const isOriginalLive = songName.toLowerCase().includes('live');

      // Stage 1: Search specifically for this track across all albums
      // We use the strict "track:" and "artist:" filters to ensure accuracy
      const searchQuery = `track:"${cleanSongName}" artist:"${artistName}"`;
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=15`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!data.tracks || data.tracks.items.length === 0) {
        return { success: false, searchQuery, results: [] };
      }

      // Stage 2: Filter and Score Results
      // We look for the first version that has a preview_url AND isn't a wrong remix
      const mappedResults = data.tracks.items
        .map((track: any) => {
          const trackNameLower = track.name.toLowerCase();
          const hasPreview = !!track.preview_url;
          const isRemix = trackNameLower.includes('remix') && !isOriginalRemix;
          const isLive = trackNameLower.includes('live') && !isOriginalLive;
          
          return {
            name: track.name,
            artist: track.artists[0].name,
            previewUrl: track.preview_url,
            trackId: track.id,
            popularity: track.popularity,
            isValid: hasPreview && !isRemix && !isLive
          };
        })
        .filter((r: any) => r.isValid)
        .sort((a: any, b: any) => b.popularity - a.popularity); // Prioritize the most popular version

      return {
        success: mappedResults.length > 0,
        searchQuery,
        results: mappedResults
      };
    } catch (error: any) {
      return { success: false, searchQuery: songName, results: [], error: error.message };
    }
  },

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
