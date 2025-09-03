import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PollsPage() {
  const samplePoll = {
    id: '1',
    title: 'What should we build next?',
    totalVotes: 35,
    options: [
      { text: 'Mobile App', votes: 12 },
      { text: 'Web Dashboard', votes: 8 },
      { text: 'API Service', votes: 15 }
    ]
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Polls</h1>
        <Button asChild>
          <Link href="/polls/new">Create Poll</Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{samplePoll.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {samplePoll.totalVotes} total votes
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {samplePoll.options.map((option, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{option.text}</span>
                <span className="text-sm text-muted-foreground">
                  {option.votes} votes
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button asChild variant="outline" className="w-full">
              <Link href={`/polls/${samplePoll.id}`}>
                View & Vote
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}


