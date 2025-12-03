// src/app/[category]/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPostBySlug, getPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getComments, getPostTags } from "@/app/actions";
import Interactions from "@/components/Interactions";
import CommentSection from "@/components/CommentSection";
import TagSystem from "@/components/TagSystem";
import Image from "next/image";
import { Suspense } from "react";

// 预生成静态路径（SSG）
export async function generateStaticParams() {
  const dreams = getPosts("dreams");
  const poems = getPosts("poems");

  return [
    ...dreams.map((post) => ({ category: "dreams", slug: post.slug })),
    ...poems.map((post) => ({ category: "poems", slug: post.slug })),
  ];
}

// 自定义 MDX 组件配置
const mdxComponents = {
  img: (props: any) => {
    return (
      <span className="block my-8 relative w-full">
        <Image
          src={props.src}
          alt={props.alt || "文章配图"}
          width={0}
          height={0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
          className="rounded-lg border border-fbc-border shadow-lg w-full h-auto"
          style={{ width: '100%', height: 'auto' }}
          loading="lazy"
        />
        {props.alt && (
          <span className="block text-center text-xs text-fbc-muted mt-2 font-mono">
            {props.alt}
          </span>
        )}
      </span>
    );
  },
};

// --- 异步加载包装组件 ---

// 标签系统加载器
async function AsyncTagSystem({ slug }: { slug: string }) {
  const initialTags = await getPostTags(slug);
  return <TagSystem slug={slug} initialTags={initialTags} />;
}

// 评论区域加载器
async function AsyncCommentSection({ slug, compact }: { slug: string, compact?: boolean }) {
  const initialComments = await getComments(slug);
  return <CommentSection slug={slug} initialComments={initialComments} compact={compact} />;
}

// --- 加载状态骨架屏 ---

function TagSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="h-4 w-16 bg-fbc-border/50 rounded mb-4"></div>
      <div className="h-24 bg-fbc-gray border border-fbc-border/50"></div>
    </div>
  );
}

function CommentSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={`animate-pulse ${compact ? "mt-0" : "mt-12"}`}>
      <div className="h-4 w-32 bg-fbc-border/50 rounded mb-4"></div>
      <div className={`bg-fbc-gray border border-fbc-border/50 mb-8 ${compact ? "h-20" : "h-32"}`}></div>
      <div className="space-y-4">
        <div className="h-16 bg-fbc-gray/30 rounded border-l border-fbc-border/30"></div>
        <div className="h-16 bg-fbc-gray/30 rounded border-l border-fbc-border/30"></div>
      </div>
    </div>
  );
}

// --- 主页面组件 ---

export default async function PostPage(props: {
  params: Promise<{ category: "dreams" | "poems"; slug: string }>;
}) {
  const params = await props.params;

  // 仅获取静态文章内容，不阻塞页面渲染
  const post = getPostBySlug(params.category, params.slug);

  if (!post) {
    notFound();
  }

  // 构建完整的 slug 标识
  const fullSlug = `${params.category}/${post.slug}`;

  return (
    <article className="animate-in fade-in duration-700 min-h-screen w-full">
      {/* 文章头部信息 */}
      <header className="mb-10 border-b border-fbc-border pb-6">
        <h1 className="text-3xl md:text-5xl font-black text-fbc-text uppercase tracking-tight leading-tight mb-4">
          {post.metadata.title}
        </h1>
        <div className="flex items-center gap-6 text-xs font-mono text-fbc-muted uppercase">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-fbc-red"></span>
            {post.metadata.period || post.metadata.date || "未知时间"}
          </span>
          {/* Interactions 为客户端组件，且内部自行管理状态，不阻塞 */}
          <Interactions slug={fullSlug} inline={true} />
        </div>
      </header>

      {/* 布局区域：左侧正文，右侧侧边栏（大屏） */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-8 xl:gap-12 relative w-full">

        {/* 主要内容区域 */}
        <div className="min-w-0">
          <div className="prose prose-invert prose-lg max-w-none 
            prose-headings:font-bold prose-headings:uppercase
            prose-p:text-fbc-text/90 prose-p:leading-relaxed prose-p:text-justify
            prose-a:text-fbc-red prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-fbc-yellow prose-blockquote:text-fbc-muted
          ">
            {post.content && (
              <MDXRemote source={post.content} components={mdxComponents} />
            )}
          </div>

          {/* 移动端底部交互区域 */}
          <div className="lg:hidden mt-12">
            <Suspense fallback={<TagSkeleton />}>
              <AsyncTagSystem slug={fullSlug} />
            </Suspense>
            <Suspense fallback={<CommentSkeleton />}>
              <AsyncCommentSection slug={fullSlug} />
            </Suspense>
          </div>
        </div>

        {/* 桌面端侧边固定区域 */}
        <aside className="hidden lg:block">
          <div className="sticky top-12 space-y-12">
            <Suspense fallback={<TagSkeleton />}>
              <AsyncTagSystem slug={fullSlug} />
            </Suspense>

            <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              <Suspense fallback={<CommentSkeleton compact={true} />}>
                <AsyncCommentSection slug={fullSlug} compact={true} />
              </Suspense>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}