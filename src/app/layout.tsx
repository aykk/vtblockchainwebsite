import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const neco = localFont({
  src: [
    {
      path: "../../fonts/Neco_Complete/Fonts/WEB/fonts/Neco-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../fonts/Neco_Complete/Fonts/WEB/fonts/Neco-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../fonts/Neco_Complete/Fonts/WEB/fonts/Neco-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../fonts/Neco_Complete/Fonts/WEB/fonts/Neco-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-neco",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VT Blockchain",
  description: "Virginia Tech Blockchain student organization website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${neco.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
