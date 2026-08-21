import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import BottomNav from "./components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QaitaJanaru",
  description: "Сдайте отходы, получите бонусы и помогайте планете. Исцеляйте мир вместе с Кайта  жанару.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)]">
        <ThemeProvider>
          <LanguageProvider>
            <div className="flex-1 min-h-screen max-w-3xl mx-auto w-full">
              {children}
            </div>
            <BottomNav />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
