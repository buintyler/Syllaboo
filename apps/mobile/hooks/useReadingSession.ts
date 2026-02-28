import { useState, useCallback, useMemo } from 'react';

export type WordStatus = 'upcoming' | 'current' | 'correct' | 'incorrect' | 'skipped';
export type SessionPhase = 'idle' | 'listening' | 'completed';

export interface DisplayWord {
  wordIndex: number;
  text: string;
  textNormalized: string;
  phonetic: string;
  status: WordStatus;
}

interface StoryWord {
  wordIndex: number;
  text: string;
  textNormalized: string;
  phonetic: string;
  charOffset: number;
}

const MOCK_STORY_WORDS: StoryWord[] = [
  { wordIndex: 0, text: 'The', textNormalized: 'the', phonetic: 'thuh', charOffset: 0 },
  { wordIndex: 1, text: 'quick', textNormalized: 'quick', phonetic: 'kwik', charOffset: 4 },
  { wordIndex: 2, text: 'brown', textNormalized: 'brown', phonetic: 'brown', charOffset: 10 },
  { wordIndex: 3, text: 'fox', textNormalized: 'fox', phonetic: 'foks', charOffset: 16 },
  { wordIndex: 4, text: 'jumps', textNormalized: 'jumps', phonetic: 'juhmps', charOffset: 20 },
  { wordIndex: 5, text: 'over', textNormalized: 'over', phonetic: 'oh-ver', charOffset: 26 },
  { wordIndex: 6, text: 'the', textNormalized: 'the', phonetic: 'thuh', charOffset: 31 },
  { wordIndex: 7, text: 'lazy', textNormalized: 'lazy', phonetic: 'lay-zee', charOffset: 35 },
  { wordIndex: 8, text: 'dog.', textNormalized: 'dog', phonetic: 'dawg', charOffset: 40 },
];

const ENCOURAGEMENTS_IDLE = [
  "Hi there! Ready to read together?",
  "Let's read a story! Tap the blue button!",
  "I can't wait to hear you read!",
];

const ENCOURAGEMENTS_LISTENING = [
  "I'm listening, keep going!",
  "You're doing amazing!",
  'Great reading, keep it up!',
  "Wow, you're a star reader!",
];

const ENCOURAGEMENTS_RESTART = [
  "Let's try again! You've got this!",
  'Starting fresh! Ready to read?',
];

export function useReadingSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [wordResults, setWordResults] = useState<Map<number, 'correct' | 'incorrect'>>(new Map());
  const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS_IDLE[0]);
  const [lastWordCorrect, setLastWordCorrect] = useState<boolean | null>(null);

  const words: DisplayWord[] = useMemo(
    () =>
      MOCK_STORY_WORDS.map((w) => {
        const result = wordResults.get(w.wordIndex);
        let status: WordStatus = 'upcoming';
        if (result) {
          status = result;
        } else if (w.wordIndex === currentWordIndex) {
          status = 'current';
        }
        return {
          wordIndex: w.wordIndex,
          text: w.text,
          textNormalized: w.textNormalized,
          phonetic: w.phonetic,
          status,
        };
      }),
    [currentWordIndex, wordResults],
  );

  const totalWords = MOCK_STORY_WORDS.length;
  const isListening = phase === 'listening';

  const pickRandom = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

  const startListening = useCallback(() => {
    setPhase('listening');
    setLastWordCorrect(null);
    setEncouragement(pickRandom(ENCOURAGEMENTS_LISTENING));
  }, []);

  const stopListening = useCallback(() => {
    setPhase('idle');
    setLastWordCorrect(null);
    setEncouragement(pickRandom(ENCOURAGEMENTS_IDLE));
  }, []);

  const advanceWord = useCallback(
    (wasCorrect: boolean) => {
      setWordResults((prev) => {
        const next = new Map(prev);
        next.set(currentWordIndex, wasCorrect ? 'correct' : 'incorrect');
        return next;
      });

      setLastWordCorrect(wasCorrect);
      setEncouragement(pickRandom(ENCOURAGEMENTS_LISTENING));

      const nextIndex = currentWordIndex + 1;
      if (nextIndex >= totalWords) {
        setPhase('completed');
      } else {
        setCurrentWordIndex(nextIndex);
      }
    },
    [currentWordIndex, totalWords],
  );

  const restart = useCallback(() => {
    setPhase('idle');
    setCurrentWordIndex(0);
    setWordResults(new Map());
    setLastWordCorrect(null);
    setEncouragement(pickRandom(ENCOURAGEMENTS_RESTART));
  }, []);

  const endSession = useCallback(() => {
    setPhase('completed');
  }, []);

  return {
    phase,
    words,
    currentWordIndex,
    totalWords,
    encouragement,
    lastWordCorrect,
    isListening,
    startListening,
    stopListening,
    advanceWord,
    restart,
    endSession,
  };
}
