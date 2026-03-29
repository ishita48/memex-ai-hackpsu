import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memex AI — Incident Intelligence Platform",
  description:
    "The memory layer for your entire stack. Semantic search, incident clustering, root-cause analysis, and commit-linked debugging powered by OpenClaw.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body className="noise-bg">{children}</body>
      </html>
    </ClerkProvider>
  );
}
