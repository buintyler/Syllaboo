import type { ISttProvider } from '../providers/stt.provider.interface';
// eslint-disable-next-line no-restricted-imports -- stt.service.ts is the factory; only file permitted to import providers directly
import { AssemblyAIProvider } from '../providers/assemblyai.provider';
// eslint-disable-next-line no-restricted-imports -- stt.service.ts is the factory; only file permitted to import providers directly
import { DeepgramProvider } from '../providers/deepgram.provider';
import { MockSttProvider } from '../providers/mock.provider';

type SttProviderName = 'assemblyai' | 'deepgram' | 'mock';

/**
 * Factory that returns the correct STT provider based on STT_PROVIDER env var.
 * This is the only place that imports provider implementations directly.
 */
export function createSttProvider(): ISttProvider {
  const providerName = (process.env['STT_PROVIDER'] ?? 'mock') as SttProviderName;

  switch (providerName) {
    case 'assemblyai': {
      const apiKey = process.env['ASSEMBLYAI_API_KEY'];
      if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY is required when STT_PROVIDER=assemblyai');
      return new AssemblyAIProvider(apiKey);
    }
    case 'deepgram': {
      const apiKey = process.env['DEEPGRAM_API_KEY'];
      if (!apiKey) throw new Error('DEEPGRAM_API_KEY is required when STT_PROVIDER=deepgram');
      return new DeepgramProvider(apiKey);
    }
    case 'mock':
      return new MockSttProvider();
    default:
      throw new Error(`Unknown STT_PROVIDER: ${providerName as string}. Must be assemblyai | deepgram | mock`);
  }
}
