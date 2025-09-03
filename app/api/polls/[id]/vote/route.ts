import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (replace with database in production)
let polls: Record<string, { id: string; title: string; options: { id: string; text: string; votes: number }[] }> = {
  '1': {
    id: '1',
    title: 'What should we build next?',
    options: [
      { id: '1', text: 'Mobile App', votes: 12 },
      { id: '2', text: 'Web Dashboard', votes: 8 },
      { id: '3', text: 'API Service', votes: 15 }
    ]
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { optionId } = await request.json();
    const pollId = params.id;
    
    const poll = polls[pollId];
    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }
    
    const option = poll.options.find(opt => opt.id === optionId);
    if (!option) {
      return NextResponse.json({ error: 'Option not found' }, { status: 404 });
    }
    
    // Increment vote count
    option.votes += 1;
    
    // Broadcast vote update to WebSocket clients
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
    
    return NextResponse.json({ success: true, poll });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pollId = params.id;
  const poll = polls[pollId];
  
  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }
  
  return NextResponse.json({ poll });
}
