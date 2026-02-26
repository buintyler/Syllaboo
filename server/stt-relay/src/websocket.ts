import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { verifyClerkToken } from './auth';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface SessionState {
  sessionId: string;
  userId: string;
  childId: string;
  storyId: string;
  idleTimer: ReturnType<typeof setTimeout>;
}

/**
 * Creates and returns the WebSocket server for the STT relay.
 * Clients connect at wss://<host>/session?token=<clerk_jwt>
 */
export function createWebSocketServer(port: number): WebSocketServer {
  const wss = new WebSocketServer({ port, path: '/session' });
  const sessions = new Map<WebSocket, SessionState>();

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const token = extractToken(req.url ?? '');

    if (!token) {
      ws.close(4001, 'Authentication failed');
      return;
    }

    // Verify JWT async — close connection if invalid
    verifyClerkToken(token)
      .then((userId) => {
        if (!userId) {
          ws.close(4001, 'Authentication failed');
          return;
        }

        ws.on('message', (data: Buffer | string, isBinary: boolean) => {
          if (isBinary) {
            handleAudioChunk(ws, data as Buffer, sessions);
          } else {
            handleJsonMessage(ws, data.toString(), sessions, userId);
          }
        });

        ws.on('close', () => {
          const session = sessions.get(ws);
          if (session) {
            clearTimeout(session.idleTimer);
            sessions.delete(ws);
          }
        });
      })
      .catch(() => {
        ws.close(4001, 'Authentication failed');
      });

    ws.on('error', (err: Error) => {
      console.error('WebSocket error:', err.message);
    });
  });

  return wss;
}

function extractToken(url: string): string | null {
  try {
    const params = new URLSearchParams(url.replace('/session?', ''));
    return params.get('token');
  } catch {
    return null;
  }
}

function resetIdleTimer(ws: WebSocket, sessions: Map<WebSocket, SessionState>): void {
  const session = sessions.get(ws);
  if (!session) return;
  clearTimeout(session.idleTimer);
  session.idleTimer = setTimeout(() => {
    ws.close(1000, 'Idle timeout');
    sessions.delete(ws);
  }, IDLE_TIMEOUT_MS);
}

function send(ws: WebSocket, data: Record<string, unknown>): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function handleAudioChunk(
  ws: WebSocket,
  _chunk: Buffer,
  sessions: Map<WebSocket, SessionState>,
): void {
  const session = sessions.get(ws);
  if (!session) {
    send(ws, { type: 'error', code: 'invalid_message', message: 'No active session' });
    return;
  }
  resetIdleTimer(ws, sessions);
  // TODO: forward chunk to STT provider
}

function handleJsonMessage(
  ws: WebSocket,
  raw: string,
  sessions: Map<WebSocket, SessionState>,
  userId: string,
): void {
  let message: Record<string, unknown>;

  try {
    message = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    send(ws, { type: 'error', code: 'invalid_message', message: 'Invalid JSON' });
    return;
  }

  switch (message['type']) {
    case 'session:start':
      handleSessionStart(ws, message, sessions, userId);
      break;
    case 'session:end':
      handleSessionEnd(ws, sessions);
      break;
    default:
      send(ws, {
        type: 'error',
        code: 'invalid_message',
        message: `Unknown message type: ${message['type'] as string}`,
      });
  }
}

function handleSessionStart(
  ws: WebSocket,
  message: Record<string, unknown>,
  sessions: Map<WebSocket, SessionState>,
  userId: string,
): void {
  const sessionId = message['sessionId'] as string | undefined;
  const childId = message['childId'] as string | undefined;
  const storyId = message['storyId'] as string | undefined;

  if (!sessionId || !childId || !storyId) {
    ws.close(4002, 'Invalid session: missing sessionId, childId, or storyId');
    return;
  }

  const idleTimer = setTimeout(() => {
    ws.close(1000, 'Idle timeout');
    sessions.delete(ws);
  }, IDLE_TIMEOUT_MS);

  sessions.set(ws, { sessionId, userId, childId, storyId, idleTimer });
  send(ws, { type: 'session:ready', sessionId });
}

function handleSessionEnd(
  ws: WebSocket,
  sessions: Map<WebSocket, SessionState>,
): void {
  const session = sessions.get(ws);
  if (!session) {
    send(ws, { type: 'error', code: 'invalid_message', message: 'No active session' });
    return;
  }
  clearTimeout(session.idleTimer);
  sessions.delete(ws);

  // TODO: compute real summary from STT provider and persist to Supabase
  send(ws, {
    type: 'session:summary',
    sessionId: session.sessionId,
    summary: {
      sessionId: session.sessionId,
      childId: session.childId,
      storyId: session.storyId,
      accuracyPercent: 0,
      wordsRead: 0,
      wordsCorrect: 0,
      durationMs: 0,
      struggledWords: [],
    },
  });

  ws.close(1000, 'Session ended');
}
