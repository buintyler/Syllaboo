import type { ISttProvider } from './stt.provider.interface';
import type {
  StreamingSessionConfig,
  StreamingTranscriptEvent,
  TranscriptionResult,
} from '../types/stt.types';

/**
 * Deepgram streaming STT provider.
 * NOTE: Deepgram returns timestamps in SECONDS — multiply by 1000 to convert to ms
 * before returning. App code always receives milliseconds.
 * Do NOT import this file directly from app code. Use packages/stt/index.ts.
 */
export class DeepgramProvider implements ISttProvider {
  constructor(_apiKey: string) {
    // apiKey stored and used when provider is fully implemented
  }

  async openSession(_sessionId: string, _config: StreamingSessionConfig): Promise<void> {
    throw new Error('Deepgram provider not yet implemented');
  }

  async sendAudioChunk(_sessionId: string, _chunk: Buffer): Promise<void> {
    throw new Error('Deepgram provider not yet implemented');
  }

  onTranscriptEvent(
    _sessionId: string,
    _handler: (event: StreamingTranscriptEvent) => void,
  ): void {
    throw new Error('Deepgram provider not yet implemented');
  }

  async closeSession(_sessionId: string): Promise<TranscriptionResult> {
    throw new Error('Deepgram provider not yet implemented');
  }
}
