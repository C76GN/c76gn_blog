// src/app/page.tsx
import { getPosts } from '@/lib/mdx';
import PostList from '@/components/PostList';

export default function Home() {
  const dreams = getPosts('dreams');
  const poems = getPosts('poems');

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="border-b border-fbc-border pb-8">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-fbc-text mb-4">
          <span className="text-fbc-red">C76GN Blog</span>
        </h1>
        <p className="text-lg text-fbc-muted font-mono max-w-2xl">
          这里记录了我的梦。
        </p>
      </header>

      <PostList dreams={dreams} poems={poems} />

      <footer className="pt-20 text-xs font-mono text-fbc-border">
        &copy; {new Date().getFullYear()} C76GN. All rights reserved.
      </footer>
    </div>
  );
}
