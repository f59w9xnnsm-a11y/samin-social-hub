import type { Metadata } from "next";
import "./globals.css";
import "./queue.css";

export const metadata: Metadata = {
  title: "SAMIN SOCIAL HUB — Dein Social Media Cockpit",
  description: "Kunden, Inhalte und Redaktionsplanung an einem Ort.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
