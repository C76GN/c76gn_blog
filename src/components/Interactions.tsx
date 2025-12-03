"use client";

import { useEffect, useState } from "react";
import { incrementView, getPostStats, toggleLike } from "@/app/actions";
import { Eye, Heart } from "lucide-react";

export default function Interactions({ slug, inline = false }: { slug: string; inline?: boolean }) {
  const [stats, setStats] = useState({ views: 0, likes: 0, hasLiked: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. 页面加载时增加浏览量
    incrementView(slug);

    // 2. 获取最新数据
    const fetchStats = async () => {
      const data = await getPostStats(slug);
      setStats(data);
      setIsLoading(false);
    };
    fetchStats();
  }, [slug]);

  const handleLike = async () => {
    // 乐观更新 (Optimistic Update)：在服务器响应前预先更新 UI
    setStats((prev) => ({
      ...prev,
      likes: prev.hasLiked ? prev.likes - 1 : prev.likes + 1,
      hasLiked: !prev.hasLiked,
    }));

    try {
      await toggleLike(slug);
    } catch (error) {
      // 请求失败时回滚状态
      console.error("Like failed", error);
    }
  };

  if (isLoading && !inline) return <div className="text-fbc-muted font-mono text-xs">加载数据中...</div>;

  if (inline) {
    return (
      <>
        {/* 浏览量 */}
        <div className="flex items-center gap-2 text-fbc-muted" title="浏览量">
          <Eye className="w-3 h-3" />
          <span>{isLoading ? "..." : stats.views}</span>
        </div>

        {/* 点赞按钮 */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors group ${stats.hasLiked ? "text-fbc-red" : "text-fbc-muted hover:text-fbc-red"
            }`}
          title="点赞"
        >
          <Heart
            className={`w-3 h-3 transition-transform group-active:scale-90 ${stats.hasLiked ? "fill-current" : ""
              }`}
          />
          <span>{isLoading ? "..." : stats.likes}</span>
        </button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-6 font-mono text-sm border-y border-fbc-border py-4 my-8">
      {/* 浏览量 */}
      <div className="flex items-center gap-2 text-fbc-muted" title="浏览量">
        <Eye className="w-4 h-4" />
        <span>{stats.views}</span>
      </div>

      {/* 点赞按钮 */}
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 transition-colors group ${stats.hasLiked ? "text-fbc-red" : "text-fbc-muted hover:text-fbc-red"
          }`}
        title="点赞"
      >
        <Heart
          className={`w-4 h-4 transition-transform group-active:scale-90 ${stats.hasLiked ? "fill-current" : ""
            }`}
        />
        <span>{stats.likes}</span>
      </button>

      <div className="flex-1"></div>
    </div>
  );
}

