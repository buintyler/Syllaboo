import type { StreamingSessionConfig, StreamingTranscriptEvent, TranscriptionResult } from '../types/stt.types';

export interface ISttProvider {
  /**
   * Opens a streaming session with the STT provider.
   * Returns a session handle used for subsequent calls.
   */
  openSession(sessionId: string, config: StreamingSessionConfig): Promise<void>;

  /**
   * Sends a raw audio chunk to the provider.
   * Audio must be 16-bit PCM, mono, little-endian at the configured sample rate.
   */
  sendAudioChunk(sessionId: string, chunk: Buffer): Promise<void>;

  /**
   * Registers a callback for streaming transcript events (partial and final).
   */
  onTranscriptEvent(sessionId: string, handler: (event: StreamingTranscriptEvent) => void): void;

  /**
   * Closes the streaming session and returns the final transcription result.
   */
  closeSession(sessionId: string): Promise<TranscriptionResult>;
}
