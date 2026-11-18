import type { Metadata } from "next";
import { Onest, Instrument_Serif } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CertiBuy",
  description: "Certified pre-owned device marketplace for India",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${onest.variable} ${instrumentSerif.variable}`}>
      <body>
        <a href="#main-content" className="sr-only">Skip to main content</a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
