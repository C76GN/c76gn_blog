"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import FrozenRoute from "./FrozenRoute";
import { useSidebar } from "@/lib/sidebar-context";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isCollapsed } = useSidebar();

    const isHomePage = pathname === "/";
    const isPostPage = pathname.split("/").filter(Boolean).length === 2;

    const marginClass = isHomePage
        ? ""
        : isCollapsed ? "md:ml-16" : "md:ml-64";

    const containerClass = `
    min-h-screen
    p-6 md:p-12 lg:px-20 
    transition-[margin] duration-300 ease-in-out
    ${marginClass}
    ${isPostPage ? "max-w-[1600px] mx-auto" : "max-w-4xl mx-auto"}
  `;

    return (
        <AnimatePresence
            mode="wait"
            onExitComplete={() => {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            }}
        >
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(5px)" }}
                transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                }}
                className={containerClass}
            >
                <FrozenRoute>
                    {children}
                </FrozenRoute>
            </motion.div>
        </AnimatePresence>
    );
}
