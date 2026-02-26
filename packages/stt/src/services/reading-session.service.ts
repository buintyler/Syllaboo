import type { TranscribedWord, ReadingSessionSummary, StruggledWord } from '../types/stt.types';

export interface StoryWord {
  wordIndex: number;
  text: string;
  textNormalized: string;
  charOffset: number;
}

export interface AlignmentResult {
  wordIndex: number;
  storyWord: StoryWord;
  transcribedWord: TranscribedWord | null;
  wasCorrect: boolean;
}

/**
 * Aligns STT-transcribed words to the expected story words.
 * Uses normalized text (lowercase, no punctuation) for comparison.
 */
export function alignWords(
  storyWords: StoryWord[],
  transcribedWords: TranscribedWord[],
): AlignmentResult[] {
  return storyWords.map((storyWord, index) => {
    const transcribed = transcribedWords[index] ?? null;
    const wasCorrect =
      transcribed !== null && transcribed.word.toLowerCase() === storyWord.textNormalized;

    return {
      wordIndex: storyWord.wordIndex,
      storyWord,
      transcribedWord: transcribed,
      wasCorrect,
    };
  });
}

/**
 * Scores a reading session and returns a summary.
 */
export function scoreSession(
  sessionId: string,
  childId: string,
  storyId: string,
  storyWords: StoryWord[],
  transcribedWords: TranscribedWord[],
  durationMs: number,
  confidenceThreshold: number,
): ReadingSessionSummary {
  const alignment = alignWords(storyWords, transcribedWords);

  const wordsRead = alignment.filter((r) => r.transcribedWord !== null).length;
  const wordsCorrect = alignment.filter((r) => r.wasCorrect).length;
  const accuracyPercent = wordsRead > 0 ? (wordsCorrect / wordsRead) * 100 : 0;

  const struggledWords: StruggledWord[] = alignment
    .filter(
      (r) =>
        r.transcribedWord !== null &&
        (!r.wasCorrect || r.transcribedWord.confidence < confidenceThreshold),
    )
    .map((r) => ({
      word: r.transcribedWord!.word,
      expectedWord: r.storyWord.textNormalized,
      confidence: r.transcribedWord!.confidence,
      startTimeMs: r.transcribedWord!.startTime,
      endTimeMs: r.transcribedWord!.endTime,
    }));

  return {
    sessionId,
    childId,
    storyId,
    accuracyPercent: Math.round(accuracyPercent * 100) / 100,
    wordsRead,
    wordsCorrect,
    durationMs,
    struggledWords,
  };
}
