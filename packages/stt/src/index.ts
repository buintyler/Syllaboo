// Public API — all app code imports from here only
export type { ISttProvider } from './providers/stt.provider.interface';
export type {
  TranscribedWord,
  TranscriptionResult,
  StreamingTranscriptEvent,
  ReadingSessionSummary,
  StruggledWord,
  StreamingSessionConfig,
} from './types/stt.types';
export { createSttProvider } from './services/stt.service';
export {
  alignWords,
  scoreSession,
} from './services/reading-session.service';
export type { StoryWord, AlignmentResult } from './services/reading-session.service';
// MockSttProvider exported for use in tests only
export { MockSttProvider } from './providers/mock.provider';
