"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DeckForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      commander: formData.get("commander") as string,
      externalLink: (formData.get("externalLink") as string) || undefined,
    };

    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to create deck");
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Register a New Deck</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deck Name</Label>
            <Input id="name" name="name" required placeholder="e.g., Zombies Unleashed" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commander">Commander</Label>
            <Input id="commander" name="commander" required placeholder="e.g., Wilhelt, the Rotcleaver" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalLink">Decklist Link (optional)</Label>
            <Input
              id="externalLink"
              name="externalLink"
              type="url"
              placeholder="https://www.moxfield.com/decks/..."
              className="bg-muted border-border"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Registering..." : "Register Deck"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
