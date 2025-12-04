"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { postComment, getComments } from "@/app/actions";
import { LoginButton, LogoutButton } from "./AuthButton";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AuthStatusLoader from "@/components/ui/AuthStatusLoader";
import GlitchText from "@/components/ui/GlitchText";
import { MessageSquare, CornerDownRight } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  user: { name: string | null; image: string | null };
};

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function CommentSection({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsCommentsLoading(true);
      try {
        const data = await getComments(slug);
        setComments(data as unknown as Comment[]);
      } catch (error) {
        console.error("Failed to fetch comments", error);
      } finally {
        setIsCommentsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!input.trim() || !session?.user) return;

    setIsSubmitting(true);
    try {
      await postComment(slug, input, parentId);

      // 乐观更新 UI
      const newComment = {
        id: Math.random().toString(),
        content: input,
        createdAt: new Date(),
        parentId: parentId || null,
        user: {
          name: session.user.name || "我",
          image: session.user.image || null,
        },
      };

      setComments([...comments, newComment]);
      setInput("");
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 整理评论树（仅做一层嵌套）
  // 找出所有根评论，然后将它们的子评论附带在后面渲染
  const rootComments = comments.filter(c => !c.parentId);

  // 渲染单个评论项的组件
  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const isReplyingToThis = replyTo === comment.id;

    return (
      <motion.div variants={itemVariants} className={`group ${isReply ? "mt-2 ml-4 pl-4 border-l border-fbc-border/50" : "mt-4 pt-4 border-t border-fbc-border first:border-0 first:pt-0"}`}>
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            {comment.user.image ? (
              <Image src={comment.user.image} width={20} height={20} alt="avatar" className="rounded-full opacity-80" />
            ) : (
              <div className="w-5 h-5 bg-fbc-border rounded-full" />
            )}
            <span className="font-bold text-fbc-text text-xs uppercase">{comment.user.name}</span>
            <span className="text-[10px] font-mono text-fbc-muted opacity-50">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* 回复按钮 - 仅在登录且非回复状态显示，或者允许无限层级但UI只有两层 */}
          {session && !isReply && (
            <button
              onClick={() => setReplyTo(isReplyingToThis ? null : comment.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-fbc-muted hover:text-fbc-yellow flex items-center gap-1 text-[10px] uppercase font-mono"
            >
              <MessageSquare className="w-3 h-3" />
              Reply
            </button>
          )}
        </div>

        <p className="text-fbc-muted text-xs leading-relaxed break-words whitespace-pre-wrap">
          {comment.content}
        </p>

        {/* 内嵌回复框 */}
        <AnimatePresence>
          {isReplyingToThis && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pl-4 border-l-2 border-fbc-yellow/50 overflow-hidden"
              onSubmit={(e) => handleSubmit(e, comment.id)}
            >
              <div className="flex items-center gap-2 mb-2 text-[10px] text-fbc-yellow font-mono">
                <CornerDownRight className="w-3 h-3" />
                回复 @{comment.user.name}:
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                placeholder="撰写回复..."
                className="w-full bg-fbc-dark/50 border border-fbc-border p-2 text-fbc-text text-xs focus:border-fbc-yellow min-h-[60px] font-mono mb-2"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="text-[10px] text-fbc-muted hover:text-fbc-text px-3 py-1"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !input.trim()}
                  className="bg-fbc-yellow text-fbc-dark px-3 py-1 text-[10px] font-bold uppercase hover:opacity-90 transition-opacity"
                >
                  发送回复
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className={compact ? "mt-0" : "mt-12"}>
      <h3 className="text-sm font-mono font-bold text-fbc-muted uppercase mb-4 tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-fbc-red animate-pulse"></span>
        <span>评论 (</span>
        <GlitchText
          text={comments.length}
          isLoading={isCommentsLoading}
          minWidth="min-w-[2ch]"
          className="text-fbc-text"
        />
        <span>)</span>
      </h3>

      {/* 主评论输入框 - 只有在没有回复特定人时显示 */}
      {!replyTo && (
        <div className={`mb-8 bg-fbc-gray border border-fbc-border ${compact ? "p-4" : "p-6"}`}>
          <AuthStatusLoader
            isLoggedIn={!!session}
            className="mb-4"
            userContent={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {session?.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="头像"
                      width={24}
                      height={24}
                      className="rounded-full border border-fbc-border"
                    />
                  )}
                  <span className="font-mono text-sm text-fbc-yellow">{session?.user?.name}</span>
                </div>
                <LogoutButton />
              </div>
            }
            guestContent={
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-fbc-muted text-sm">访客模式 [只读]</span>
                <div className="scale-90 origin-right">
                  <LoginButton />
                </div>
              </div>
            }
          />

          <form onSubmit={(e) => handleSubmit(e)}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!session}
              placeholder={session ? "说点什么吧..." : "需登录后评论..."}
              className={`w-full bg-fbc-dark border border-fbc-border p-3 text-fbc-text focus:border-fbc-red font-mono text-xs mb-2 transition-opacity ${compact ? "min-h-[80px]" : "min-h-[100px]"
                } ${!session ? "opacity-50 cursor-not-allowed" : ""}`}
            />
            <div className="text-right">
              {session && (
                <button
                  type="submit"
                  disabled={isSubmitting || !input.trim()}
                  className="bg-fbc-text text-fbc-dark px-6 py-2 font-bold uppercase text-sm hover:bg-fbc-red hover:text-white transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "SENDING..." : "提交评论"}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {isCommentsLoading ? (
        <div className="space-y-6 animate-pulse opacity-50 text-xs font-mono text-fbc-muted">
          读取中...
        </div>
      ) : (
        <motion.div variants={listVariants} initial="hidden" animate="show">
          {rootComments.map((root) => {
            // 查找该根评论的所有子评论
            const children = comments.filter(c => c.parentId === root.id);

            return (
              <div key={root.id}>
                <CommentItem comment={root} />
                {/* 渲染子评论容器 */}
                {children.length > 0 && (
                  <div className="relative">
                    {children.map(child => (
                      <CommentItem key={child.id} comment={child} isReply={true} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {comments.length === 0 && (
            <motion.div variants={itemVariants} className="text-fbc-muted text-xs font-mono italic">
              暂无记录。
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
