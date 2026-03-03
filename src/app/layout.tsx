import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Avalon",
  description: "Mobile-first real-time web implementation of The Resistance: Avalon."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
