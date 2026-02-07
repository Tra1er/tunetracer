
import React, { useState } from 'react';
import { getAuthUrl, SPOTIFY_CLIENT_ID, REDIRECT_URI } from '../constants.ts';

interface AuthProps {
  error?: string | null;
}

const Auth: React.FC<AuthProps> = ({ error }) => {
  const [showSetup, setShowSetup] = useState(false);
  const isDefaultId = (SPOTIFY_CLIENT_ID as string) === 'your_client_id_here' || !SPOTIFY_CLIENT_ID;

  const generateCodeVerifier = (length: number) => {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const generateCodeChallenge = async (codeVerifier: string) => {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const handleLogin = async () => {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem('code_verifier', verifier);
    window.location.href = getAuthUrl(challenge);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 spotify-gradient overflow-hidden relative">
      <div className="z-10 text-center max-w-lg w-full">
        <h1 className="text-6xl font-black text-white mb-6 tracking-tighter leading-none">TUNE <br/> TRACER</h1>
        
        {showSetup ? (
          <div className="bg-black/40 border-2 border-[#1DB954]/50 p-8 rounded-[2rem] text-left animate-[pop_0.4s_ease-out] backdrop-blur-xl mb-8">
            <h3 className="text-[#1DB954] font-black uppercase text-sm tracking-widest mb-4">Fix "No Playlists" or Login Issues</h3>
            <div className="space-y-4 text-sm text-gray-200">
               <p>If you're using an account that isn't the owner of the developer app, you must whitelist it:</p>
               <ol className="list-decimal list-inside space-y-2">
                 <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" className="underline font-bold">Spotify Dashboard</a>.</li>
                 <li>Select your App.</li>
                 <li>Click <b>Settings</b> &gt; <b>User Management</b>.</li>
                 <li>Add the <b>Name</b> and <b>Email</b> of the other Spotify account.</li>
               </ol>
               <button onClick={() => setShowSetup(false)} className="w-full mt-4 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors">Got it</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xl text-gray-300 mb-10 font-medium">The ultimate AI-powered Spotify game.</p>
            <button
              onClick={handleLogin}
              className="group flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xl font-bold py-5 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#1DB954]/20 w-full mb-4"
            >
              LOGIN WITH SPOTIFY
            </button>
            <button onClick={() => setShowSetup(true)} className="text-gray-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">Login Issues?</button>
          </>
        )}

        {error && <p className="mt-8 text-red-400 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>}
      </div>
    </div>
  );
};

export default Auth;
