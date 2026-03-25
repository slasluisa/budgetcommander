"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

export function Nav() {
  const { data: session } = useSession();
  const userRole =
    session?.user && "role" in session.user ? session.user.role : undefined;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="transition-transform duration-200 hover:scale-[1.01]">
            <BrandLogo
              markClassName="h-9 w-9"
              className="gap-2.5"
              title="Budget Commander League home"
            />
          </Link>
          <div className="hidden gap-4 md:flex">
            <Link
              href="/games"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Games
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Standings
            </Link>
            <Link
              href="/seasons"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Seasons
            </Link>
            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Admin
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <>
              <Link
                href="/games/new"
                className={cn(
                  buttonVariants(),
                  "hidden gap-1.5 bg-gradient-to-r from-primary to-secondary md:inline-flex"
                )}
              >
                <Plus className="h-4 w-4" />
                Log Game
              </Link>
              <Link href="/profile" className="hidden md:block">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback>
                    {session.user.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className={
                  buttonVariants({ variant: "outline", size: "sm" }) +
                  " border-primary/50 text-primary hover:bg-primary/10"
                }
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className={
                  buttonVariants({ variant: "outline", size: "sm" }) +
                  " border-secondary/50 text-secondary hover:bg-secondary/10"
                }
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
