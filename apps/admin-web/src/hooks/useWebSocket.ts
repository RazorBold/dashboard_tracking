import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

interface WebSocketMessage {
  type: string;
  data: unknown;
}

type MessageHandler = (message: WebSocketMessage) => void;

export function useWebSocket(onMessage: MessageHandler) {
  const token = useAuthStore((s) => s.token);
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef<MessageHandler>(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!token) return;

    const wsBase = import.meta.env.VITE_WS_URL ||
      (window.location.protocol === 'https:' ? 'wss' : 'ws') +
      `://${window.location.hostname}:3001`;

    const url = `${wsBase}/api/ws/tracking?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WebSocketMessage;
        onMessageRef.current(msg);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      // Silent — connection may not be available in dev without API running
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token]);
}
