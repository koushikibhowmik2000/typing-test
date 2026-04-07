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
  currentWordIndex: number;
  userInput: string;
  errors: number;
  incorrectWords: { expected: string; actual: string; index: number }[];
  originalText: string;
  backspaceCount: number;
  mistypedKeys: Record<string, number>;
  stats: TestStats | null;
}
