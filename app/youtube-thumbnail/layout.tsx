import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube Video Thumbnail | Find.co",
  description: "Create custom YouTube video thumbnails by combining backgrounds, foregrounds, and text. Export optimized thumbnails ready for YouTube.",
};

export default function YouTubeThumbnailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
