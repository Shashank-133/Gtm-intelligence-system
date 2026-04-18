import type { Metadata } from "next";
import { Syne, DM_Mono, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["400","500","600","700","800"] });
const dmMono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300","400","500"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["300","400","500"] });

export const metadata: Metadata = {
  title: "Outmate GTM Intelligence",
  description: "Multi-Agent AI system for Go-To-Market intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmMono.variable} ${dmSans.variable}`}>
        {children}
      </body>
    </html>
  );
}
