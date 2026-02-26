import type { ISttProvider } from './stt.provider.interface';
import type {
  StreamingSessionConfig,
  StreamingTranscriptEvent,
  TranscriptionResult,
} from '../types/stt.types';

/**
 * Mock STT provider for local development and tests.
 * Returns deterministic, configurable transcription results.
 * Set STT_PROVIDER=mock in .env to use this.
 */
export class MockSttProvider implements ISttProvider {
  private handlers = new Map<string, (event: StreamingTranscriptEvent) => void>();
  private sessions = new Map<string, { config: StreamingSessionConfig; startTime: number }>();

  async openSession(sessionId: string, config: StreamingSessionConfig): Promise<void> {
    this.sessions.set(sessionId, { config, startTime: Date.now() });
  }

  async sendAudioChunk(_sessionId: string, _chunk: Buffer): Promise<void> {
    // No-op in mock — chunks are discarded
  }

  onTranscriptEvent(sessionId: string, handler: (event: StreamingTranscriptEvent) => void): void {
    this.handlers.set(sessionId, handler);
  }

  async closeSession(sessionId: string): Promise<TranscriptionResult> {
    const session = this.sessions.get(sessionId);
    this.handlers.delete(sessionId);
    this.sessions.delete(sessionId);

    const durationMs = session ? Date.now() - session.startTime : 0;

    return {
      sessionId,
      transcript: '',
      words: [],
      isFinal: true,
      audioDurationMs: durationMs,
    };
  }

  /** Test helper: emit a transcript event for a session */
  emitEvent(sessionId: string, event: StreamingTranscriptEvent): void {
    this.handlers.get(sessionId)?.(event);
  }
}
