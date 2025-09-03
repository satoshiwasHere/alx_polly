import { WebSocketServer } from 'ws';

declare global {
  var wss: WebSocketServer | undefined;
}

export function createWebSocketServer(server: any) {
  if (global.wss) {
    return global.wss;
  }

  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  global.wss = wss;
  return wss;
}

export function broadcastVoteUpdate(pollId: string, poll: any) {
  if (global.wss) {
    global.wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'VOTE_UPDATE',
          pollId,
          poll
        }));
      }
    });
  }
}

