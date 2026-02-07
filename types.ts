
export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  album: {
    name: string;
    images: { url: string }[];
  };
  artists: { name: string }[];
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: {
    total: number;
  };
}

export enum GameDifficulty {
  EASY = 'EASY',
  PRO = 'PRO',
  LEGEND = 'LEGEND'
}

export const DIFFICULTY_CONFIG = {
  [GameDifficulty.EASY]: { duration: 20, label: 'Easy (20s)' },
  [GameDifficulty.PRO]: { duration: 10, label: 'Pro (10s)' },
  [GameDifficulty.LEGEND]: { duration: 3, label: 'Legend (3s)' }
};

export interface GameResult {
  score: number;
  streak: number;
  correctAnswers: number;
  missedTracks: SpotifyTrack[];
}

export interface GameState {
  isPlaying: boolean;
  score: number;
  streak: number;
  currentTrackIndex: number;
  missedTracks: SpotifyTrack[];
}
