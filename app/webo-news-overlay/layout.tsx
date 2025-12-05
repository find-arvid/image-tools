import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webopedia News Overlay | Find.co",
  description: "Turn any image into a Webopedia news visual in seconds. Convert to greyscale, crop to 16:9, and apply branded overlays.",
};

export default function WebopediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

