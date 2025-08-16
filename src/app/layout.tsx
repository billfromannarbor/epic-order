import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Epic Order",
  description: "Put History in it's place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Standard favicon */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" href="/favicon.ico" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/favicon-57x57.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/favicon-72x72.png" />
        <link rel="apple-touch-icon" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/favicon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/favicon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/favicon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/favicon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />

        {/* Android / Chrome */}
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/favicon-256x256.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />

        {/* Manifest for PWA */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#4B2E1F" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
