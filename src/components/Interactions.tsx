"use client";

import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { incrementView, toggleLike, type PostStatsData } from "@/app/actions";
import { Eye, Heart, ThumbsUp } from "lucide-react";
import GlitchText from "@/components/ui/GlitchText";
import AuthStatusLoader from "@/components/ui/AuthStatusLoader";
import { LoginButton } from "@/components/AuthButton";

export function PostHeaderStats({ slug, initialStats }: { slug: string, initialStats: PostStatsData }) {
  useEffect(() => {
    incrementView(slug);
  }, [slug]);

  return (
    <>
      <div className="flex items-center gap-2 text-fbc-muted" title="浏览量">
        <Eye className="w-3 h-3" />
        <GlitchText text={initialStats.views} isLoading={false} minWidth="min-w-[4ch]" />
      </div>
      <div className="flex items-center gap-2 text-fbc-muted" title="点赞数">
        <Heart className="w-3 h-3" />
        <GlitchText text={initialStats.likes} isLoading={false} minWidth="min-w-[3ch]" />
      </div>
    </>
  );
}

export function PostLikeAction({ slug, initialStats }: { slug: string, initialStats: PostStatsData }) {
  const { data: session } = useSession();
  const [likes, setLikes] = useState(initialStats.likes);
  const [hasLiked, setHasLiked] = useState(initialStats.hasLiked);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLikes(initialStats.likes);
    setHasLiked(initialStats.hasLiked);
  }, [initialStats]);

  const handleLike = () => {
    if (!session) return;

    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes((prev) => (newHasLiked ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        await toggleLike(slug);
      } catch (error) {
        setHasLiked(!newHasLiked);
        setLikes((prev) => (!newHasLiked ? prev + 1 : prev - 1));
        console.error("Like failed", error);
      }
    });
  };

  return (
    <div className="my-12 py-8 border-y border-fbc-border/50 bg-fbc-dark/50 text-center">
      <p className="text-xs font-mono text-fbc-muted uppercase mb-6 tracking-widest">
        END
      </p>

      <p className="mb-6 text-sm font-bold text-fbc-text">
        如果喜欢的话，就点个赞吧~
      </p>

      <div className="flex justify-center">
        <AuthStatusLoader
          isLoggedIn={!!session}
          className="min-h-[48px]"
          userContent={
            <button
              onClick={handleLike}
              disabled={isPending}
              className={`
                group relative flex items-center gap-3 px-8 py-3 font-mono text-sm border transition-all duration-300
                ${hasLiked
                  ? "bg-fbc-red text-white border-fbc-red shadow-[0_0_15px_rgba(255,51,51,0.3)]"
                  : "bg-transparent text-fbc-text border-fbc-border hover:border-fbc-red hover:text-fbc-red"
                }
              `}
            >
              <ThumbsUp className={`w-4 h-4 transition-transform duration-300 ${hasLiked ? "scale-110" : "group-hover:-rotate-12"}`} />
              <span>{hasLiked ? "已点赞" : "点赞"}</span>
              <span className="border-l border-current pl-3 ml-1 opacity-80">
                {likes}
              </span>
            </button>
          }
          guestContent={
            <div className="flex flex-col items-center gap-3">
              <div className="scale-90">
                <LoginButton />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
