import type { ISttProvider } from './stt.provider.interface';
import type {
  StreamingSessionConfig,
  StreamingTranscriptEvent,
  TranscriptionResult,
} from '../types/stt.types';

/**
 * AssemblyAI streaming STT provider.
 * Timestamps from AssemblyAI are in milliseconds — no conversion needed.
 * Do NOT import this file directly from app code. Use packages/stt/index.ts.
 */
export class AssemblyAIProvider implements ISttProvider {
  constructor(_apiKey: string) {
    // apiKey stored and used when provider is fully implemented
  }

  async openSession(_sessionId: string, _config: StreamingSessionConfig): Promise<void> {
    throw new Error('AssemblyAI provider not yet implemented');
  }

  async sendAudioChunk(_sessionId: string, _chunk: Buffer): Promise<void> {
    throw new Error('AssemblyAI provider not yet implemented');
  }

  onTranscriptEvent(
    _sessionId: string,
    _handler: (event: StreamingTranscriptEvent) => void,
  ): void {
    throw new Error('AssemblyAI provider not yet implemented');
  }

  async closeSession(_sessionId: string): Promise<TranscriptionResult> {
    throw new Error('AssemblyAI provider not yet implemented');
  }
}
