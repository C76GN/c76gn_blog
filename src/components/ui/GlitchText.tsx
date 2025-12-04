"use client";

import { useEffect, useState, useRef } from "react";

const CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>/?AZ09";

interface GlitchTextProps {
  text: string | number;
  isLoading: boolean;
  className?: string;
  minWidth?: string;
}

/**
 * 乱码解密文字组件
 * 处于 isLoading 状态时，字符会随机跳变
 * 加载完成后，定格为 text 内容
 * minWidth 用于预留宽度，防止数字变化时影响周围布局
 */
export default function GlitchText({ 
  text, 
  isLoading, 
  className = "", 
  minWidth = "min-w-[3ch]"
}: GlitchTextProps) {
  const [display, setDisplay] = useState("---");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isLoading) {
      intervalRef.current = setInterval(() => {
        const randomStr = Array(3)
          .fill(0)
          .map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
          .join("");
        setDisplay(randomStr);
      }, 60);
    } else {
      let steps = 0;
      const finalStr = String(text);

      intervalRef.current = setInterval(() => {
        steps++;
        if (steps > 6) {
          setDisplay(finalStr);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          const randomStr = Array(finalStr.length)
            .fill(0)
            .map(() => CHARS[Math.floor(Math.random() * CHARS.length)])
            .join("");
          setDisplay(randomStr);
        }
      }, 50);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading, text]);

  return (
    <span className={`tabular-nums font-mono inline-block text-center ${minWidth} ${className}`}>
      {display}
    </span>
  );
}
