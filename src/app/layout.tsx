import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Manrope, Inter } from "next/font/google";
import "./globals.css";
import "./colourful.css";
import Chrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import SiteFooter from "@/components/site/footer";
import FooterGate from "@/components/site/footer-gate";
import MobileTabBar from "@/components/site/mobile-tabbar";
import PWARegister from "@/components/site/pwa";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AEROVÉL — The World Is Yours", template: "%s · AEROVÉL" },
  description:
    "A premium airline booking experience. Discover remarkable destinations, compare flights, choose your seat and travel beyond ordinary.",
  manifest: "/manifest.webmanifest",
  applicationName: "AEROVÉL",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AEROVÉL" },
  icons: { icon: "/icons/icon-512.svg", apple: "/icons/icon-512.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0c1928",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${manrope.variable} ${inter.variable}`}>
      <body className="bg-ivory text-navy-900 antialiased">
        <SiteNav />
        <Chrome />
        <main className="min-h-screen">{children}</main>
        <FooterGate><SiteFooter /></FooterGate>
        <MobileTabBar />
        <PWARegister />
      </body>
    </html>
  );
}