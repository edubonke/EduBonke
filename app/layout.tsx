import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";
import { publicPath } from "../lib/path";

export const metadata: Metadata = {
  title: "EduBonke College Management Platform",
  description: "A multi-college administration and academic operations platform for South African private colleges.",
  manifest: publicPath("/manifest.webmanifest"),
  applicationName: "EduBonke",
  icons: { icon: publicPath("/favicon.svg"), shortcut: publicPath("/favicon.svg") },
};

export const viewport: Viewport = { themeColor: "#087f75" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-ZA">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
