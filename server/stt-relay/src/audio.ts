/**
 * Audio chunking and forwarding utilities for the STT relay.
 * Responsible for buffering raw PCM audio and forwarding to the STT provider.
 */

export interface AudioBuffer {
  sessionId: string;
  chunks: Buffer[];
  totalBytes: number;
}

export function createAudioBuffer(sessionId: string): AudioBuffer {
  return { sessionId, chunks: [], totalBytes: 0 };
}

export function appendChunk(buffer: AudioBuffer, chunk: Buffer): void {
  buffer.chunks.push(chunk);
  buffer.totalBytes += chunk.length;
}

export function flushBuffer(buffer: AudioBuffer): Buffer {
  const combined = Buffer.concat(buffer.chunks);
  buffer.chunks = [];
  buffer.totalBytes = 0;
  return combined;
}
