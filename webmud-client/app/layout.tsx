import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "webMUD",
  description:
    "webMUD client v0.0",
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div>
          <main>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
