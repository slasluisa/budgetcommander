# Budget Commander League Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Budget Commander MTG league management site with auth, deck registration, game logging with mutual confirmation, budget polls, leaderboards, and admin controls.

**Architecture:** Next.js 14 App Router with server components and route handlers for API. Prisma ORM connects to Vercel Postgres. NextAuth v5 handles Discord + Google OAuth. Tailwind CSS + shadcn/ui provides the UI layer with a custom dark purple/blue theme.

**Tech Stack:** Next.js 14, TypeScript, Prisma, Vercel Postgres, NextAuth v5, Tailwind CSS, shadcn/ui

---

## File Structure

```
budgetcommander/
├── prisma/
│   └── schema.prisma              # Data model definitions
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (theme, nav, providers)
│   │   ├── page.tsx               # Home page
│   │   ├── globals.css            # Tailwind + custom theme CSS
│   │   ├── leaderboard/
│   │   │   └── page.tsx           # Leaderboard page
│   │   ├── games/
│   │   │   ├── page.tsx           # Game history list
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # Log a new game
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Game detail + confirm/dispute
│   │   ├── players/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Player profile
│   │   ├── poll/
│   │   │   └── page.tsx           # Budget poll
│   │   ├── dashboard/
│   │   │   └── page.tsx           # User dashboard
│   │   ├── decks/
│   │   │   └── new/
│   │   │       └── page.tsx       # Register deck form
│   │   ├── admin/
│   │   │   └── page.tsx           # Admin panel
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts   # NextAuth handler
│   │       ├── poll/
│   │       │   └── vote/
│   │       │       └── route.ts   # Cast/update poll vote
│   │       ├── decks/
│   │       │   ├── route.ts       # GET list, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts   # DELETE (archive) deck
│   │       ├── games/
│   │       │   ├── route.ts       # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts   # GET game detail
│   │       │       ├── confirm/
│   │       │       │   └── route.ts # POST confirm
│   │       │       └── dispute/
│   │       │           └── route.ts # POST dispute
│   │       └── admin/
│   │           ├── poll/
│   │           │   └── lock/
│   │           │       └── route.ts # POST lock poll
│   │           ├── seasons/
│   │           │   ├── route.ts     # POST create season
│   │           │   └── [id]/
│   │           │       └── end/
│   │           │           └── route.ts # POST end season
│   │           ├── games/
│   │           │   └── [id]/
│   │           │       └── resolve/
│   │           │           └── route.ts # POST resolve dispute
│   │           └── users/
│   │               └── [id]/
│   │                   └── ban/
│   │                       └── route.ts # POST ban user
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config + helpers
│   │   └── utils.ts               # shadcn cn() utility
│   └── components/
│       ├── ui/                    # shadcn/ui components (auto-generated)
│       ├── nav.tsx                # Top navigation bar
│       ├── providers.tsx          # Session + theme providers
│       ├── poll-widget.tsx        # Poll voting/results component
│       ├── leaderboard-table.tsx  # Leaderboard data table
│       ├── game-card.tsx          # Game summary card
│       └── deck-form.tsx          # Deck registration form
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## Task 1: Project Scaffolding & Dependencies

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/lib/utils.ts`, `postcss.config.js`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/solomon/code/budgetcommander
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This scaffolds the project with App Router, TypeScript, Tailwind, and ESLint.

- [ ] **Step 2: Install core dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter
npm install -D @types/node
```

- [ ] **Step 3: Install and initialize shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 4: Add shadcn/ui components we'll need**

```bash
npx shadcn@latest add button card input label select table badge avatar dropdown-menu dialog toast tabs
```

- [ ] **Step 5: Customize Tailwind config for MTG Mystic theme**

Replace the `tailwind.config.ts` content with the custom dark purple/blue theme. Extend the default shadcn config:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a0a2e",
        foreground: "#e2e8f0",
        card: {
          DEFAULT: "rgba(30, 15, 60, 0.8)",
          foreground: "#e2e8f0",
        },
        primary: {
          DEFAULT: "#7c3aed",
          foreground: "#f8fafc",
        },
        secondary: {
          DEFAULT: "#3b82f6",
          foreground: "#f8fafc",
        },
        muted: {
          DEFAULT: "#16213e",
          foreground: "#94a3b8",
        },
        accent: {
          DEFAULT: "#a78bfa",
          foreground: "#f8fafc",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#f8fafc",
        },
        border: "rgba(139, 92, 246, 0.3)",
        input: "rgba(139, 92, 246, 0.2)",
        ring: "#7c3aed",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      backgroundImage: {
        "mystic-gradient": "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0a1628 100%)",
        "mystic-glow": "radial-gradient(circle at 30% 40%, rgba(139, 92, 246, 0.15), transparent 60%), radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.1), transparent 50%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
```

- [ ] **Step 6: Update globals.css with base theme styles**

Update `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-foreground;
    background-image: linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0a1628 100%);
    min-height: 100vh;
  }
}
```

- [ ] **Step 7: Create a minimal root layout**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Commander League",
  description: "MTG Budget Commander League Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Create a placeholder home page**

Update `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-primary">Budget Commander League</h1>
      <p className="mt-4 text-muted-foreground">Coming soon...</p>
    </main>
  );
}
```

- [ ] **Step 9: Verify the app runs**

```bash
npm run dev
```

Open http://localhost:3000 — should see "Budget Commander League" with the dark purple theme.

- [ ] **Step 10: Add .gitignore entries and commit**

Add `.superpowers/` to `.gitignore`, then:

```bash
echo ".superpowers/" >> .gitignore
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and shadcn/ui mystic theme"
```

