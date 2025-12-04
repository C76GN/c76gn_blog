"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AuthStatusLoaderProps {
  isLoggedIn: boolean;
  userContent: React.ReactNode;
  guestContent: React.ReactNode;
  className?: string;
}

/**
 * 身份状态切换器
 * 默认显示访客内容，检测到登录后优雅切换，移除中间态
 */
export default function AuthStatusLoader({
  isLoggedIn,
  userContent,
  guestContent,
  className = "",
}: AuthStatusLoaderProps) {
  return (
    <div className={`relative overflow-hidden min-h-[40px] flex items-center ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        {isLoggedIn ? (
          <motion.div
            key="user"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="w-full"
          >
            {userContent}
          </motion.div>
        ) : (
          <motion.div
            key="guest"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {guestContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
