export enum DifficultyLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  EXPERT = 'Expert'
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
}

export interface GameState {
  fen: string;
  isGameOver: boolean;
  turn: 'w' | 'b';
  history: string[];
  lastMove: string | null;
}

export interface TutorResponse {
  move: string;
  commentary: string;
}