---

## Task 2: Prisma Schema & Database Setup

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`
- Create: `.env.local` (not committed — add to .gitignore)

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init
```

- [ ] **Step 2: Create .env.local with database URL placeholder**

Create `.env.local`:

```
# Get this from Vercel Postgres dashboard
POSTGRES_PRISMA_URL="postgresql://user:pass@host:5432/dbname?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:pass@host:5432/dbname"
```

Ensure `.env.local` is in `.gitignore` (Next.js does this by default).

- [ ] **Step 3: Write the Prisma schema**

Replace `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

enum Role {
  PLAYER
  ADMIN
}

enum SeasonStatus {
  POLLING
  ACTIVE
  COMPLETED
}

enum GameStatus {
  PENDING
  CONFIRMED
  DISPUTED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  avatar    String?
  role      Role     @default(PLAYER)
  banned    Boolean  @default(false)
  createdAt DateTime @default(now())

  accounts    Account[]
  sessions    Session[]
  decks       Deck[]
  pollVotes   PollVote[]
  gamePlayers GamePlayer[]
  gamesCreated Game[] @relation("GameCreator")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Deck {
  id           String   @id @default(cuid())
  userId       String
  name         String
  commander    String
  externalLink String?
  archived     Boolean  @default(false)
  createdAt    DateTime @default(now())

  user        User         @relation(fields: [userId], references: [id])
  gamePlayers GamePlayer[]
}

model Season {
  id        String       @id @default(cuid())
  name      String
  budgetCap Int?
  status    SeasonStatus @default(POLLING)
  createdAt DateTime     @default(now())

  pollVotes PollVote[]
  games     Game[]
}

model PollVote {
  id       String @id @default(cuid())
  seasonId String
  userId   String
  choice   Int

  season Season @relation(fields: [seasonId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@unique([seasonId, userId])
}

model Game {
  id          String     @id @default(cuid())
  seasonId    String
  createdById String
  status      GameStatus @default(PENDING)
  createdAt   DateTime   @default(now())

  season    Season       @relation(fields: [seasonId], references: [id])
  createdBy User         @relation("GameCreator", fields: [createdById], references: [id])
  players   GamePlayer[]
}

model GamePlayer {
  id        String  @id @default(cuid())
  gameId    String
  userId    String
  deckId    String?
  isWinner  Boolean @default(false)
  confirmed Boolean @default(false)

  game Game  @relation(fields: [gameId], references: [id])
  user User  @relation(fields: [userId], references: [id])
  deck Deck? @relation(fields: [deckId], references: [id])

  @@unique([gameId, userId])
}
```

- [ ] **Step 4: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Generate Prisma client**

```bash
npx prisma generate
```

Expected: "Prisma Client generated successfully"

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts
git commit -m "feat: add Prisma schema with all data models"
```

---

## Task 3: Authentication (NextAuth v5 with Discord + Google)

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/components/providers.tsx`, `src/components/nav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add env vars to .env.local**

Add to `.env.local`:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-secret-here

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

- [ ] **Step 2: Create NextAuth config**

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Discord from "next-auth/providers/discord";
import Google from "next-auth/providers/google";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id! },
        select: { banned: true },
      });
      if (dbUser?.banned) return false;
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, banned: true },
        });
        (session.user as any).role = dbUser?.role ?? "PLAYER";
        (session.user as any).banned = dbUser?.banned ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
```

- [ ] **Step 3: Create the NextAuth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create session provider wrapper**

Create `src/components/providers.tsx`:

```tsx
"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

- [ ] **Step 5: Create navigation bar with login/logout**

Create `src/components/nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
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
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback>{session.user.name?.[0] ?? "?"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm md:inline">{session.user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/decks/new">Register Deck</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/games/new">Log Game</Link>
                </DropdownMenuItem>
                {(session.user as any).role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin</Link>
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
                onClick={() => signIn("discord")}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                Discord
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn("google")}
                className="border-secondary/50 text-secondary hover:bg-secondary/10"
              >
                Google
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 6: Update root layout with providers and nav**

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Commander League",
  description: "MTG Budget Commander League Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify app compiles**

```bash
npm run build
```

Expected: Build succeeds (auth won't work without real OAuth credentials, but it should compile).

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth/ src/components/providers.tsx src/components/nav.tsx src/app/layout.tsx
git commit -m "feat: add NextAuth v5 with Discord + Google providers and nav bar"
```

---

## Task 4: Season & Poll API Routes

**Files:**
- Create: `src/app/api/admin/seasons/route.ts`, `src/app/api/admin/seasons/[id]/end/route.ts`, `src/app/api/admin/poll/lock/route.ts`, `src/app/api/poll/vote/route.ts`

- [ ] **Step 1: Create admin seasons route (create season)**

Create `src/app/api/admin/seasons/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const activeSeason = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE"] } },
  });
  if (activeSeason) {
    return NextResponse.json(
      { error: "A season is already active or polling. End it first." },
      { status: 400 }
    );
  }

  const season = await prisma.season.create({
    data: { name, status: "POLLING" },
  });

  return NextResponse.json(season, { status: 201 });
}
```

- [ ] **Step 2: Create end season route**

Create `src/app/api/admin/seasons/[id]/end/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const season = await prisma.season.findUnique({ where: { id } });
  if (!season || season.status === "COMPLETED") {
    return NextResponse.json({ error: "Season not found or already completed" }, { status: 400 });
  }

  const updated = await prisma.season.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Step 3: Create poll vote route**

