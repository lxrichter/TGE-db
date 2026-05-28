import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import "./globals.css";

import AppHeaderShell from "@/components/ui/app-header";
import SessionProviderClient from "@/components/auth/session-provider-client";

export const metadata: Metadata = {
  title: "ThinkGeoEnergy Internal Database Platform",
  description: "ThinkGeoEnergy internal market intelligence system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="bg-[var(--tge-surface-page)] text-[var(--tge-text-primary)]"
        suppressHydrationWarning
      >
        <SessionProviderClient>
          <div className="screen-only">
            <AppHeaderShell>{children}</AppHeaderShell>
          </div>
          <div className="print-only">{children}</div>
        </SessionProviderClient>
      </body>
    </html>
  );
}
