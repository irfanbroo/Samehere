const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'samehere_jwt_secret_change_me';
const PORT = process.env.PORT || 3001;

const wss = new WebSocketServer({ port: PORT });

// userId -> Set of ws connections (supports multiple tabs)
const clients = new Map();

function getUser(token) {
  try { return jwt.verify(token, JWT_SECRET); }
  catch { return null; }
}

function send(ws, data) {
  if (ws.readyState === 1) ws.send(JSON.stringify(data));
}

function sendToUser(userId, data) {
  const sockets = clients.get(userId);
  if (sockets) sockets.forEach(ws => send(ws, data));
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const user = getUser(token);

  if (!user) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  // Register connection
  if (!clients.has(user.id)) clients.set(user.id, new Set());
  clients.get(user.id).add(ws);

  console.log(`User ${user.id} (${user.username}) connected. Online: ${clients.size}`);

  // Send online status
  send(ws, { type: 'connected', userId: user.id });

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    switch (data.type) {
      case 'message':
        // Relay message to receiver in real-time
        sendToUser(data.receiverId, {
          type: 'message',
          message: {
            id: data.tempId,
            sender_id: user.id,
            sender_username: user.username,
            receiver_id: data.receiverId,
            content: data.content,
            created_at: new Date().toISOString(),
          }
        });
        // Also echo back to sender (for other tabs)
        clients.get(user.id)?.forEach(s => {
          if (s !== ws) send(s, {
            type: 'message',
            message: {
              id: data.tempId,
              sender_id: user.id,
              sender_username: user.username,
              receiver_id: data.receiverId,
              content: data.content,
              created_at: new Date().toISOString(),
            }
          });
        });
        break;

      case 'typing':
        sendToUser(data.receiverId, {
          type: 'typing',
          userId: user.id,
          username: user.username,
        });
        break;

      case 'stop_typing':
        sendToUser(data.receiverId, {
          type: 'stop_typing',
          userId: user.id,
        });
        break;

      case 'read':
        sendToUser(data.senderId, {
          type: 'read',
          readBy: user.id,
        });
        break;
    }
  });

  ws.on('close', () => {
    const sockets = clients.get(user.id);
    if (sockets) {
      sockets.delete(ws);
      if (sockets.size === 0) clients.delete(user.id);
    }
    console.log(`User ${user.id} disconnected. Online: ${clients.size}`);
  });
});

console.log(`Same Here WS running on :${PORT}`);
