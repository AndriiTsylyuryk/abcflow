import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { AuthProvider } from "@/contexts/auth.context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://abcflow.online";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "AI Video Generator Online – Create Videos from Text | ABCflow",
    template: "%s | ABCflow",
  },
  description:
    "Create AI videos from text instantly with ABCflow. Generate high-quality videos using advanced AI models like Sora, Veo, and Seedance in seconds.",
  keywords: [
    "AI video generator",
    "text to video",
    "create AI videos",
    "AI video generation",
    "Sora 2",
    "Veo 3",
    "Grok video",
    "AI video creator",
    "AI video tool",
    "text to video AI",
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
    title: "AI Video Generator Online – Create Videos from Text | ABCflow",
    description:
      "Create AI videos from text instantly with ABCflow. Generate high-quality videos using Sora 2, Veo 3, Seedance, and Grok Imagine.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ABCflow — AI Video Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Video Generator Online – Create Videos from Text | ABCflow",
    description:
      "Create AI videos from text instantly. Powered by Sora 2, Veo 3, Grok & Seedance.",
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
        {/* Facebook Pixel */}
        {process.env.NEXT_PUBLIC_FB_PIXEL_ID && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${process.env.NEXT_PUBLIC_FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </body>
    </html>
  );
}
