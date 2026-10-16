import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Science Olympiad Tests - AI Practice Test Generator",
    template: "%s | SciolyPrep",
  },
  description:
    "Generate and practice Science Olympiad tests for every event - Anatomy, Astronomy, Chemistry Lab, Forensics, and more. AI-generated questions, PDF import, and progress tracking.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "Science Olympiad Tests - AI Practice Test Generator",
    description:
      "Free AI-generated Science Olympiad practice tests for every Division C event. Import past exam PDFs, practice at any difficulty, and track your progress.",
    url: getSiteUrl(),
    siteName: "Science Olympiad Tests",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Science Olympiad Tests - AI Practice Test Generator",
    description:
      "Free AI-generated Science Olympiad practice tests for every Division C event.",
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
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
