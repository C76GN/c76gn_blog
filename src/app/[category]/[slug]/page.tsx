import { notFound } from "next/navigation";
import { getPostBySlug, getPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PostLikeAction } from "@/components/Interactions";
import PostHeader from "@/components/PostHeader";
import CommentSection from "@/components/CommentSection";
import TagSystem from "@/components/TagSystem";
import Image from "next/image";

export async function generateStaticParams() {
  const dreams = getPosts("dreams");
  const poems = getPosts("poems");

  return [
    ...dreams.map((post) => ({ category: "dreams", slug: post.slug })),
    ...poems.map((post) => ({ category: "poems", slug: post.slug })),
  ];
}

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
          style={{ width: "100%", height: "auto" }}
          loading="lazy"
        />
        {props.alt && (
          <span className="block text-center text-xs text-fbc-muted mt-2 font-mono">{props.alt}</span>
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

  const fullSlug = `${params.category}/${post.slug}`;

  // 格式化日期
  const dateStr = post.metadata.period || post.metadata.date || "未知时间";

  return (
    <article className="min-h-screen w-full relative">
      {/* 替换旧的 header，使用支持吸顶动画的新组件 */}
      <PostHeader
        title={post.metadata.title}
        date={dateStr}
        slug={fullSlug}
      />

      <div className="lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_400px] gap-8 xl:gap-12 relative w-full">
        <div className="min-w-0">
          <div
            className="prose prose-invert prose-lg max-w-none 
            prose-headings:font-bold prose-headings:uppercase
            prose-p:text-fbc-text/90 prose-p:leading-relaxed prose-p:text-justify
            prose-a:text-fbc-red prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-fbc-yellow prose-blockquote:text-fbc-muted
          "
          >
            {post.content && <MDXRemote source={post.content} components={mdxComponents} />}
          </div>

          <PostLikeAction slug={fullSlug} />

          <div className="lg:hidden mt-8">
            <TagSystem slug={fullSlug} initialTags={[]} />
            <CommentSection slug={fullSlug} />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-12">
            <TagSystem slug={fullSlug} initialTags={[]} />

            <div className="max-h-[calc(100vh-300px)] overflow-y-auto no-scrollbar">
              <CommentSection slug={fullSlug} compact={true} />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}