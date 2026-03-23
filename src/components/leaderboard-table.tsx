import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PlayerStats = {
  id: string;
  username: string;
  avatar: string | null;
  wins: number;
  losses: number;
  winRate: number;
};

export function LeaderboardTable({ players }: { players: PlayerStats[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="w-12 text-muted-foreground">Rank</TableHead>
          <TableHead className="text-muted-foreground">Player</TableHead>
          <TableHead className="text-center text-muted-foreground">Wins</TableHead>
          <TableHead className="text-center text-muted-foreground">Losses</TableHead>
          <TableHead className="text-center text-muted-foreground">Win Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, idx) => (
          <TableRow key={player.id} className="border-border hover:bg-muted/20">
            <TableCell>
              <Badge
                variant={idx < 3 ? "default" : "outline"}
                className={
                  idx === 0
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : idx === 1
                    ? "bg-gray-400/20 text-gray-300 border-gray-400/30"
                    : idx === 2
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                    : "border-border text-muted-foreground"
                }
              >
                #{idx + 1}
              </Badge>
            </TableCell>
            <TableCell>
              <Link href={`/players/${player.id}`} className="flex items-center gap-2 hover:text-primary">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={player.avatar ?? undefined} />
                  <AvatarFallback>{player.username[0]}</AvatarFallback>
                </Avatar>
                {player.username}
              </Link>
            </TableCell>
            <TableCell className="text-center text-green-400">{player.wins}</TableCell>
            <TableCell className="text-center text-red-400">{player.losses}</TableCell>
            <TableCell className="text-center">
              <span className="text-accent">{player.winRate.toFixed(1)}%</span>
            </TableCell>
          </TableRow>
        ))}
        {players.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No games played yet.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
