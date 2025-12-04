"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { PostHeaderStats } from "@/components/Interactions";
import { useSidebar } from "@/lib/sidebar-context";

interface PostHeaderProps {
  title: string;
  date: string;
  slug: string;
}

export default function PostHeader({ title, date, slug }: PostHeaderProps) {
  const [isSticky, setIsSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const { isCollapsed } = useSidebar();
  const [stickyPaddingLeft, setStickyPaddingLeft] = useState(0);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsSticky(false);
  }, [pathname]);

  useEffect(() => {
    const updatePadding = () => {
      if (typeof window !== 'undefined') {
        const padding = window.innerWidth >= 768
          ? (isCollapsed ? 64 : 256)
          : 0;
        setStickyPaddingLeft(padding);
      }
    };

    updatePadding();
    window.addEventListener('resize', updatePadding);
    return () => window.removeEventListener('resize', updatePadding);
  }, [isCollapsed]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (headerRef.current) {
            const rect = headerRef.current.getBoundingClientRect();
            const shouldShow = rect.bottom < 10;
            setIsSticky(shouldShow);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const StickyHeaderContent = (
    <AnimatePresence mode="wait">
      {isSticky && (
        <motion.div
          key="sticky-header"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 z-40 h-16 pointer-events-none"
          style={{
            paddingLeft: `${stickyPaddingLeft}px`,
            transition: 'padding-left 300ms ease-in-out'
          }}
        >
          <div className="bg-fbc-dark/95 backdrop-blur-md border-b border-fbc-border h-full flex items-center shadow-lg pointer-events-auto">
            <div className="w-full px-6 md:px-12 lg:px-20 flex items-center gap-3 md:gap-4 overflow-hidden">
              <h2
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs md:text-sm font-bold text-fbc-text uppercase tracking-tight shrink-0 max-w-[40%] md:max-w-[50%] truncate cursor-pointer hover:text-fbc-red transition-colors"
              >
                {title}
              </h2>
              <div className="w-px h-4 bg-fbc-border shrink-0"></div>
              <div className="flex items-center gap-3 md:gap-4 text-xs font-mono text-fbc-muted uppercase flex-shrink-0">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <span className="w-2 h-2 bg-fbc-red shrink-0"></span>
                  <span className="hidden sm:inline">{date}</span>
                </span>
                <PostHeaderStats slug={slug} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <header ref={headerRef} className="mb-10 border-b border-fbc-border pb-6 relative z-10">
        <h1 className="text-3xl md:text-5xl font-black text-fbc-text uppercase tracking-tight leading-tight mb-4">
          {title}
        </h1>
        <div className="flex items-center gap-6 text-xs font-mono text-fbc-muted uppercase">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-fbc-red"></span>
            {date}
          </span>
          <PostHeaderStats slug={slug} />
        </div>
      </header>

      {mounted && createPortal(StickyHeaderContent, document.body)}
    </>
  );
}