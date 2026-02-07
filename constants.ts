
// FOR DEVELOPERS: Replace with your actual Spotify Client ID
// To get one, visit: https://developer.spotify.com/dashboard
export const SPOTIFY_CLIENT_ID = '648704f47d164b5ab2f22c8d71af6968'; 

// Use the current URL as redirect URI (Spotify Dashboard must match this)
export const REDIRECT_URI = window.location.origin + window.location.pathname;

export const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-library-read'
].join(' ');

export const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
