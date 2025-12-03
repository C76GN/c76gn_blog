// src/lib/sidebar-context.tsx

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileOpen: boolean;
  toggleMobileSidebar: (open?: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // 桌面端默认展开
  const [isCollapsed, setIsCollapsed] = useState(false);
  // 移动端默认关闭
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 切换桌面端折叠
  const toggleSidebar = useCallback(() => setIsCollapsed((prev) => !prev), []);

  // 切换移动端抽屉
  const toggleMobileSidebar = useCallback((state?: boolean) => {
    setIsMobileOpen((prev) => (state !== undefined ? state : !prev));
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed, toggleSidebar, isMobileOpen, toggleMobileSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

