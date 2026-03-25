"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Bug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BugReportWidget() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmedDescription = description.trim();

  async function handleSubmit() {
    if (!trimmedDescription) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: trimmedDescription,
          pagePath: pathname,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to submit bug report");
        return;
      }

      setDescription("");
      setExpanded(false);
      toast.success("Bug report sent to admin");
    } catch {
      toast.error("Failed to submit bug report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-40 md:bottom-4 md:right-4">
      {!expanded ? (
        <Button
          type="button"
          className="pointer-events-auto h-10 rounded-full px-4 shadow-lg shadow-black/25"
          onClick={() => setExpanded(true)}
        >
          <Bug className="mr-2 h-4 w-4" />
          Report
        </Button>
      ) : (
        <div className="pointer-events-auto w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-card/95 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-medium">Report a bug</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setExpanded(false)}
            >
              Hide
            </Button>
          </div>

          <div className="border-t border-border px-4 py-4">
            <label
              htmlFor="bug-report-description"
              className="mb-2 block text-sm font-medium"
            >
              What went wrong?
            </label>
            <textarea
              id="bug-report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, what you expected, and anything that helps reproduce it."
              maxLength={2000}
              rows={4}
              className="min-h-28 w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                This page path is attached automatically.
              </p>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !trimmedDescription}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending
                  </>
                ) : (
                  "Send report"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
