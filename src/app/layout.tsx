// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ConditionalSidebar from "@/components/layout/ConditionalSidebar";
import ConditionalMain from "@/components/layout/ConditionalMain";
import SessionProvider from "@/components/SessionProvider";
import { SidebarProvider } from "@/lib/sidebar-context";
import { getPosts } from "@/lib/mdx";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "C76GN | 博客",
  description: "主要用来记录我的梦",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 在 Server Component 中获取数据
  const dreams = getPosts('dreams');
  const poems = getPosts('poems');

  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-fbc-dark text-fbc-text`}
      >
        {/* 1. 噪点层 */}
        <div className="bg-noise" />

        <SessionProvider>
          {/* 包裹 SidebarProvider */}
          <SidebarProvider>
            <div className="flex flex-col md:flex-row min-h-screen relative z-10">
              {/* 2. 侧边栏 - 只在非首页显示 */}
              <ConditionalSidebar dreams={dreams} poems={poems} />

              {/* 3. 主内容区域 */}
              <ConditionalMain>
                {children}
              </ConditionalMain>
            </div>
          </SidebarProvider>
        </SessionProvider>
      </body>
    </html>
  );
}