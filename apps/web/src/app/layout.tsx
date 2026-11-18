import type { Metadata } from "next";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

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
    <html lang="en">
      <body>
        <a href="#main-content" className="sr-only">Skip to main content</a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
