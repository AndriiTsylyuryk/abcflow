import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/auth.context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://abcflow.online";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "ABCflow — AI Video Generation, Simplified",
    template: "%s | ABCflow",
  },
  description:
    "Generate stunning AI videos in seconds with Sora 2, Grok Imagine, Seedance and Veo 3. Simple monthly subscription, no credits to top up.",
  keywords: [
    "AI video generation",
    "text to video",
    "Sora 2",
    "Veo 3",
    "Grok video",
    "AI video creator",
    "AI video tool",
  ],
  authors: [{ name: "ABCflow", url: APP_URL }],
  creator: "ABCflow",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "ABCflow",
    title: "ABCflow — AI Video Generation, Simplified",
    description:
      "Generate stunning AI videos in seconds with Sora 2, Grok Imagine, Seedance and Veo 3. Simple monthly subscription.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ABCflow — AI Video Generation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ABCflow — AI Video Generation, Simplified",
    description:
      "Generate stunning AI videos in seconds. Powered by Sora 2, Veo 3, Grok & more.",
    images: ["/og-image.png"],
    creator: "@abcflow",
  },
  alternates: {
    canonical: APP_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
