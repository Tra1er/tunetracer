
export const audioService = {
  /**
   * Searches iTunes for a 30-second audio preview of a track.
   * This is much more reliable than the Spotify preview_url.
   */
  async getPreviewUrl(trackName: string, artistName: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`${trackName} ${artistName}`);
      const response = await fetch(`https://itunes.apple.com/search?term=${query}&media=music&limit=1`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0].previewUrl || null;
      }
      return null;
    } catch (error) {
      console.error("iTunes search failed", error);
      return null;
    }
  },

  /**
   * Fetches a list of top tracks from iTunes to use as a "Demo Mode" fallback.
   */
  async getTopHits(): Promise<any[]> {
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=top+hits&media=music&limit=50`);
      const data = await response.json();
      return data.results.map((item: any) => ({
        id: `itunes-${item.trackId}`,
        name: item.trackName,
        preview_url: item.previewUrl,
        album: {
          name: item.collectionName,
          images: [{ url: item.artworkUrl100.replace('100x100', '600x600') }]
        },
        artists: [{ name: item.artistName }]
      }));
    } catch (error) {
      return [];
    }
  }
};
