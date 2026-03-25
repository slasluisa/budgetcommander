import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Nav } from "@/components/nav";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { BugReportWidget } from "@/components/bug-report-widget";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Budget Commander League",
  description: "A local MTG Budget Commander league tracker for seasons, polls, pods, and standings.",
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
          <main className="mx-auto max-w-6xl px-4 py-8 pb-40 md:pb-28">{children}</main>
          <BugReportWidget />
          <Toaster />
          <BottomTabBar />
        </Providers>
      </body>
    </html>
  );
}
