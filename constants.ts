
export const SPOTIFY_CLIENT_ID = '648704f47d164b5ab2f22c8d71af6968'; 
export const SPOTIFY_CLIENT_SECRET = '00ddab76b08547f0927fa6e071310134';

export const REDIRECT_URI = window.location.origin + '/';

export const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-top-read',
  'user-library-read'
].join(' ');

export const getAuthUrl = (codeChallenge: string) => {
  return `https://accounts.spotify.com/authorize?` + 
    `client_id=${SPOTIFY_CLIENT_ID}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(SCOPES)}&` +
    `code_challenge_method=S256&` +
    `code_challenge=${codeChallenge}&` +
    `show_dialog=true`;
};
