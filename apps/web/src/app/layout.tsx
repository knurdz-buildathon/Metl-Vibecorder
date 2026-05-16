import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Metl-VibeCoder",
  description: "AI coding workspace powered by Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
