import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, VT323 } from "next/font/google";
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

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
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
  title: "Virginia Tech Blockchain",
  description: "Virginia Tech Blockchain student organization website",
  icons: {
    apple: "/pudgyhokie-transparent.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${neco.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
