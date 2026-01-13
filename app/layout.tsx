import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Western Nebraska Sports Council",
  description: "Assisting local organizations in developing and promoting sporting events to drive tourism to Western Nebraska.",
  keywords: "sports, Nebraska, tourism, events, sports council",
  openGraph: {
    title: "Western Nebraska Sports Council",
    description: "Assisting local organizations in developing and promoting sporting events to drive tourism to Western Nebraska.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
