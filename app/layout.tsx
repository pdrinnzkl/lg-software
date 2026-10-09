import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./landing.css";
import "./system.css";
import "./accessible-themes.css";
import { AccessibilityControls } from "../components/ui/AccessibilityControls";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4f5f7",
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = protocol + "://" + host;
  return {
    metadataBase: new URL(origin),
    title: {
      default: "Interclasse LGF — Luiz Gonzaga Fleury",
      template: "%s · Interclasse LGF",
    },
    description:
      "Jogos, placares ao vivo e classificação do Interclasse Luiz Gonzaga Fleury.",
    icons: { icon: "/logo-escola.png", apple: "/logo-escola.png" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title: "Interclasse LGF — Luiz Gonzaga Fleury",
      description: "Cada lance. Cada turma. Uma só história.",
      images: [
        {
          url: origin + "/og.png",
          width: 1672,
          height: 942,
          alt: "Interclasse Luiz Gonzaga Fleury 2026",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Interclasse LGF — Luiz Gonzaga Fleury",
      description: "Cada lance. Cada turma. Uma só história.",
      images: [origin + "/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="light" data-large-text="false">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <AccessibilityControls />
      </body>
    </html>
  );
}
