import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Rounded, friendly font. next/font downloads it at build time, so the live site
// serves it from GitHub Pages (no request to Google when people use the app).
const nunito = Nunito({ subsets: ["latin"], weight: ["600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "ClotParcament",
  description: "Entre tots trobem més llocs per aparcar al Clot",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF6EC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca">
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
