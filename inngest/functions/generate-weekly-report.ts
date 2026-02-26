import { inngest } from '../client';

export const generateWeeklyReport = inngest.createFunction(
  { id: 'generate-weekly-report' },
  { cron: '0 20 * * 0' }, // Sundays at 8pm UTC
  async ({ step }) => {
    await step.run('compile-weekly-summaries', async () => {
      // TODO: query reading_sessions for the past week, compile per-child summaries
      console.warn('Generating weekly reports...');
    });

    await step.run('send-parent-notifications', async () => {
      // TODO: push notifications to parents with weekly summary
      console.warn('Sending parent notifications...');
    });
  },
);
