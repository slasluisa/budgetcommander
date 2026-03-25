"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PollResults } from "@/lib/poll";
import { cn } from "@/lib/utils";

type PollWidgetProps = {
  results: PollResults;
  title?: string;
  description?: string;
  className?: string;
  showAuthPrompt?: boolean;
};

export function PollWidget({
  results,
  title,
  description,
  className,
  showAuthPrompt = false,
}: PollWidgetProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<number | null>(results.userVote);
  const [loading, setLoading] = useState(false);

  const choices = [20, 50, 100];

  async function handleVote(choice: number) {
    if (results.locked || !session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice }),
      });
      if (res.ok) {
        setSelected(choice);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className={cn("border-border bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="text-center">
          {title ??
            (results.locked
              ? `Budget Set: $${results.budgetCap}`
              : "Vote for the Budget Cap")}
        </CardTitle>
        {description ? (
          <CardDescription className="text-center">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {choices.map((choice) => {
          const vote = results.votes.find((v) => v.choice === choice);
          const count = vote?.count ?? 0;
          const pct = vote?.percentage ?? 0;

          return (
            <div key={choice} className="space-y-1">
              <div className="flex items-center justify-between">
                <Button
                  variant={selected === choice ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleVote(choice)}
                  disabled={results.locked || !session || loading}
                  className={
                    selected === choice
                      ? "bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }
                >
                  ${choice}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {count} vote{count !== 1 ? "s" : ""} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        <p className="text-center text-xs text-muted-foreground">
          {results.total} total vote{results.total !== 1 ? "s" : ""}
        </p>
        {!results.locked && session?.user && selected !== null ? (
          <p className="text-center text-xs text-muted-foreground">
            Your current vote is set to ${selected}. You can change it while the poll is open.
          </p>
        ) : null}
        {!results.locked && !session?.user && showAuthPrompt ? (
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium">Sign up or sign in to cast your vote.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                Sign Up
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
