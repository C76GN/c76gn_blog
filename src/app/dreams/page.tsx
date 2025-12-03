// src/app/dreams/page.tsx
import { redirect } from 'next/navigation';
import { getPosts } from '@/lib/mdx';

export default function DreamsPage() {
  const dreams = getPosts('dreams');
  
  // 如果有文章，重定向到第一篇文章
  if (dreams.length > 0) {
    redirect(`/dreams/${dreams[0].slug}`);
  }
  
  // 如果没有文章，重定向到主页
  redirect('/');
}
