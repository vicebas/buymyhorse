import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";

import { FloatingChatProvider } from "@/components/chat/floating-chat-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const themeInitScript = `
(() => {
  const storageKey = "horseroster-theme";
  const root = document.documentElement;
  const stored = window.localStorage.getItem(storageKey);
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = stored === "light" || stored === "dark" ? stored : systemDark ? "dark" : "light";
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
})();
`;

export const metadata: Metadata = {
  title: {
    default: "HorseRoster",
    template: "%s | HorseRoster",
  },
  description:
    "HorseRoster is a premium sport horse marketplace for polished listings, trusted sellers, and serious buyers.",
  icons: {
    icon: [
      { url: "/branding/horseroster-favicon.svg", type: "image/svg+xml" },
      { url: "/branding/horseroster-icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/branding/horseroster-icon-light.svg", type: "image/svg+xml" }],
    shortcut: ["/branding/horseroster-favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${ibmPlexMono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <FloatingChatProvider>{children}</FloatingChatProvider>
      </body>
    </html>
  );
}
