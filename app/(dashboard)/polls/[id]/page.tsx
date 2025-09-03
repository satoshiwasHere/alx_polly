"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { WebSocketClient } from "@/lib/websocket-client";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  options: PollOption[];
}

interface PollDetailPageProps {
  params: { id: string };
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    fetchPoll();
    setupWebSocket();
    
    return () => {
      if (wsClient) {
        wsClient.disconnect();
      }
    };
  }, [params.id]);

  const setupWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    
    const client = new WebSocketClient(wsUrl, (data) => {
      if (data.type === 'VOTE_UPDATE' && data.pollId === params.id) {
        setPoll(data.poll);
      }
    });
    
    client.connect();
    setWsClient(client);
  };

  const fetchPoll = async () => {
    try {
      const response = await fetch(`/api/polls/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPoll(data.poll);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption || !poll) return;
    
    setVoting(true);
    try {
      const response = await fetch(`/api/polls/${params.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId: selectedOption }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPoll(data.poll);
        setSelectedOption(null);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const getTotalVotes = () => {
    return poll?.options.reduce((sum, option) => sum + option.votes, 0) || 0;
  };

  const getVotePercentage = (votes: number) => {
    const total = getTotalVotes();
    return total > 0 ? (votes / total) * 100 : 0;
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!poll) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Poll not found</h1>
        <p className="text-muted-foreground">The poll you're looking for doesn't exist.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">{poll.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Total votes: {getTotalVotes()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vote Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="vote"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <span className="font-medium">{option.text}</span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {option.votes} votes
                </span>
              </div>
              
              <div className="space-y-1">
                <Progress value={getVotePercentage(option.votes)} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {getVotePercentage(option.votes).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
          
          <div className="pt-4">
            <Button
              onClick={handleVote}
              disabled={!selectedOption || voting}
              className="w-full"
            >
              {voting ? 'Recording Vote...' : 'Submit Vote'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Votes update in real-time! 🚀</p>
      </div>
    </section>
  );
}


