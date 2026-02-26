import { inngest } from '../client';

export const sendPushNotification = inngest.createFunction(
  { id: 'send-push-notification' },
  { event: 'notification/send' },
  async ({ event, step }) => {
    const { userId, title, body } = event.data as {
      userId: string;
      title: string;
      body: string;
    };

    await step.run('send-notification', async () => {
      // TODO: integrate with Expo Push Notifications
      console.warn('Sending push notification to user:', userId, { title, body });
    });
  },
);
