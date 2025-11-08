import type { Metadata } from "next";
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
