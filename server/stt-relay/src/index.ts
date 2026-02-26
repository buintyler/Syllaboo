import { createWebSocketServer } from './websocket';

const PORT = parseInt(process.env['PORT'] ?? '8080', 10);

const wss = createWebSocketServer(PORT);

process.on('SIGTERM', () => {
  wss.close(() => {
    process.exit(0);
  });
});
