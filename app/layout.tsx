import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git Orbit Mobile",
  description:
    "3D inspector for GitHub-backed system status, module connections, and evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
