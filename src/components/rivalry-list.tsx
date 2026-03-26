"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RivalryRecord } from "@/lib/league";

export function RivalryList({ rivalries }: { rivalries: RivalryRecord[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {rivalries.map((rivalry) => (
        <div key={rivalry.opponentId}>
          <button
            type="button"
            onClick={() =>
              setExpanded(expanded === rivalry.opponentId ? null : rivalry.opponentId)
            }
            className="flex w-full items-center justify-between rounded-lg bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{rivalry.opponentName[0]}</AvatarFallback>
              </Avatar>
              <Link
                href={`/players/${rivalry.opponentId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium hover:underline"
              >
                {rivalry.opponentName}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">
                <span className="text-green-400">{rivalry.wins}W</span>
                {" - "}
                <span className="text-red-400">{rivalry.losses}L</span>
                <span className="text-muted-foreground ml-2">({rivalry.games} games)</span>
              </span>
              {expanded === rivalry.opponentId ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
          {expanded === rivalry.opponentId && (
            <div className="mt-1 ml-11 space-y-1 text-sm">
              {rivalry.gameIds.map((gameId) => (
                <Link
                  key={gameId}
                  href={`/games/${gameId}`}
                  className="block text-muted-foreground hover:text-foreground hover:underline"
                >
                  Game {gameId.slice(0, 8)}...
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
