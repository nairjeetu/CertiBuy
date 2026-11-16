export const metadata = {
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
      <body>{children}</body>
    </html>
  );
}
