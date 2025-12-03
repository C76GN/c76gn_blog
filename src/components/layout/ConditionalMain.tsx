// src/components/layout/ConditionalMain.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useSidebar } from '@/lib/sidebar-context';

export default function ConditionalMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  
  const isHomePage = pathname === '/';
  const isPostPage = pathname.split('/').filter(Boolean).length === 2;

  // 动态计算左边距
  // 首页：居中布局，无边距
  // 非首页 & 展开：ml-64 (16rem)
  // 非首页 & 折叠：ml-16 (4rem)
  const marginClass = isHomePage 
    ? '' 
    : isCollapsed 
      ? 'md:ml-16' 
      : 'md:ml-64';

  return (
    <main 
      className={`
        ${isHomePage ? 'w-full' : 'flex-1'} p-6 md:p-12 lg:p-20 transition-[margin] duration-300 ease-in-out
        ${marginClass}
        ${isPostPage ? "max-w-[1600px] mx-auto" : "max-w-4xl mx-auto"}
      `}
    >
      {children}
    </main>
  );
}
