'use client';

// src/components/PostList.tsx
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Post } from '@/lib/mdx';

interface PostListProps {
  dreams: Post[];
  poems: Post[];
}

export default function PostList({ dreams, poems }: PostListProps) {
  const [activeCategory, setActiveCategory] = useState<'dreams' | 'poems'>('dreams');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  const currentPosts = activeCategory === 'dreams' ? dreams : poems;

  // 搜索和排序逻辑
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = currentPosts;

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((post) => {
        const title = (post.metadata.title || post.slug).toLowerCase();
        const slug = post.slug.toLowerCase();
        return title.includes(query) || slug.includes(query);
      });
    }

    // 排序
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        if (a.metadata.date && b.metadata.date) {
          return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime();
        }
        if (a.metadata.date) return -1;
        if (b.metadata.date) return 1;
        return 0;
      } else {
        // 按标题排序
        const titleA = (a.metadata.title || a.slug).toLowerCase();
        const titleB = (b.metadata.title || b.slug).toLowerCase();
        return titleA.localeCompare(titleB, 'zh-CN');
      }
    });

    return sorted;
  }, [currentPosts, searchQuery, sortBy]);

  return (
    <section className="space-y-6">
      {/* 切换和搜索控制栏 */}
      <div className="bg-fbc-gray p-6 border border-fbc-border space-y-4">
        {/* 类别切换 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveCategory('dreams')}
            className={`px-6 py-2 font-bold transition-colors ${activeCategory === 'dreams'
              ? 'bg-fbc-yellow text-fbc-dark'
              : 'bg-fbc-gray border border-fbc-border text-fbc-text hover:border-fbc-yellow'
              }`}
          >
            梦
          </button>
          <button
            onClick={() => setActiveCategory('poems')}
            className={`px-6 py-2 font-bold transition-colors ${activeCategory === 'poems'
              ? 'bg-fbc-yellow text-fbc-dark'
              : 'bg-fbc-gray border border-fbc-border text-fbc-text hover:border-fbc-yellow'
              }`}
          >
            诗
          </button>
          <div className="flex-1"></div>
          <span className="text-xs font-mono text-fbc-muted">
            {filteredAndSortedPosts.length} / {currentPosts.length} 篇
          </span>
        </div>

        {/* 搜索和排序 */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-fbc-dark border border-fbc-border px-4 py-2 text-fbc-text font-mono focus:outline-none focus:border-fbc-yellow transition-colors"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
            className="bg-fbc-dark border border-fbc-border px-4 py-2 text-fbc-text font-mono focus:outline-none focus:border-fbc-yellow transition-colors"
          >
            <option value="date">按日期排序</option>
            <option value="title">按标题排序</option>
          </select>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="space-y-4">
        {filteredAndSortedPosts.length > 0 ? (
          filteredAndSortedPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/${activeCategory}/${post.slug}`}
              scroll={false}
              prefetch={false}
              className="block bg-fbc-gray p-6 border border-fbc-border hover:border-fbc-yellow transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-fbc-text group-hover:text-fbc-yellow transition-colors mb-2">
                    {post.metadata.title || post.slug}
                  </h3>
                  <p className="text-xs font-mono text-fbc-muted">
                    RECORDED: {post.metadata.period || post.metadata.date || "UNKNOWN"}
                  </p>
                </div>
                <div className="text-xs font-mono text-fbc-red opacity-50 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-fbc-gray p-6 border border-fbc-border text-center text-fbc-muted font-mono">
            未找到匹配的内容
          </div>
        )}
      </div>
    </section>
  );
}

