import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "./pwa-register";
import { publicPath } from "../lib/path";

export const metadata: Metadata = {
  metadataBase: new URL("https://edubonke.github.io/EduBonke/"),
  openGraph: {
    type: "website",
    images: [{
      url: "https://edubonke.github.io/EduBonke/edubonke-social.png",
      width: 1200, height: 630, type: "image/png",
      alt: "EduBonke college administration demo for South African private colleges",
    }],
    locale: "en_ZA",
    siteName: "EduBonke",
    title: "EduBonke | College administration demo",
    description: "Try admissions, learner records and moderation with invented college data.",
  },
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
