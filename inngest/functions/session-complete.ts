import { inngest } from '../client';

export const sessionComplete = inngest.createFunction(
  { id: 'session-complete' },
  { event: 'session/completed' },
  async ({ event, step }) => {
    const { sessionId, childId, storyId } = event.data as {
      sessionId: string;
      childId: string;
      storyId: string;
    };

    await step.run('aggregate-session-stats', async () => {
      // TODO: aggregate session stats into reading_sessions table
      console.warn('Aggregating stats for session:', sessionId);
      return { sessionId, childId, storyId };
    });

    await step.run('check-difficulty', async () => {
      // TODO: evaluate if child is ready for next reading level
      console.warn('Checking difficulty for child:', childId);
    });
  },
);
