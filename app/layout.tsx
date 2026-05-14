import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Cormorant_Garamond,
  Oswald,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import NavBar from "./components/NavBar";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mighty Flights",
  description: "Darts league management — standings, fixtures, and game nights.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mighty Flights",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E1A12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${cormorantGaramond.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mf-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <ServiceWorkerRegister />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
