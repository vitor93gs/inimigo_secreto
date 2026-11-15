import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "Inimigo Secreto — presentes, suspeitas e segundas intenções",
  description: "Organize sorteios de inimigo secreto com seus amigos. Descubra seu alvo e preserve o pouco que resta da amizade.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
