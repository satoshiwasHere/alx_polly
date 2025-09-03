import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // This route is handled by the WebSocket server in the custom server
  // The actual WebSocket upgrade happens in the server configuration
  return new Response('WebSocket endpoint', { status: 200 });
}

