import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './logger';
import jwt from 'jsonwebtoken';
import { env } from './env';

interface ExtWebSocket extends WebSocket {
  userId?: string;
}

export let wss: WebSocketServer;

export const initWebSocket = (server: HTTPServer) => {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url?.split('?')[0];
    if (pathname === '/api/ws/tracking') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        const url = new URL(request.url!, `http://${request.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        try {
          const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;
          (ws as ExtWebSocket).userId = payload.sub;
          wss.emit('connection', ws, request);
        } catch (err) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: ExtWebSocket) => {
    logger.info({ userId: ws.userId }, '🟢 WebSocket client connected');

    ws.on('close', () => {
      logger.info({ userId: ws.userId }, '🔴 WebSocket client disconnected');
    });
  });
};

export const broadcastLocation = (location: any) => {
  if (!wss) return;
  const message = JSON.stringify({ type: 'LOCATION_UPDATE', data: location });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

export const broadcastAlert = (alert: any) => {
  if (!wss) return;
  const message = JSON.stringify({ type: 'NEW_ALERT', data: alert });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
