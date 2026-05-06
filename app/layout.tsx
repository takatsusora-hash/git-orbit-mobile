import type { Metadata } from "next";
import "./globals.css";
import { PwaRegistration } from "@/components/PwaRegistration";
import { withBasePath } from "@/lib/site";

export const metadata: Metadata = {
  title: "Git Orbit Mobile",
  description:
    "3D inspector for GitHub-backed system status, module connections, and evidence.",
  applicationName: "Git Orbit Mobile",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Git Orbit Mobile",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: withBasePath("/icon.svg"),
    apple: withBasePath("/apple-icon.svg"),
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
  themeColor: "#f6f7f4",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <PwaRegistration />
        {children}
      </body>
    </html>
  );
}
