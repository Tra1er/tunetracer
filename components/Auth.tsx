
import React, { useState } from 'react';
import { getAuthUrl, SPOTIFY_CLIENT_ID } from '../constants.ts';

interface AuthProps {
  error?: string | null;
  onDemoMode: () => void;
}

const Auth: React.FC<AuthProps> = ({ error, onDemoMode }) => {
  const [showSetup, setShowSetup] = useState(false);

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
        <h1 className="text-6xl font-black text-white mb-6 tracking-tighter leading-none animate-[slideDown_0.6s_ease-out]">TUNE <br/> TRACER</h1>
        
        {showSetup ? (
          <div className="bg-black/40 border-2 border-[#1DB954]/50 p-8 rounded-[2rem] text-left animate-[pop_0.4s_ease-out] backdrop-blur-xl mb-8">
            <h3 className="text-[#1DB954] font-black uppercase text-sm tracking-widest mb-4">Spotify Connection Help</h3>
            <div className="space-y-4 text-sm text-gray-200">
               <p>If login isn't working, it's because Spotify requires individual accounts to be whitelisted for developer apps.</p>
               <p className="text-[#1DB954] font-bold">Try "Quick Play" instead to skip the login!</p>
               <button onClick={() => setShowSetup(false)} className="w-full mt-4 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors">Got it</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-[fadeIn_1s_ease-out]">
            <p className="text-xl text-gray-300 mb-10 font-medium">The high-octane song guessing challenge.</p>
            
            <button
              onClick={handleLogin}
              className="group flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xl font-bold py-5 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#1DB954]/20 w-full"
            >
              LOGIN WITH SPOTIFY
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] bg-white/10 flex-1"></div>
              <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">OR</span>
              <div className="h-[1px] bg-white/10 flex-1"></div>
            </div>

            <button
              onClick={onDemoMode}
              className="group flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black text-lg font-black py-4 px-10 rounded-full transition-all hover:scale-105 active:scale-95 w-full"
            >
              QUICK PLAY (NO LOGIN)
            </button>

            <button onClick={() => setShowSetup(true)} className="pt-4 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest block mx-auto">
              Login Troubles?
            </button>
          </div>
        )}

        {error && <p className="mt-8 text-red-400 font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</p>}
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Auth;
