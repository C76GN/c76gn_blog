'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Post } from '@/lib/mdx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  BookOpen,
  Feather
} from 'lucide-react';
import { useSidebar } from '@/lib/sidebar-context';

export default function SidebarContent({ dreams, poems }: { dreams: Post[]; poems: Post[] }) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar } = useSidebar();

  const [groupsState, setGroupsState] = useState({
    dreams: true,
    poems: true
  });

  const dreamsRef = useRef<HTMLDivElement>(null);
  const poemsRef = useRef<HTMLDivElement>(null);

  const toggleGroup = (group: 'dreams' | 'poems', ref: React.RefObject<HTMLDivElement | null>) => {
    if (groupsState[group] && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setGroupsState(prev => ({ ...prev, [group]: !prev[group] }));
  };

  useEffect(() => {
    toggleMobileSidebar(false);
  }, [pathname, toggleMobileSidebar]);

  const renderPostList = (posts: Post[], category: string) => (
    <ul className="space-y-0.5 pb-4">
      {posts.map((post) => {
        const active = pathname === `/${category}/${post.slug}`;
        return (
          <li key={post.slug}>
            <Link
              href={`/${category}/${post.slug}`}
              scroll={false}
              prefetch={false}
              className={`
                group flex items-center px-4 py-2 text-xs font-mono transition-all duration-200
                ${active
                  ? 'bg-fbc-red/10 text-fbc-red border-l-2 border-fbc-red'
                  : 'text-fbc-muted hover:text-fbc-text hover:bg-fbc-gray border-l-2 border-transparent hover:border-fbc-yellow'
                }
              `}
              title={post.metadata.title || post.slug}
            >
              <span className={`truncate ${isCollapsed ? 'hidden' : 'block'}`}>
                {post.metadata.title || post.slug}
              </span>
              {isCollapsed && (
                <div className={`w-1.5 h-1.5 rounded-full mx-auto ${active ? 'bg-fbc-red' : 'bg-fbc-muted'}`} />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <button
        onClick={() => toggleMobileSidebar(true)}
        className={`md:hidden fixed top-4 left-4 z-50 p-2 bg-fbc-dark border border-fbc-border text-fbc-text shadow-lg ${isMobileOpen ? 'hidden' : 'block'}`}
      >
        <Menu className="w-5 h-5" />
      </button>

      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => toggleMobileSidebar(false)}
        />
      )}

      <motion.aside
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "-100%", opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`
          fixed top-0 left-0 h-full bg-fbc-dark border-r border-fbc-border z-50 flex flex-col
          ${isMobileOpen ? 'translate-x-0 w-64' : 'hidden md:flex'}
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
          md:transition-[width] md:duration-300
        `}
      >
        <div className="flex-none p-4 border-b border-fbc-border flex items-center justify-between h-16">
          <Link href="/" scroll={false} prefetch={false} className="overflow-hidden flex items-center">
            {isCollapsed ? (
              <span className="text-xl font-black text-fbc-red mx-auto">C.</span>
            ) : (
              <h1 className="text-lg font-black tracking-widest text-fbc-text uppercase whitespace-nowrap">
                C76GN<span className="text-fbc-red">.</span>Blog
              </h1>
            )}
          </Link>
          <button
            onClick={() => toggleMobileSidebar(false)}
            className="md:hidden text-fbc-muted hover:text-fbc-red"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div ref={dreamsRef} className="relative">
            <div
              onClick={() => !isCollapsed && toggleGroup('dreams', dreamsRef)}
              className={`
                sticky top-0 z-10 bg-fbc-dark/95 backdrop-blur border-b border-fbc-border/50
                flex items-center justify-between px-4 py-3 cursor-pointer select-none group hover:bg-fbc-gray/50 transition-colors
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div className="flex items-center gap-2 text-fbc-red font-bold text-xs uppercase tracking-widest">
                <BookOpen className="w-3 h-3" />
                {!isCollapsed && <span>梦 ({dreams.length})</span>}
              </div>
              {!isCollapsed && (
                <span className="text-fbc-muted transition-transform duration-200">
                  {groupsState.dreams ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
              )}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${groupsState.dreams || isCollapsed ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {renderPostList(dreams, 'dreams')}
            </div>
          </div>

          <div ref={poemsRef} className="relative border-t border-fbc-border">
            <div
              onClick={() => !isCollapsed && toggleGroup('poems', poemsRef)}
              className={`
                sticky top-0 z-10 bg-fbc-dark/95 backdrop-blur border-b border-fbc-border/50
                flex items-center justify-between px-4 py-3 cursor-pointer select-none group hover:bg-fbc-gray/50 transition-colors
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <div className="flex items-center gap-2 text-fbc-red font-bold text-xs uppercase tracking-widest">
                <Feather className="w-3 h-3" />
                {!isCollapsed && <span>诗 ({poems.length})</span>}
              </div>
              {!isCollapsed && (
                <span className="text-fbc-muted transition-transform duration-200">
                  {groupsState.poems ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
              )}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${groupsState.poems || isCollapsed ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {renderPostList(poems, 'poems')}
            </div>
          </div>
        </div>

        <div className="flex-none p-3 border-t border-fbc-border hidden md:flex justify-end bg-fbc-dark">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-sm hover:bg-fbc-gray text-fbc-muted hover:text-fbc-text transition-colors w-full flex items-center justify-center"
            title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
