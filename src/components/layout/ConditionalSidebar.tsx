'use client';

import { usePathname } from 'next/navigation';
import SidebarContent from './SidebarContent';
import type { Post } from '@/lib/mdx';
import { AnimatePresence } from 'framer-motion';

export default function ConditionalSidebar({ dreams, poems }: { dreams: Post[]; poems: Post[] }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <AnimatePresence mode="wait">
      {!isHomePage && (
        <SidebarContent dreams={dreams} poems={poems} />
      )}
    </AnimatePresence>
  );
}

