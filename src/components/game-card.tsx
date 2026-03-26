import Link from "next/link";
import { formatUsdFromCents } from "@/lib/currency";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPendingAgeLabel, isGameOverdue } from "@/lib/league";

type GameCardProps = {
  game: {
    id: string;
    status: string;
    createdAt: string;
    lastReminderAt?: string | null;
    season: { name: string };
    players: {
      isWinner: boolean;
      confirmed: boolean;
      user: { id: string; name: string; avatar: string | null };
      deck: { name: string; commander: string; validatedPriceCents: number | null } | null;
    }[];
  };
};

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/games/${game.id}`}>
      <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">
              {new Date(game.createdAt).toLocaleDateString()}
            </span>
            <Badge
              variant="outline"
              className={
                game.status === "CONFIRMED"
                  ? "border-green-500/30 text-green-400"
                  : game.status === "DISPUTED"
                  ? "border-red-500/30 text-red-400"
                  : game.status === "CANCELLED"
                  ? "border-slate-500/30 text-slate-300"
                  : "border-yellow-500/30 text-yellow-400"
              }
            >
              {game.status}
            </Badge>
          </div>
          {game.status === "PENDING" && (
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-border text-muted-foreground">
                {getPendingAgeLabel(game.createdAt)}
              </Badge>
              {isGameOverdue(game.createdAt) && (
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                  Overdue
                </Badge>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {game.players.map((p) => (
              <div
                key={p.user.id}
                className={`flex items-center gap-2 rounded-md p-2 ${
                  p.isWinner ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={p.user.avatar ?? undefined} />
                  <AvatarFallback className="text-xs">{p.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm truncate">{p.user.name}</p>
                  {p.deck && (
                    <p className="text-xs text-muted-foreground truncate">
                      {p.deck.commander}
                      {p.deck.validatedPriceCents != null
                        ? ` • ${formatUsdFromCents(p.deck.validatedPriceCents)}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
