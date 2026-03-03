import type { Metadata } from "next";
import { Cormorant_Garamond, Spectral } from "next/font/google";

import "@/app/globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display"
});

const body = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Avalon",
  description: "Mobile-first real-time web implementation of The Resistance: Avalon."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${display.variable} ${body.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}

