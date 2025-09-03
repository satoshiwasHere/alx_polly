"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewPollPage() {
  return (
    <section className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Create a new poll</h1>
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="What should we build next?" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Optional description" />
        </div>
        <div className="space-y-2">
          <Label>Options</Label>
          <div className="grid gap-2">
            <Input placeholder="Option 1" />
            <Input placeholder="Option 2" />
          </div>
        </div>
        <Button type="submit">Create</Button>
      </form>
    </section>
  );
}