Create `src/app/api/poll/vote/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { choice } = await request.json();
  if (![20, 50, 100].includes(choice)) {
    return NextResponse.json({ error: "Choice must be 20, 50, or 100" }, { status: 400 });
  }

  const pollingSeason = await prisma.season.findFirst({
    where: { status: "POLLING" },
  });
  if (!pollingSeason) {
    return NextResponse.json({ error: "No active poll" }, { status: 400 });
  }

  const vote = await prisma.pollVote.upsert({
    where: {
      seasonId_userId: {
        seasonId: pollingSeason.id,
        userId: session.user.id,
      },
    },
    update: { choice },
    create: {
      seasonId: pollingSeason.id,
      userId: session.user.id,
      choice,
    },
  });

  return NextResponse.json(vote);
}
```

- [ ] **Step 4: Create poll lock route**

Create `src/app/api/admin/poll/lock/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  const pollingSeason = await prisma.season.findFirst({
    where: { status: "POLLING" },
  });
  if (!pollingSeason) {
    return NextResponse.json({ error: "No season in polling phase" }, { status: 400 });
  }

  let winningChoice: number;

  if (body.choice && [20, 50, 100].includes(body.choice)) {
    // Admin override for tie-breaking
    winningChoice = body.choice;
  } else {
    // Count votes and pick winner
    const votes = await prisma.pollVote.groupBy({
      by: ["choice"],
      where: { seasonId: pollingSeason.id },
      _count: { choice: true },
      orderBy: { _count: { choice: "desc" } },
    });

    if (votes.length === 0) {
      return NextResponse.json({ error: "No votes cast" }, { status: 400 });
    }

    // Check for tie
    if (votes.length > 1 && votes[0]._count.choice === votes[1]._count.choice) {
      return NextResponse.json(
        {
          error: "Tie detected. Provide a 'choice' param to break the tie.",
          tied: votes
            .filter((v) => v._count.choice === votes[0]._count.choice)
            .map((v) => v.choice),
        },
        { status: 409 }
      );
    }

    winningChoice = votes[0].choice;
  }

  const updated = await prisma.season.update({
    where: { id: pollingSeason.id },
    data: { budgetCap: winningChoice, status: "ACTIVE" },
  });

  return NextResponse.json(updated);
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/ src/app/api/poll/
git commit -m "feat: add season management and poll voting API routes"
```

---

## Task 5: Deck API Routes

**Files:**
- Create: `src/app/api/decks/route.ts`, `src/app/api/decks/[id]/route.ts`

- [ ] **Step 1: Create decks list + create route**

Create `src/app/api/decks/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decks = await prisma.deck.findMany({
    where: { userId: session.user.id, archived: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(decks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, commander, externalLink } = await request.json();
  if (!name || !commander) {
    return NextResponse.json({ error: "Name and commander are required" }, { status: 400 });
  }

  const deck = await prisma.deck.create({
    data: {
      userId: session.user.id,
      name,
      commander,
      externalLink: externalLink || null,
    },
  });

  return NextResponse.json(deck, { status: 201 });
}
```

- [ ] **Step 2: Create deck archive (soft-delete) route**

Create `src/app/api/decks/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deck = await prisma.deck.findUnique({ where: { id } });
  if (!deck || deck.userId !== session.user.id) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  await prisma.deck.update({
    where: { id },
    data: { archived: true },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/decks/
git commit -m "feat: add deck CRUD API routes with soft-delete"
```

---

## Task 6: Game API Routes

**Files:**
- Create: `src/app/api/games/route.ts`, `src/app/api/games/[id]/route.ts`, `src/app/api/games/[id]/confirm/route.ts`, `src/app/api/games/[id]/dispute/route.ts`

- [ ] **Step 1: Create game list + create route**

Create `src/app/api/games/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId");
  const playerId = searchParams.get("playerId");
  const status = searchParams.get("status");

  const where: any = {};
  if (seasonId) where.seasonId = seasonId;
  if (status) where.status = status;
  if (playerId) where.players = { some: { userId: playerId } };

  const games = await prisma.game.findMany({
    where,
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { id: true, name: true, commander: true } },
        },
      },
      season: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { playerIds, deckId, winnerId } = await request.json();

  if (!Array.isArray(playerIds) || playerIds.length !== 3) {
    return NextResponse.json({ error: "Exactly 3 other player IDs required" }, { status: 400 });
  }
  if (!deckId || !winnerId) {
    return NextResponse.json({ error: "deckId and winnerId required" }, { status: 400 });
  }

  const allPlayerIds = [session.user.id, ...playerIds];
  if (!allPlayerIds.includes(winnerId)) {
    return NextResponse.json({ error: "Winner must be one of the players" }, { status: 400 });
  }

  const activeSeason = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
  });
  if (!activeSeason) {
    return NextResponse.json({ error: "No active season" }, { status: 400 });
  }

  // Verify deck belongs to creator
  const deck = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!deck || deck.userId !== session.user.id || deck.archived) {
    return NextResponse.json({ error: "Invalid deck" }, { status: 400 });
  }

  const game = await prisma.game.create({
    data: {
      seasonId: activeSeason.id,
      createdById: session.user.id,
      players: {
        create: allPlayerIds.map((uid) => ({
          userId: uid,
          isWinner: uid === winnerId,
          confirmed: uid === session.user.id,
          deckId: uid === session.user.id ? deckId : null,
        })),
      },
    },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  return NextResponse.json(game, { status: 201 });
}
```

- [ ] **Step 2: Create game detail route**

Create `src/app/api/games/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { id: true, name: true, commander: true, externalLink: true } },
        },
      },
      season: { select: { id: true, name: true, budgetCap: true } },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json(game);
}
```

- [ ] **Step 3: Create game confirm route**

