// src/app/[category]/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPostBySlug, getPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getComments, getPostTags } from "@/app/actions";
import Interactions from "@/components/Interactions";
import CommentSection from "@/components/CommentSection";
import TagSystem from "@/components/TagSystem";
import Image from "next/image";

// 预生成静态路径（SSG）
export async function generateStaticParams() {
  const dreams = getPosts("dreams");
  const poems = getPosts("poems");

  return [
    ...dreams.map((post) => ({ category: "dreams", slug: post.slug })),
    ...poems.map((post) => ({ category: "poems", slug: post.slug })),
  ];
}

// 自定义 MDX 组件
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

export default async function PostPage(props: {
  params: Promise<{ category: "dreams" | "poems"; slug: string }>;
}) {
  const params = await props.params;
  const post = getPostBySlug(params.category, params.slug);

  if (!post) {
    notFound();
  }

  // 构建完整的 slug（category/slug 格式）
  const fullSlug = `${params.category}/${post.slug}`;

  // 并行获取动态数据
  const [initialComments, initialTags] = await Promise.all([
    getComments(fullSlug),
    getPostTags(fullSlug)
  ]);

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
            {/* 优先展示 period 字段，降级展示 date */}
            {post.metadata.period || post.metadata.date || "未知时间"}
          </span>
          <Interactions slug={fullSlug} inline={true} />
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-8 xl:gap-12 relative w-full">
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

          <div className="lg:hidden mt-12">
            <TagSystem slug={fullSlug} initialTags={initialTags} />
            <CommentSection slug={fullSlug} initialComments={initialComments} />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-12 space-y-12">
            <TagSystem slug={fullSlug} initialTags={initialTags} />
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              <CommentSection slug={fullSlug} initialComments={initialComments} compact={true} />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

