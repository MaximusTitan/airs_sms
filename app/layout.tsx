import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "AIRS-SMS",
  description: "Advanced Lead Management and SMS System",
  keywords: ["CRM", "leads", "email", "forms", "analytics"],
  authors: [{ name: "AIRS Team" }],
  robots: "index, follow",
  openGraph: {
    title: "AIRS-SMS",
    description: "Advanced Lead Management and SMS System",
    url: defaultUrl,
    siteName: "AIRS-SMS",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AIRS-SMS Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIRS-SMS",
    description: "Advanced Lead Management and SMS System",
    images: ["/og-image.jpg"],
  },
  verification: {
    google: "your-google-verification-code",
  },
};

// Optimize font loading with display: swap and preload critical fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
  preload: true,
  fallback: ["system-ui", "arial"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/geist-sans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//urjcavadwlpthjfeuvtk.supabase.co" />
        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://urjcavadwlpthjfeuvtk.supabase.co" crossOrigin="anonymous" />
        {/* Viewport optimization for Core Web Vitals */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Optimize resource loading */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