Create `src/app/api/games/[id]/confirm/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { deckId } = await request.json();

  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game || game.status !== "PENDING") {
    return NextResponse.json({ error: "Game not found or not pending" }, { status: 400 });
  }

  const player = game.players.find((p) => p.userId === session.user.id);
  if (!player) {
    return NextResponse.json({ error: "You are not in this game" }, { status: 403 });
  }
  if (player.confirmed) {
    return NextResponse.json({ error: "Already confirmed" }, { status: 400 });
  }

  // Verify deck belongs to the confirming user
  if (deckId) {
    const deck = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck || deck.userId !== session.user.id || deck.archived) {
      return NextResponse.json({ error: "Invalid deck" }, { status: 400 });
    }
  }

  await prisma.gamePlayer.update({
    where: { id: player.id },
    data: { confirmed: true, deckId: deckId || null },
  });

  // Check if all players confirmed
  const updatedPlayers = await prisma.gamePlayer.findMany({
    where: { gameId: id },
  });
  const allConfirmed = updatedPlayers.every((p) => p.confirmed);

  if (allConfirmed) {
    await prisma.game.update({
      where: { id },
      data: { status: "CONFIRMED" },
    });
  }

  return NextResponse.json({ success: true, allConfirmed });
}
```

- [ ] **Step 4: Create game dispute route**

Create `src/app/api/games/[id]/dispute/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game || game.status !== "PENDING") {
    return NextResponse.json({ error: "Game not found or not pending" }, { status: 400 });
  }

  const player = game.players.find((p) => p.userId === session.user.id);
  if (!player) {
    return NextResponse.json({ error: "You are not in this game" }, { status: 403 });
  }

  await prisma.game.update({
    where: { id },
    data: { status: "DISPUTED" },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/games/
git commit -m "feat: add game CRUD, confirm, and dispute API routes"
```

---

## Task 7: Admin API Routes (Resolve, Ban, Edit)

**Files:**
- Create: `src/app/api/admin/games/[id]/resolve/route.ts`, `src/app/api/admin/users/[id]/ban/route.ts`

- [ ] **Step 1: Create resolve dispute route**

Create `src/app/api/admin/games/[id]/resolve/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { winnerId } = await request.json();

  const game = await prisma.game.findUnique({
    where: { id },
    include: { players: true },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  if (!game.players.some((p) => p.userId === winnerId)) {
    return NextResponse.json({ error: "Winner must be a player in this game" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.gamePlayer.updateMany({
      where: { gameId: id },
      data: { isWinner: false, confirmed: true },
    }),
    prisma.gamePlayer.updateMany({
      where: { gameId: id, userId: winnerId },
      data: { isWinner: true },
    }),
    prisma.game.update({
      where: { id },
      data: { status: "CONFIRMED" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create ban user route**

Create `src/app/api/admin/users/[id]/ban/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id },
    data: { banned: !user.banned },
  });

  return NextResponse.json({ success: true, banned: !user.banned });
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: add admin routes for dispute resolution and user banning"
```

---

## Task 8: Poll Page

**Files:**
- Create: `src/app/poll/page.tsx`, `src/components/poll-widget.tsx`

- [ ] **Step 1: Create poll widget component**

Create `src/components/poll-widget.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PollResults = {
  total: number;
  votes: { choice: number; count: number; percentage: number }[];
  userVote: number | null;
  locked: boolean;
  budgetCap: number | null;
};

