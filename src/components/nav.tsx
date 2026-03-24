"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Nav() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-primary">
            Budget Commander
          </Link>
          <div className="hidden gap-4 md:flex">
            <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground">
              Leaderboard
            </Link>
            <Link href="/games" className="text-sm text-muted-foreground hover:text-foreground">
              Games
            </Link>
            <Link href="/poll" className="text-sm text-muted-foreground hover:text-foreground">
              Poll
            </Link>
          </div>
        </div>

        <div>
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="flex items-center gap-2" />
                }
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback>{session.user.name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm md:inline">{session.user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/decks/new")}>
                  Register Deck
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/games/new")}>
                  Log Game
                </DropdownMenuItem>
                {(session.user as any).role === "ADMIN" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/register")}
                className="border-secondary/50 text-secondary hover:bg-secondary/10"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
