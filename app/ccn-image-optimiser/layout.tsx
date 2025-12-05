import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCN Image Optimiser | Find.co",
  description: "Crop and resize any image in seconds while meeting all CCN image guidelines. Compress files and export as lightweight WEBP.",
};

export default function CCNLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

