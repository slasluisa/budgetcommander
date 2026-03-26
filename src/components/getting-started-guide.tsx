import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

type Step = {
  number: number;
  title: string;
  description: string;
  done: boolean;
  href?: string;
  linkLabel?: string;
  external?: boolean;
};

export function GettingStartedGuide({
  hasDecks,
  hasGames,
  activeSeason,
}: {
  hasDecks: boolean;
  hasGames: boolean;
  activeSeason?: { name: string; budgetCap: number | null } | null;
}) {
  const allDone = hasDecks && hasGames;
  if (allDone) return null;

  const steps: Step[] = [
    {
      number: 1,
      title: "Build your deck on Archidekt",
      description:
        activeSeason?.budgetCap != null
          ? `Create a Commander deck under the $${activeSeason.budgetCap} budget cap for ${activeSeason.name}. Make sure the list is set to public.`
          : "Create a public Commander decklist on Archidekt. The budget cap is set each season by community vote.",
      done: false,
      href: "https://archidekt.com",
      linkLabel: "Open Archidekt",
      external: true,
    },
    {
      number: 2,
      title: "Register your deck here",
      description:
        "Paste your Archidekt link and we'll pull in the commander, validate the price, and save it to your profile.",
      done: hasDecks,
      href: "/decks/new",
      linkLabel: "Register a Deck",
    },
    {
      number: 3,
      title: "Play a game and log it",
      description:
        "After your four-player pod finishes, the winner logs the game. Everyone else confirms the result.",
      done: hasGames,
      href: hasDecks ? "/games/new" : undefined,
      linkLabel: hasDecks ? "Log a Game" : undefined,
    },
  ];

  // Find the first incomplete step
  const currentStepIndex = steps.findIndex((s) => !s.done);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-card/80 to-secondary/[0.06]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative px-5 py-6 sm:px-7 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
          Welcome to the League
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Get Started in 3 Steps
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
          You&apos;re in. Here&apos;s everything you need to start playing in the league.
        </p>

        <div className="mt-8 space-y-4">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.number}
                className={`relative flex gap-4 rounded-xl border p-4 transition-colors ${
                  step.done
                    ? "border-green-500/20 bg-green-500/[0.04]"
                    : isCurrent
                      ? "border-primary/30 bg-primary/[0.06] shadow-[0_0_24px_rgba(124,58,237,0.08)]"
                      : "border-border/40 bg-background/30 opacity-60"
                }`}
              >
                {/* Step number / check */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    step.done
                      ? "bg-green-500/20 text-green-400"
                      : isCurrent
                        ? "bg-primary/20 text-accent"
                        : "bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {step.done ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-sm font-semibold ${
                      step.done ? "text-green-400 line-through decoration-green-400/40" : ""
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  {isCurrent && step.href && step.linkLabel && (
                    <div className="mt-3">
                      {step.external ? (
                        <a
                          href={step.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            buttonVariants({ size: "sm" }) +
                            " bg-gradient-to-r from-primary to-secondary"
                          }
                        >
                          {step.linkLabel}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="ml-1.5"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ) : (
                        <Link
                          href={step.href}
                          className={
                            buttonVariants({ size: "sm" }) +
                            " bg-gradient-to-r from-primary to-secondary"
                          }
                        >
                          {step.linkLabel}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
