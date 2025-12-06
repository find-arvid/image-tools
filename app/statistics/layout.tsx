import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics | Find.co",
  description: "Tool usage statistics",
};

export default function StatisticsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

