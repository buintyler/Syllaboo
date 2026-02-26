export interface TranscribedWord {
  word: string;
  startTime: number; // milliseconds
  endTime: number;   // milliseconds
  confidence: number; // 0–1
}

export interface TranscriptionResult {
  sessionId: string;
  transcript: string;
  words: TranscribedWord[];
  isFinal: boolean;
  audioDurationMs: number;
}

export interface StreamingTranscriptEvent {
  type: 'partial' | 'final' | 'error';
  sessionId: string;
  words: TranscribedWord[];
  transcript: string;
  error?: string;
}

export interface StruggledWord {
  word: string;
  expectedWord: string;
  confidence: number;
  startTimeMs: number;
  endTimeMs: number;
}

export interface ReadingSessionSummary {
  sessionId: string;
  childId: string;
  storyId: string;
  accuracyPercent: number;
  wordsRead: number;
  wordsCorrect: number;
  durationMs: number;
  struggledWords: StruggledWord[];
}

export interface StreamingSessionConfig {
  language: string;       // BCP-47 (e.g. "en-US")
  sampleRate: number;     // e.g. 16000
  confidenceThreshold: number; // 0–1, default 0.70
  childMode: boolean;     // enables child speech optimizations
}
