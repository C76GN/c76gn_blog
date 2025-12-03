"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { postComment } from "@/app/actions";
import { LoginButton, LogoutButton } from "./AuthButton";
import Image from "next/image";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  user: { name: string | null; image: string | null };
};

export default function CommentSection({
  slug,
  initialComments,
  compact = false // 紧凑模式，用于减少间距
}: {
  slug: string,
  initialComments: Comment[],
  compact?: boolean
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      // 调用 Server Action
      await postComment(slug, input);

      // 更新本地列表以即时反馈
      const newComment = {
        id: Math.random().toString(),
        content: input,
        createdAt: new Date(),
        user: {
          name: session.user.name || "匿名用户",
          image: session.user.image || null,
        },
      };
      setComments([newComment, ...comments]);
      setInput("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={compact ? "mt-0" : "mt-12"}>
      <h3 className="text-sm font-mono font-bold text-fbc-muted uppercase mb-4 tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-fbc-red animate-pulse"></span>
        留下您的评论吧 ({comments.length})
      </h3>

      {/* 评论输入框 - Compact 模式下更紧凑 */}
      <div className={`mb-8 bg-fbc-gray border border-fbc-border ${compact ? "p-4" : "p-6"}`}>
        {session ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <Image src={session.user.image} alt="头像" width={32} height={32} className="rounded-full border border-fbc-border" />
                )}
                <span className="font-mono text-sm text-fbc-yellow">{session.user?.name}</span>
              </div>
              <LogoutButton />
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="写点什么..."
              className={`w-full bg-fbc-dark border border-fbc-border p-3 text-fbc-text focus:border-fbc-red font-mono text-xs mb-2 ${compact ? "min-h-[80px]" : "min-h-[100px]"}`}
            />
            <div className="text-right">
              <button
                type="submit"
                disabled={isSubmitting || !input.trim()}
                className="bg-fbc-text text-fbc-dark px-6 py-2 font-bold uppercase text-sm hover:bg-fbc-red hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "提交中..." : "提交评论"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="font-mono text-fbc-muted mb-4 text-sm">需要登录</p>
            <LoginButton />
          </div>
        )}
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="border-l border-fbc-border pl-4 py-1">
            <div className="flex flex-col mb-1">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-fbc-text text-xs uppercase">{comment.user.name}</span>
                <span className="text-[10px] font-mono text-fbc-border">
                  {(() => {
                    const date = new Date(comment.createdAt);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    const day = date.getDate();
                    return `${year}/${month}/${day}`;
                  })()}
                </span>
              </div>
            </div>
            <p className="text-fbc-muted text-xs leading-relaxed break-words">
              {comment.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

