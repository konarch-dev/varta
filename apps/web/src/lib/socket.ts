import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getWsUrl = (): string => {
  if (typeof window === 'undefined') return 'http://localhost:3001';
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '');
  }
  return 'http://localhost:3001';
};

export const getSocket = (token?: string | null): Socket => {
  const wsUrl = getWsUrl();
  const authToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('varta_token') : null);

  if (!socket) {
    socket = io(wsUrl, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to VARTA WebSocket gateway:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ WebSocket connection error:', err.message);
    });
  } else if (authToken && (socket.auth as Record<string, any>)?.token !== authToken) {
    socket.auth = { token: authToken };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
