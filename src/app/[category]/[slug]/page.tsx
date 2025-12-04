import { notFound } from "next/navigation";
import { getPostBySlug, getPosts } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import PostHeader from "@/components/PostHeader";
import CommentSection from "@/components/CommentSection";
import TagSystem from "@/components/TagSystem";
import { PostLikeAction } from "@/components/Interactions";
import Image from "next/image";
import { getPostStats, getPostTags, getComments } from "@/app/actions";

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
      <span className="block my-8 relative w-full rounded-lg border border-fbc-border overflow-hidden bg-fbc-gray/20">
        <Image
          src={props.src}
          alt={props.alt || "文章配图"}
          width={800}
          height={450}
          className="w-full h-auto object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
          loading="lazy"
          style={{ width: "100%", height: "auto" }}
        />
        {props.alt && (
          <span className="block text-center text-xs text-fbc-muted mt-2 font-mono py-2 bg-fbc-dark/50">
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

  const fullSlug = `${params.category}/${post.slug}`;
  const dateStr = post.metadata.period || post.metadata.date || "未知时间";

  const [stats, tags, comments] = await Promise.all([
    getPostStats(fullSlug),
    getPostTags(fullSlug),
    getComments(fullSlug),
  ]);

  return (
    <article className="min-h-screen w-full relative">
      <PostHeader
        title={post.metadata.title}
        date={dateStr}
        slug={fullSlug}
        initialStats={stats}
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

          <PostLikeAction slug={fullSlug} initialStats={stats} />

          <div className="lg:hidden mt-8">
            <TagSystem slug={fullSlug} initialTags={tags} />
            <CommentSection slug={fullSlug} initialComments={comments} />
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-12">
            <TagSystem slug={fullSlug} initialTags={tags} />

            <div className="max-h-[calc(100vh-300px)] overflow-y-auto no-scrollbar">
              <CommentSection slug={fullSlug} initialComments={comments} compact={true} />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}