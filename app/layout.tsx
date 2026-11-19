import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { OneTap } from "@/components/auth/one-tap";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Science Olympiad Tests - AI Practice Test Generator",
    template: "%s | SciolyPrep",
  },
  description:
    "Free AI-generated Science Olympiad practice tests for 32 Division B & C events. Import past exam PDFs and track your progress.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "Science Olympiad Tests - AI Practice Test Generator",
    description:
      "Free AI-generated Science Olympiad practice tests for every major event in Divisions B and C. Import past exam PDFs, practice at any difficulty, and track your progress.",
    url: getSiteUrl(),
    siteName: "Science Olympiad Tests",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Science Olympiad Tests - AI Practice Test Generator",
    description:
      "Free AI-generated Science Olympiad practice tests for every major Division B and C event.",
  },
};

// Site-wide <noscript> digest: a concise, link-rich summary for clients that
// do not run JavaScript — the crawlers behind ChatGPT, Claude, and Perplexity
// fetch pages without executing scripts. (Structured data lives on the
// homepage, rendered per request with live prices; this block deliberately
// avoids prices so a statically cached layout can never advertise stale ones.)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <SessionProvider>
          <OneTap clientId={process.env.GOOGLE_CLIENT_ID} />
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </SessionProvider>
        <Analytics />
        <noscript>
          <h1>Science Olympiad Tests (SciolyPrep)</h1>
          <p>
            A free web app that generates and grades AI practice tests for Science
            Olympiad Division B and C events at Invitational, Regional, State, and
            National difficulty. The free tier includes 5 AI test generations per
            month; a Pro plan adds unlimited generations, up to 40 questions per
            test, AI answer explanations, and printable PDF exports. See{" "}
            <a href="/pricing">pricing</a> for current plans.
          </p>
          <ul>
            <li><a href="/">AI test generator and practice test library</a></li>
            <li><a href="/events">Practice tests and study guides by event</a></li>
            <li><a href="/pricing">Pricing and plans</a></li>
            <li><a href="/about">About and how it works</a></li>
            <li><a href="/contact">Contact and support</a></li>
            <li><a href="/llms.txt">Site manifest for AI agents (llms.txt)</a></li>
          </ul>
        </noscript>
      </body>
    </html>
  );
}
