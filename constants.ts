
// Your Spotify Client ID
export const SPOTIFY_CLIENT_ID = '648704f47d164b5ab2f22c8d71af6968'; 

// We force the origin and check for trailing slash to maintain consistency with Dashboard settings
const baseUri = window.location.origin + window.location.pathname;
export const REDIRECT_URI = baseUri.endsWith('/') ? baseUri : baseUri + '/';

export const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-library-read'
].join(' ');

export const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
