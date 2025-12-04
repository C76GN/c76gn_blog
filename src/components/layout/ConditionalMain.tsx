"use client";

import PageTransition from "./PageTransition";

export default function ConditionalMain({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full min-h-screen relative">
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
