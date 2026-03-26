"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatUsd } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DeckForm({
  activeSeasonName,
  activeBudgetCap,
}: {
  activeSeasonName?: string | null;
  activeBudgetCap?: number | null;
}) {
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
      externalLink: (formData.get("externalLink") as string)?.trim() || undefined,
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
        <CardDescription>
          Add a public Archidekt list and we&apos;ll use it to verify the deck when you
          submit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deck Name</Label>
            <Input id="name" name="name" required placeholder="e.g., Zombies Unleashed" className="bg-muted border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="externalLink">Decklist Link</Label>
            <Input
              id="externalLink"
              name="externalLink"
              type="url"
              required
              placeholder="https://archidekt.com/decks/..."
              className="bg-muted border-border"
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <h2 className="font-medium">Deck Rules</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeBudgetCap != null
                ? `${activeSeasonName} is currently capped at ${formatUsd(activeBudgetCap)}.`
                : "Use a public Archidekt list so we can read your deck correctly."}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Basic lands do not count toward the deck cost.</li>
              <li>
                When you submit a deck, we check the current TCG price of the selected
                cards in that list.
              </li>
              <li>Proxies are allowed.</li>
              <li>Your deck link must be a public Archidekt deck.</li>
              <li>
                Your commander is pulled from the list automatically, so make sure it is
                tagged correctly there.
              </li>
            </ul>
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
