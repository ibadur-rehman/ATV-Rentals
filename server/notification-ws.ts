import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import type { Notification } from '@shared/schema';
import type { IncomingMessage } from 'http';
import type { RequestHandler } from 'express';

let wss: WebSocketServer | null = null;
// Map of userId to Set of WebSocket clients
const userClients = new Map<string, Set<WebSocket>>();
let sessionParser: RequestHandler | null = null;

interface NotificationMessage {
  type: 'new_notification';
  notification: Notification;
}

interface UnreadCountMessage {
  type: 'unread_count_update';
  count: number;
}

type WebSocketMessage = NotificationMessage | UnreadCountMessage;

/**
 * Initialize WebSocket server
 */
export function initWebSocketServer(server: Server, expressSessionMiddleware: RequestHandler) {
  if (!expressSessionMiddleware) {
    throw new Error('[WebSocket] Session middleware is required but was not provided');
  }

  wss = new WebSocketServer({ noServer: true });
  sessionParser = expressSessionMiddleware;

  console.log('[WebSocket] Session middleware configured for WebSocket authentication');

  // Handle upgrade to WebSocket with session parsing
  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    if (request.url && request.url.startsWith('/ws/notifications')) {
      // Guard: Ensure session parser is available
      if (!sessionParser) {
        console.error('[WebSocket] SECURITY ERROR: Session parser not available during upgrade');
        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
        socket.destroy();
        return;
      }

      // Use the existing session middleware to parse session from cookies
      sessionParser(request as any, {} as any, () => {
        const userId = (request as any).session?.userId;
        
        if (!userId) {
          console.log('[WebSocket] Rejecting connection: no authenticated user session found');
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        console.log(`[WebSocket] Authenticated session found for user ${userId}`);
        wss!.handleUpgrade(request, socket, head, (ws) => {
          wss!.emit('connection', ws, request, userId);
        });
      });
    }
  });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage, userId: string) => {
    console.log(`[WebSocket] User ${userId} connected`);
    
    // Add client to user's set
    if (!userClients.has(userId)) {
      userClients.set(userId, new Set());
    }
    userClients.get(userId)!.add(ws);

    // Send initial connection message
    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to notification service', userId }));

    ws.on('close', () => {
      console.log(`[WebSocket] User ${userId} disconnected`);
      const clientSet = userClients.get(userId);
      if (clientSet) {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          userClients.delete(userId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for user ${userId}:`, error);
      const clientSet = userClients.get(userId);
      if (clientSet) {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          userClients.delete(userId);
        }
      }
    });

    // Heartbeat to keep connection alive
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(interval);
      }
    }, 30000); // Ping every 30 seconds

    ws.on('close', () => clearInterval(interval));
  });

  wss.on('error', (error) => {
    console.error('[WebSocket] Server error:', error);
  });

  console.log('[WebSocket] Notification WebSocket server initialized on path /ws/notifications');
}

/**
 * Broadcast a new notification to the specific user who owns it
 */
export function broadcastNotification(notification: Notification, userId: string) {
  if (!wss) {
    console.warn('[WebSocket] WebSocket server not initialized');
    return;
  }

  const message: NotificationMessage = {
    type: 'new_notification',
    notification,
  };

  const messageStr = JSON.stringify(message);
  const clientSet = userClients.get(userId);

  if (!clientSet || clientSet.size === 0) {
    console.log(`[WebSocket] No connected clients for user ${userId}`);
    return;
  }

  let sentCount = 0;
  clientSet.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error('[WebSocket] Error sending to client:', error);
        clientSet.delete(client);
      }
    } else {
      clientSet.delete(client);
    }
  });

  console.log(`[WebSocket] Broadcasted notification to ${sentCount} client(s) for user ${userId}`);
}

/**
 * Broadcast unread count update to a specific user
 */
export function broadcastUnreadCount(userId: string, count: number) {
  if (!wss) {
    console.warn('[WebSocket] WebSocket server not initialized');
    return;
  }

  const message: UnreadCountMessage = {
    type: 'unread_count_update',
    count,
  };

  const messageStr = JSON.stringify(message);
  const clientSet = userClients.get(userId);

  if (!clientSet || clientSet.size === 0) {
    return;
  }

  let sentCount = 0;
  clientSet.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageStr);
        sentCount++;
      } catch (error) {
        console.error('[WebSocket] Error sending to client:', error);
        clientSet.delete(client);
      }
    } else {
      clientSet.delete(client);
    }
  });

  console.log(`[WebSocket] Broadcasted unread count (${count}) to ${sentCount} client(s) for user ${userId}`);
}

/**
 * Get the number of connected clients for a specific user
 */
export function getConnectedClientsCount(userId?: string): number {
  if (userId) {
    return userClients.get(userId)?.size || 0;
  }
  // Total connected clients
  let total = 0;
  userClients.forEach((clientSet) => {
    total += clientSet.size;
  });
  return total;
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer() {
  if (wss) {
    userClients.forEach((clientSet) => {
      clientSet.forEach((client) => {
        client.close();
      });
    });
    userClients.clear();
    wss.close();
    wss = null;
    console.log('[WebSocket] WebSocket server closed');
  }
}