export function PollWidget({ results }: { results: PollResults }) {
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
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center">
          {results.locked
            ? `Budget Set: $${results.budgetCap}`
            : "Vote for the Budget Cap"}
        </CardTitle>
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
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create poll page**

Create `src/app/poll/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { PollWidget } from "@/components/poll-widget";

export default async function PollPage() {
  const session = await auth();

  const season = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!season) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No season created yet.</p>
      </div>
    );
  }

  const votes = await prisma.pollVote.groupBy({
    by: ["choice"],
    where: { seasonId: season.id },
    _count: { choice: true },
  });

  const total = votes.reduce((sum, v) => sum + v._count.choice, 0);

  const userVote = session?.user
    ? await prisma.pollVote.findUnique({
        where: {
          seasonId_userId: {
            seasonId: season.id,
            userId: session.user.id,
          },
        },
      })
    : null;

  const results = {
    total,
    votes: [20, 50, 100].map((choice) => {
      const v = votes.find((x) => x.choice === choice);
      const count = v?._count.choice ?? 0;
      return {
        choice,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    }),
    userVote: userVote?.choice ?? null,
    locked: season.status !== "POLLING",
    budgetCap: season.budgetCap,
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-center text-3xl font-bold">{season.name} — Budget Poll</h1>
      <PollWidget results={results} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/poll/ src/components/poll-widget.tsx
git commit -m "feat: add budget poll page with voting widget"
```

---

## Task 9: Deck Registration Page

**Files:**
- Create: `src/app/decks/new/page.tsx`, `src/components/deck-form.tsx`

- [ ] **Step 1: Create deck form component**

Create `src/components/deck-form.tsx`:

```tsx
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
```

- [ ] **Step 2: Create deck registration page**

Create `src/app/decks/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DeckForm } from "@/components/deck-form";

export default async function NewDeckPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-bold">Register Deck</h1>
      <DeckForm />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/decks/ src/components/deck-form.tsx
git commit -m "feat: add deck registration page and form"
```

---

## Task 10: Leaderboard Page

**Files:**
- Create: `src/app/leaderboard/page.tsx`, `src/components/leaderboard-table.tsx`

- [ ] **Step 1: Create leaderboard table component**

Create `src/components/leaderboard-table.tsx`:

```tsx
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
                  <AvatarFallback>{player.name[0]}</AvatarFallback>
                </Avatar>
                {player.name}
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
```

- [ ] **Step 2: Create leaderboard page with stats query**

Create `src/app/leaderboard/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderboardTable } from "@/components/leaderboard-table";

export default async function LeaderboardPage() {
  const activeSeason = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!activeSeason) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">No active season yet.</p>
      </div>
    );
  }

  const gamePlayers = await prisma.gamePlayer.findMany({
    where: {
      game: { seasonId: activeSeason.id, status: "CONFIRMED" },
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  const statsMap = new Map<string, { username: string; avatar: string | null; wins: number; losses: number }>();

  for (const gp of gamePlayers) {
    const existing = statsMap.get(gp.userId) ?? {
      username: gp.user.name,
      avatar: gp.user.avatar,
      wins: 0,
      losses: 0,
    };
    if (gp.isWinner) existing.wins++;
    else existing.losses++;
    statsMap.set(gp.userId, existing);
  }

  const players = Array.from(statsMap.entries())
    .map(([id, stats]) => ({
      id,
      ...stats,
      winRate: stats.wins + stats.losses > 0
        ? (stats.wins / (stats.wins + stats.losses)) * 100
        : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{activeSeason.name} — Leaderboard</h1>
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <LeaderboardTable players={players} />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/leaderboard/ src/components/leaderboard-table.tsx
git commit -m "feat: add leaderboard page with player rankings"
```

---

## Task 11: Game History & Game Detail Pages

**Files:**
- Create: `src/app/games/page.tsx`, `src/app/games/[id]/page.tsx`, `src/components/game-card.tsx`

- [ ] **Step 1: Create game card component**

Create `src/components/game-card.tsx`:

```tsx
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type GameCardProps = {
  game: {
    id: string;
    status: string;
    createdAt: string;
    season: { name: string };
    players: {
      isWinner: boolean;
      confirmed: boolean;
      user: { id: string; username: string; avatar: string | null };
      deck: { name: string; commander: string } | null;
    }[];
  };
};

export function GameCard({ game }: GameCardProps) {
  const winner = game.players.find((p) => p.isWinner);

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
                  : "border-yellow-500/30 text-yellow-400"
              }
            >
              {game.status}
            </Badge>
          </div>
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
                    <p className="text-xs text-muted-foreground truncate">{p.deck.commander}</p>
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
```

- [ ] **Step 2: Create game history page**

Create `src/app/games/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { GameCard } from "@/components/game-card";

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { name: true, commander: true } },
        },
      },
      season: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Game History</h1>
      {games.length === 0 ? (
        <p className="text-muted-foreground">No games played yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <GameCard key={game.id} game={JSON.parse(JSON.stringify(game))} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create game detail page with confirm/dispute**

Create `src/app/games/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameActions } from "./game-actions";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { id: true, name: true, commander: true, externalLink: true } },
        },
      },
      season: { select: { name: true, budgetCap: true } },
    },
  });

  if (!game) notFound();

  const currentPlayer = session?.user
    ? game.players.find((p) => p.user.id === session.user.id)
    : null;
  const needsAction = currentPlayer && !currentPlayer.confirmed && game.status === "PENDING";

  const userDecks = needsAction
    ? await prisma.deck.findMany({
        where: { userId: session!.user.id, archived: false },
      })
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Game Detail</h1>
        <Badge
          variant="outline"
          className={
            game.status === "CONFIRMED"
              ? "border-green-500/30 text-green-400"
              : game.status === "DISPUTED"
              ? "border-red-500/30 text-red-400"
              : "border-yellow-500/30 text-yellow-400"
          }
        >
          {game.status}
        </Badge>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {game.season.name} &middot; Budget: ${game.season.budgetCap ?? "TBD"} &middot;{" "}
        {new Date(game.createdAt).toLocaleDateString()}
      </p>

      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {game.players.map((p) => (
            <div
              key={p.user.id}
              className={`flex items-center justify-between rounded-lg p-3 ${
                p.isWinner ? "bg-primary/10 border border-primary/30" : "bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={p.user.avatar ?? undefined} />
                  <AvatarFallback>{p.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{p.user.name}</p>
                  {p.deck ? (
                    <p className="text-sm text-muted-foreground">
                      {p.deck.commander}
                      {p.deck.externalLink && (
                        <>
                          {" "}
                          &middot;{" "}
                          <a
                            href={p.deck.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-secondary hover:underline"
                          >
                            Decklist
                          </a>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Deck not selected</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.isWinner && <Badge className="bg-primary/20 text-primary">Winner</Badge>}
                {p.confirmed ? (
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    Confirmed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {needsAction && (
        <GameActions gameId={game.id} decks={userDecks} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create game actions client component**

Create `src/app/games/[id]/game-actions.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Deck = { id: string; name: string; commander: string };

export function GameActions({ gameId, decks }: { gameId: string; decks: Deck[] }) {
  const router = useRouter();
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId: selectedDeck || null }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDispute() {
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${gameId}/dispute`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4 border-yellow-500/30 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-yellow-400">Action Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground">Select your deck:</label>
          <Select value={selectedDeck} onValueChange={setSelectedDeck}>
            <SelectTrigger className="mt-1 bg-muted border-border">
              <SelectValue placeholder="Choose a deck..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {decks.map((deck) => (
                <SelectItem key={deck.id} value={deck.id}>
                  {deck.name} ({deck.commander})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleConfirm} disabled={loading} className="flex-1">
            Confirm Result
          </Button>
          <Button
            onClick={handleDispute}
            disabled={loading}
            variant="destructive"
            className="flex-1"
          >
            Dispute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/games/ src/components/game-card.tsx
git commit -m "feat: add game history, game detail, and confirm/dispute UI"
```

---

## Task 12: Log a Game Page

**Files:**
- Create: `src/app/games/new/page.tsx`

- [ ] **Step 1: Create log game page**

Create `src/app/games/new/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogGameForm } from "./log-game-form";

export default async function NewGamePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const [players, decks] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        banned: false,
      },
      select: { id: true, name: true, avatar: true },
      orderBy: { name: "asc" },
    }),
    prisma.deck.findMany({
      where: { userId: session.user.id, archived: false },
    }),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-3xl font-bold">Log a Game</h1>
      <LogGameForm
        currentUserId={session.user.id}
        currentUserName={session.user.name ?? "You"}
        players={players}
        decks={decks}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create log game form client component**

Create `src/app/games/new/log-game-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Player = { id: string; username: string; avatar: string | null };
type Deck = { id: string; name: string; commander: string };

export function LogGameForm({
  currentUserId,
  currentUserName,
  players,
  decks,
}: {
  currentUserId: string;
  currentUserName: string;
  players: Player[];
  decks: Deck[];
}) {
  const router = useRouter();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(["", "", ""]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePlayer(index: number, value: string) {
    const updated = [...selectedPlayers];
    updated[index] = value;
    setSelectedPlayers(updated);
  }

  const allPlayerIds = [currentUserId, ...selectedPlayers.filter(Boolean)];
  const winnerOptions = allPlayerIds
    .map((id) => {
      if (id === currentUserId) return { id, username: currentUserName };
      return players.find((p) => p.id === id);
    })
    .filter(Boolean) as { id: string; username: string }[];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const playerIds = selectedPlayers.filter(Boolean);
    if (playerIds.length !== 3) {
      setError("Select exactly 3 other players");
      return;
    }
    if (new Set(playerIds).size !== 3) {
      setError("Each player must be different");
      return;
    }
    if (!selectedDeck) {
      setError("Select your deck");
      return;
    }
    if (!winnerId) {
      setError("Select the winner");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerIds,
          deckId: selectedDeck,
          winnerId,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to create game");
        return;
      }

      const game = await res.json();
      router.push(`/games/${game.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Game Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="space-y-1">
              <Label>Player {idx + 2}</Label>
              <Select value={selectedPlayers[idx]} onValueChange={(v) => updatePlayer(idx, v)}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select a player..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {players
                    .filter(
                      (p) =>
                        !selectedPlayers.includes(p.id) || selectedPlayers[idx] === p.id
                    )
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={p.avatar ?? undefined} />
                            <AvatarFallback className="text-xs">{p.username[0]}</AvatarFallback>
                          </Avatar>
                          {p.username}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ))}

          <div className="space-y-1">
            <Label>Your Deck</Label>
            <Select value={selectedDeck} onValueChange={setSelectedDeck}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select your deck..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {decks.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.commander})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Winner</Label>
            <Select value={winnerId} onValueChange={setWinnerId}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Who won?" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {winnerOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Logging..." : "Log Game"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/games/new/
git commit -m "feat: add log game page with player/deck/winner selection"
```

---

## Task 13: Player Profile Page

**Files:**
- Create: `src/app/players/[id]/page.tsx`

- [ ] **Step 1: Create player profile page**

Create `src/app/players/[id]/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      decks: { where: { archived: false }, orderBy: { createdAt: "desc" } },
      gamePlayers: {
        where: { game: { status: "CONFIRMED" } },
        include: {
          game: { select: { id: true, createdAt: true, season: { select: { name: true } } } },
          deck: { select: { name: true, commander: true } },
        },
      },
    },
  });

  if (!user) notFound();

  // Overall stats
  const wins = user.gamePlayers.filter((gp) => gp.isWinner).length;
  const total = user.gamePlayers.length;
  const losses = total - wins;
  const winRate = total > 0 ? (wins / total) * 100 : 0;

  // Per-deck stats
  const deckStatsMap = new Map<string, { name: string; commander: string; wins: number; games: number }>();
  for (const gp of user.gamePlayers) {
    if (!gp.deck) continue;
    const key = gp.deckId!;
    const existing = deckStatsMap.get(key) ?? {
      name: gp.deck.name,
      commander: gp.deck.commander,
      wins: 0,
      games: 0,
    };
    existing.games++;
    if (gp.isWinner) existing.wins++;
    deckStatsMap.set(key, existing);
  }
  const deckStats = Array.from(deckStatsMap.values()).sort((a, b) => b.wins - a.wins);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar ?? undefined} />
          <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">
            Member since {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: "Games", value: total, color: "text-foreground" },
          { label: "Wins", value: wins, color: "text-green-400" },
          { label: "Losses", value: losses, color: "text-red-400" },
          { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: "text-accent" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card/50 backdrop-blur-sm text-center">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-Deck Stats */}
      <Card className="mb-6 border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Deck Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {deckStats.length === 0 ? (
            <p className="text-muted-foreground">No confirmed games yet.</p>
          ) : (
            <div className="space-y-3">
              {deckStats.map((deck) => (
                <div key={deck.commander} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
                  <div>
                    <p className="font-medium">{deck.name}</p>
                    <p className="text-sm text-muted-foreground">{deck.commander}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-green-400">{deck.wins}W</span>
                      {" / "}
                      <span className="text-red-400">{deck.games - deck.wins}L</span>
                    </p>
                    <p className="text-xs text-accent">
                      {((deck.wins / deck.games) * 100).toFixed(0)}% win rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registered Decks */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Registered Decks</CardTitle>
        </CardHeader>
        <CardContent>
          {user.decks.length === 0 ? (
            <p className="text-muted-foreground">No decks registered.</p>
          ) : (
            <div className="space-y-2">
              {user.decks.map((deck) => (
                <div key={deck.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
                  <div>
                    <p className="font-medium">{deck.name}</p>
                    <p className="text-sm text-muted-foreground">{deck.commander}</p>
                  </div>
                  {deck.externalLink && (
                    <a
                      href={deck.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-secondary hover:underline"
                    >
                      View List
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/players/
git commit -m "feat: add player profile page with per-deck stats"
```

---

## Task 14: Dashboard Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const userId = session.user.id;

  const [pendingGames, decks, confirmedGames] = await Promise.all([
    prisma.game.findMany({
      where: {
        status: "PENDING",
        players: {
          some: { userId, confirmed: false },
        },
      },
      include: {
        players: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deck.findMany({
      where: { userId, archived: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gamePlayer.findMany({
      where: { userId, game: { status: "CONFIRMED" } },
    }),
  ]);

  const wins = confirmedGames.filter((gp) => gp.isWinner).length;
  const total = confirmedGames.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/games/new">Log Game</Link>
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/decks/new">Register Deck</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">Games</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-400">{wins}</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm text-center">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-accent">
              {total > 0 ? ((wins / total) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Confirmations */}
      {pendingGames.length > 0 && (
        <Card className="mb-6 border-yellow-500/30 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-yellow-400">
              Pending Confirmations ({pendingGames.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex items-center justify-between rounded-lg bg-muted/20 p-3 hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm">
                  {game.players.map((p) => p.user.name).join(", ")}
                </span>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                  Needs Confirmation
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* My Decks */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>My Decks</CardTitle>
          <Button asChild size="sm" variant="outline" className="border-border">
            <Link href="/decks/new">+ Add Deck</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <p className="text-muted-foreground">No decks registered yet.</p>
          ) : (
            <div className="space-y-2">
              {decks.map((deck) => (
                <div key={deck.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
                  <div>
                    <p className="font-medium">{deck.name}</p>
                    <p className="text-sm text-muted-foreground">{deck.commander}</p>
                  </div>
                  {deck.externalLink && (
                    <a
                      href={deck.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-secondary hover:underline"
                    >
                      View List
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/
git commit -m "feat: add user dashboard with pending games and deck list"
```

---

## Task 15: Home Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build the home page with hero, poll preview, recent games, leaderboard preview**

Update `src/app/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GameCard } from "@/components/game-card";

export default async function Home() {
  const currentSeason = await prisma.season.findFirst({
    where: { status: { in: ["POLLING", "ACTIVE"] } },
    orderBy: { createdAt: "desc" },
  });

  const recentGames = await prisma.game.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    include: {
      players: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          deck: { select: { name: true, commander: true } },
        },
      },
      season: { select: { name: true } },
    },
  });

  // Top 5 players from leaderboard
  const topPlayers = currentSeason
    ? await prisma.gamePlayer
        .findMany({
          where: { game: { seasonId: currentSeason.id, status: "CONFIRMED" } },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        })
        .then((gps) => {
          const map = new Map<string, { username: string; wins: number; games: number }>();
          for (const gp of gps) {
            const e = map.get(gp.userId) ?? { username: gp.user.name, wins: 0, games: 0 };
            e.games++;
            if (gp.isWinner) e.wins++;
            map.set(gp.userId, e);
          }
          return Array.from(map.entries())
            .map(([id, s]) => ({ id, ...s }))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 5);
        })
    : [];

  return (
    <div>
      {/* Hero */}
      <div className="relative mb-12 flex flex-col items-center justify-center py-16 text-center">
        <div className="absolute inset-0 bg-mystic-glow opacity-50" />
        <h1 className="relative text-5xl font-extrabold tracking-tight md:text-6xl">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Budget Commander
          </span>
        </h1>
        <p className="relative mt-3 text-xl text-muted-foreground">League</p>
        {currentSeason && (
          <Badge variant="outline" className="relative mt-4 border-primary/30 text-primary">
            {currentSeason.name} — {currentSeason.status === "POLLING" ? "Voting Open" : `$${currentSeason.budgetCap} Budget`}
          </Badge>
        )}
        <div className="relative mt-6 flex gap-3">
          {currentSeason?.status === "POLLING" && (
            <Button asChild>
              <Link href="/poll">Vote Now</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="border-border">
            <Link href="/leaderboard">View Standings</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Games */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Games</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/games">View All</Link>
            </Button>
          </div>
          {recentGames.length === 0 ? (
            <p className="text-muted-foreground">No games yet.</p>
          ) : (
            <div className="grid gap-4">
              {recentGames.map((game) => (
                <GameCard key={game.id} game={JSON.parse(JSON.stringify(game))} />
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard Preview */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Top Players</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/leaderboard">Full Standings</Link>
            </Button>
          </div>
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {topPlayers.length === 0 ? (
                <p className="p-6 text-center text-muted-foreground">No confirmed games yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {topPlayers.map((player, idx) => (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm font-bold ${
                            idx === 0 ? "text-yellow-400" : idx === 1 ? "text-gray-300" : idx === 2 ? "text-orange-400" : "text-muted-foreground"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span>{player.name}</span>
                      </div>
                      <span className="text-sm text-green-400">{player.wins}W</span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add home page with hero, recent games, and leaderboard preview"
```

---

## Task 16: Admin Panel Page

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Create admin panel page**

Create `src/app/admin/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPanel } from "./admin-panel";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect("/");

  const [seasons, disputedGames, users] = await Promise.all([
    prisma.season.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.game.findMany({
      where: { status: "DISPUTED" },
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        season: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, banned: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Admin Panel</h1>
      <AdminPanel
        seasons={JSON.parse(JSON.stringify(seasons))}
        disputedGames={JSON.parse(JSON.stringify(disputedGames))}
        users={users}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create admin panel client component**

Create `src/app/admin/admin-panel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Season = { id: string; name: string; status: string; budgetCap: number | null; createdAt: string };
type DisputedGame = {
  id: string;
  createdAt: string;
  season: { name: string };
  players: { userId: string; user: { id: string; username: string }; isWinner: boolean }[];
};
type User = { id: string; username: string; email: string; role: string; banned: boolean };

export function AdminPanel({
  seasons,
  disputedGames,
  users,
}: {
  seasons: Season[];
  disputedGames: DisputedGame[];
  users: User[];
}) {
  const router = useRouter();

  return (
    <Tabs defaultValue="seasons">
      <TabsList className="bg-muted border border-border">
        <TabsTrigger value="seasons">Seasons</TabsTrigger>
        <TabsTrigger value="disputes">
          Disputes {disputedGames.length > 0 && `(${disputedGames.length})`}
        </TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
      </TabsList>

      <TabsContent value="seasons">
        <SeasonsTab seasons={seasons} onRefresh={() => router.refresh()} />
      </TabsContent>

      <TabsContent value="disputes">
        <DisputesTab games={disputedGames} onRefresh={() => router.refresh()} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab users={users} onRefresh={() => router.refresh()} />
      </TabsContent>
    </Tabs>
  );
}

function SeasonsTab({ seasons, onRefresh }: { seasons: Season[]; onRefresh: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSeason() {
    if (!name) return;
    setLoading(true);
    try {
      await fetch("/api/admin/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function lockPoll(choice?: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/poll/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(choice ? { choice } : {}),
      });
      const data = await res.json();
      if (res.status === 409 && data.tied) {
        const pick = prompt(`Tie between: $${data.tied.join(", $")}. Enter the winning amount:`);
        if (pick) await lockPoll(parseInt(pick));
        return;
      }
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  async function endSeason(id: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/seasons/${id}/end`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Seasons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Season name..."
            className="bg-muted border-border"
          />
          <Button onClick={createSeason} disabled={loading || !name}>
            Create
          </Button>
        </div>

        <div className="space-y-2">
          {seasons.map((season) => (
            <div key={season.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
              <div>
                <span className="font-medium">{season.name}</span>
                {season.budgetCap && (
                  <span className="ml-2 text-sm text-muted-foreground">${season.budgetCap}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    season.status === "ACTIVE"
                      ? "border-green-500/30 text-green-400"
                      : season.status === "POLLING"
                      ? "border-yellow-500/30 text-yellow-400"
                      : "border-border text-muted-foreground"
                  }
                >
                  {season.status}
                </Badge>
                {season.status === "POLLING" && (
                  <Button size="sm" onClick={() => lockPoll()} disabled={loading}>
                    Lock Poll
                  </Button>
                )}
                {(season.status === "ACTIVE" || season.status === "POLLING") && (
                  <Button size="sm" variant="destructive" onClick={() => endSeason(season.id)} disabled={loading}>
                    End
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DisputesTab({ games, onRefresh }: { games: DisputedGame[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function resolve(gameId: string, winnerId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/games/${gameId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  if (games.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          No disputed games.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Disputed Games</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="rounded-lg bg-muted/20 p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {game.season.name} &middot; {new Date(game.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm">
              Players: {game.players.map((p) => p.user.name).join(", ")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Pick winner:</span>
              {game.players.map((p) => (
                <Button
                  key={p.userId}
                  size="sm"
                  variant="outline"
                  className="border-border"
                  onClick={() => resolve(game.id, p.userId)}
                  disabled={loading}
                >
                  {p.user.name}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function UsersTab({ users, onRefresh }: { users: User[]; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);

  async function toggleBan(userId: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-lg bg-muted/20 p-3">
            <div>
              <span className="font-medium">{user.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{user.email}</span>
              {user.role === "ADMIN" && (
                <Badge className="ml-2 bg-primary/20 text-primary">Admin</Badge>
              )}
            </div>
            <Button
              size="sm"
              variant={user.banned ? "default" : "destructive"}
              onClick={() => toggleBan(user.id)}
              disabled={loading || user.role === "ADMIN"}
            >
              {user.banned ? "Unban" : "Ban"}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin panel with seasons, disputes, and user management"
```

---

## Task 17: Final Integration & Deployment Prep

**Files:**
- Modify: `.gitignore`
- Create: `vercel.json` (if needed)

- [ ] **Step 1: Add .env.example for documentation**

Create `.env.example`:

```
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

- [ ] **Step 2: Add Prisma generate to build script**

Update `package.json` scripts to include prisma generate before build:

In `package.json`, update the `build` script:
```json
"build": "prisma generate && next build"
```

- [ ] **Step 3: Full build verification**

```bash
npm run build
```

Expected: Build succeeds with all pages compiled.

- [ ] **Step 4: Commit**

```bash
git add .env.example package.json .gitignore
git commit -m "feat: add env example and build config for Vercel deployment"
```

- [ ] **Step 5: Verify all pages exist**

Check that all routes are listed in the build output:
- `/` (home)
- `/leaderboard`
- `/games`
- `/games/[id]`
- `/games/new`
- `/players/[id]`
- `/poll`
- `/dashboard`
- `/decks/new`
- `/admin`
