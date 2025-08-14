// src/app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // Import the font
import "./globals.css";
import TopNav from "./_components/TopNav";
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';

export const metadata: Metadata = {
  title: "VAKAY Trip Planner",
  description: "Trip planner for friends",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="en">
      {/* Apply the font class to the body */}
      <body className={GeistSans.className}>
        <TopNav user={user || undefined} />
        {children}
      </body>
    </html>
  );
}