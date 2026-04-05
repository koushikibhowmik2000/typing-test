export type ExamType = 'RRB' | 'SSC';

export interface TestStats {
  wpm: number;
  accuracy: number;
  errors: number;
  totalChars: number;
  timeElapsed: number;
  grossWpm: number;
  netWpm: number;
}

export interface TypingState {
  isActive: boolean;
  isFinished: boolean;
  startTime: number | null;
  currentIndex: number;
  userInput: string;
  errors: number;
}
