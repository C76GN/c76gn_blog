"use client";

import { useState, useTransition, useEffect } from "react";
import { voteTag, type TagData } from "@/app/actions";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import AuthStatusLoader from "@/components/ui/AuthStatusLoader";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const tagVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 },
  },
};

export default function TagSystem({ slug, initialTags }: { slug: string; initialTags: TagData[] }) {
  const { data: session } = useSession();
  const [tags, setTags] = useState(initialTags);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const userVoteCount = tags.filter((t) => t.hasVoted).length;
  const remainingVotes = 2 - userVoteCount;

  const handleVote = async (tagName: string) => {
    if (!session) {
      setError("请先登录");
      return;
    }
    if (remainingVotes <= 0 && !tags.find((t) => t.name === tagName && t.hasVoted)) {
      setError("每篇文章最多标记 2 个标签");
      return;
    }

    setError("");

    const previousTags = tags;
    const existingTagIndex = tags.findIndex((t) => t.name === tagName);
    let newTags;
    if (existingTagIndex !== -1) {
      if (tags[existingTagIndex].hasVoted) return;
      newTags = [...tags];
      newTags[existingTagIndex] = {
        ...newTags[existingTagIndex],
        count: newTags[existingTagIndex].count + 1,
        hasVoted: true,
      };
      newTags.sort((a, b) => b.count - a.count);
    } else {
      const newTag: TagData = {
        id: Math.random().toString(),
        name: tagName,
        count: 1,
        hasVoted: true,
      };
      newTags = [...tags, newTag].sort((a, b) => b.count - a.count);
    }
    setTags(newTags);

    startTransition(async () => {
      try {
        await voteTag(slug, tagName);
        setInput("");
      } catch (e: any) {
        setTags(previousTags);
        setError(e.message || "操作失败，请重试");
        setTimeout(() => setError(""), 3000);
      }
    });
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-mono font-bold text-fbc-muted uppercase mb-4 tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 bg-fbc-red animate-pulse"></span>
        标签
      </h3>

      <motion.div
        layout
        className="mb-8 bg-fbc-gray border border-fbc-border p-6 overflow-hidden"
        style={{ minHeight: "120px" }}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={containerVariants} className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <motion.button
              layout
              variants={tagVariants}
              key={tag.id}
              onClick={() => handleVote(tag.name)}
              disabled={tag.hasVoted || remainingVotes <= 0}
              className={`group relative flex items-center gap-2 px-3 py-1 text-sm font-mono border transition-colors
                ${tag.hasVoted
                  ? "border-fbc-yellow text-fbc-yellow bg-fbc-yellow/10"
                  : "border-fbc-border text-fbc-muted hover:border-fbc-text hover:text-fbc-text"
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>#{tag.name}</span>
              <span
                className={`text-xs ${tag.hasVoted ? "text-fbc-yellow" : "text-fbc-border group-hover:text-fbc-text"}`}
              >
                {tag.count}
              </span>
              {tag.hasVoted && <span className="absolute -top-1 -right-1 w-2 h-2 bg-fbc-yellow rounded-full"></span>}
            </motion.button>
          ))}
        </motion.div>

        <AuthStatusLoader
          isLoggedIn={!!session}
          className="h-[32px]"
          userContent={
            remainingVotes > 0 ? (
              <div className="flex gap-2 items-center w-full">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="新建标签..."
                  maxLength={10}
                  className="bg-fbc-dark border border-fbc-border px-3 py-1 text-xs text-fbc-text focus:border-fbc-red focus:outline-none flex-1 font-mono h-[32px]"
                  onKeyDown={(e) => e.key === "Enter" && handleVote(input)}
                />
                <button
                  onClick={() => handleVote(input)}
                  disabled={!input.trim() || isPending}
                  className="bg-fbc-text text-fbc-dark px-3 py-1 text-sm hover:bg-fbc-yellow transition-colors h-[32px] flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-fbc-border font-mono h-[32px] flex items-center">
                您的选票已用完
              </div>
            )
          }
          guestContent={
            <div className="text-xs text-fbc-muted font-mono h-[32px] flex items-center">
              需登录后可添加标签
            </div>
          }
        />

        {error && <p className="text-fbc-red text-xs mt-2 font-mono">{error}</p>}
        {session && (
          <div className="mt-2 text-xs text-fbc-border font-mono">剩余投票: {remainingVotes} / 2</div>
        )}
      </motion.div>
    </div>
  );
}

