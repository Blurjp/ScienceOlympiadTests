import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import Header from "@/components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Science Olympiad Tests",
  description: "Practice Science Olympiad tests with PDF parsing and progress tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          <Header />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
