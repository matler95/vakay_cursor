// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // Import the font
import "./globals.css";
import TopNav from "./_components/TopNav";

export const metadata: Metadata = {
  title: "VAKAY Trip Planner",
  description: "Trip planner for friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Apply the font class to the body */}
      <body className={GeistSans.className}>
        <TopNav />
        {children}
      </body>
    </html>
  );
}