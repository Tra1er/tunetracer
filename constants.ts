
// Your Spotify Client ID
export const SPOTIFY_CLIENT_ID = '648704f47d164b5ab2f22c8d71af6968'; 

// This dynamically detects if you are on localhost or your Vercel URL.
// Ensure 'https://tunetracer-lhx4.vercel.app/' is added to your Spotify Dashboard Redirect URIs.
export const REDIRECT_URI = window.location.origin + window.location.pathname;

export const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-library-read'
].join(' ');

export const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
