import { useId } from "react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  title?: string;
};

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  title?: string;
  showLeagueLabel?: boolean;
};

export function BrandMark({
  className,
  title = "Budget Commander emblem",
}: BrandMarkProps) {
  const id = useId().replace(/:/g, "");
  const shellGradient = `shell-${id}`;
  const shellStroke = `shell-stroke-${id}`;
  const ringGradient = `ring-${id}`;
  const glyphGradient = `glyph-${id}`;
  const glowGradient = `glow-${id}`;

  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-label={title}
      className={cn("shrink-0 drop-shadow-[0_10px_32px_rgba(59,130,246,0.2)]", className)}
    >
      <defs>
        <linearGradient id={shellGradient} x1="24" y1="26" x2="136" y2="136">
          <stop offset="0" stopColor="#4c1d95" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={shellStroke} x1="36" y1="20" x2="128" y2="144">
          <stop offset="0" stopColor="#ddd6fe" />
          <stop offset="0.45" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7dd3fc" />
        </linearGradient>
        <linearGradient id={ringGradient} x1="32" y1="32" x2="128" y2="128">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset="0.5" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
        <linearGradient id={glyphGradient} x1="56" y1="48" x2="104" y2="118">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.58" stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
        <radialGradient id={glowGradient} cx="50%" cy="42%" r="65%">
          <stop offset="0" stopColor="#a78bfa" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="80" cy="80" r="74" fill={`url(#${glowGradient})`} opacity="0.7" />

      <rect
        x="26"
        y="26"
        width="108"
        height="108"
        rx="28"
        transform="rotate(45 80 80)"
        fill={`url(#${shellGradient})`}
        stroke={`url(#${shellStroke})`}
        strokeWidth="4"
      />

      <circle
        cx="80"
        cy="80"
        r="52"
        fill="rgba(15, 23, 42, 0.32)"
        stroke={`url(#${ringGradient})`}
        strokeWidth="8"
      />

      <circle cx="80" cy="24" r="7.5" fill="#f5f3ff" />
      <circle cx="136" cy="80" r="7.5" fill="#bfdbfe" />
      <circle cx="80" cy="136" r="7.5" fill="#ddd6fe" />
      <circle cx="24" cy="80" r="7.5" fill="#c4b5fd" />

      <path
        d="M58 63 68 45 80 56 92 45 102 63 93 63 87 54 80 64 73 54 67 63Z"
        fill={`url(#${glyphGradient})`}
      />
      <path
        d="M80 69 104 93 80 117 56 93Z"
        fill="rgba(15, 23, 42, 0.42)"
        stroke={`url(#${glyphGradient})`}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M80 82 91 93 80 104 69 93Z"
        fill={`url(#${glyphGradient})`}
        opacity="0.95"
      />
      <path
        d="M64 116h32"
        stroke={`url(#${glyphGradient})`}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M60 126h40"
        stroke={`url(#${glyphGradient})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        opacity="0.84"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
  title,
  showLeagueLabel = true,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <BrandMark className={cn("h-10 w-10", markClassName)} title={title} />
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-sm font-semibold uppercase tracking-[0.3em] text-transparent">
          Budget Commander
        </span>
        {showLeagueLabel ? (
          <span className="mt-1 truncate text-[0.68rem] font-medium uppercase tracking-[0.42em] text-muted-foreground">
            League
          </span>
        ) : null}
      </div>
    </div>
  );
}
