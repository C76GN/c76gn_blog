// src/app/poems/page.tsx
import { redirect } from 'next/navigation';
import { getPosts } from '@/lib/mdx';

export default function PoemsPage() {
  const poems = getPosts('poems');
  
  // 如果有文章，重定向到第一篇文章
  if (poems.length > 0) {
    redirect(`/poems/${poems[0].slug}`);
  }
  
  // 如果没有文章，重定向到主页
  redirect('/');
}
