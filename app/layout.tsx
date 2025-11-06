import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASVS Code Security Reviewer",
  description: "Security code review based on OWASP ASVS standards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
