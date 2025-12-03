'use client';

import { usePathname } from 'next/navigation';
import SidebarContent from './SidebarContent';
import type { Post } from '@/lib/mdx';

export default function ConditionalSidebar({ dreams, poems }: { dreams: Post[]; poems: Post[] }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    return null;
  }

  return <SidebarContent dreams={dreams} poems={poems} />;
}

