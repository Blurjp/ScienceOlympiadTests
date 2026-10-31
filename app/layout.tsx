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
      </body>
    </html>
  );
}
