
import React from 'react';
import { AUTH_URL, SPOTIFY_CLIENT_ID, REDIRECT_URI } from '../constants.ts';

interface AuthProps {
  error?: string | null;
}

const Auth: React.FC<AuthProps> = ({ error }) => {
  const isDefaultId = (SPOTIFY_CLIENT_ID as string) === 'your_client_id_here' || !SPOTIFY_CLIENT_ID;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 spotify-gradient overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#1DB954] opacity-20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#1DB954] opacity-10 rounded-full blur-[100px]"></div>

      <div className="z-10 text-center max-w-lg w-full">
        <div className="mb-8 inline-block p-4 bg-[#1DB954] rounded-2xl shadow-2xl shadow-[#1DB954]/20 animate-bounce">
          <svg className="w-12 h-12 text-black" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.216.353-.671.464-1.024.248-2.831-1.73-6.395-2.122-10.59-1.166-.404.091-.806-.16-.897-.563-.091-.403.16-.806.563-.897 4.593-1.05 8.528-.602 11.699 1.339.354.215.465.67.249 1.039zm1.468-3.264c-.272.443-.849.584-1.292.311-3.242-1.993-8.183-2.571-12.016-1.407-.498.151-1.021-.128-1.173-.626-.151-.498.128-1.021.626-1.173 4.384-1.33 9.818-.68 13.543 1.605.443.272.584.849.312 1.29zm.128-3.395c-3.89-2.31-10.309-2.522-14.041-1.39-.597.181-1.23-.159-1.411-.756-.181-.597.159-1.23.756-1.411 4.288-1.301 11.385-1.043 15.867 1.618.536.318.711 1.011.393 1.547-.319.537-1.012.712-1.564.392z"/>
          </svg>
        </div>
        
        <h1 className="text-6xl font-black text-white mb-6 tracking-tighter leading-none">
          TUNE <br/> TRACER
        </h1>
        <p className="text-xl text-gray-300 mb-10 font-medium">
          The ultimate Spotify guessing game.
        </p>

        {error && (
          <div className="bg-red-500/20 border-2 border-red-500/50 p-6 rounded-3xl mb-8 text-left animate-[shake_0.5s_ease-in-out]">
            <p className="text-red-200 font-black uppercase text-xs tracking-widest mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
              Login Error: {error}
            </p>
            <p className="text-red-100 text-sm font-medium mb-3">
              Spotify rejected the login request. This usually means "Implicit Grant" is disabled or the Redirect URI is missing.
            </p>
            <div className="bg-black/30 p-3 rounded-xl text-xs font-mono text-gray-300 break-all border border-white/5">
              Ensure this is in your Spotify Dashboard:<br/>
              <span className="text-[#1DB954]">{REDIRECT_URI}</span>
            </div>
          </div>
        )}

        {isDefaultId ? (
          <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl mb-6">
            <p className="text-red-200 font-bold mb-2">Setup Required!</p>
            <p className="text-red-100 text-sm">
              Please ensure your Client ID is correctly set in <code>constants.ts</code>.
            </p>
          </div>
        ) : (
          <a
            href={AUTH_URL}
            className="group flex items-center justify-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black text-xl font-bold py-5 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#1DB954]/20"
          >
            LOGIN WITH SPOTIFY
            <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        )}

        <div className="mt-12 flex items-center justify-center gap-8 text-gray-500 text-sm font-semibold tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></div>
            Real-time API
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#1DB954] rounded-full"></div>
            Streak Multipliers
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default Auth;
