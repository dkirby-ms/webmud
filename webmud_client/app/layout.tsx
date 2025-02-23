import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { Suspense } from "react";
import NavBar from "../components/layout/navbar.tsx";
import { SessionProvider } from "next-auth/react"
import { auth } from "../auth.ts"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "webMUD",
  description: "a next-gen but old-school MUD",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  if (session?.user) {
    session.user = {
      name: session.user.name,
      email: session.user.email,
      id: session.user.id,
    }
  }
  return (
    <SessionProvider basePath={"/auth"} session={session}>
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Theme appearance="dark" radius="small" accentColor="red" grayColor="gray">
        <div />
          <Suspense fallback="...">
            <NavBar />
          </Suspense>
          <main>
            {children}
          </main>
        </Theme>
      </body>
    </html>
    </SessionProvider>
  );
}
