import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PomAI — Study OS",
  description: "Focus. Capture. Master. Your academic study operating system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
