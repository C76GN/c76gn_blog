"use client";

import { useState, useTransition } from "react";
import { voteTag } from "@/app/actions";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";

type Tag = {
  id: string;
  name: string;
  count: number;
  hasVoted: boolean;
};

export default function TagSystem({ slug, initialTags }: { slug: string; initialTags: Tag[] }) {
  const { data: session } = useSession();
  const [tags, setTags] = useState(initialTags);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // 记录上一次状态，用于错误回滚
  const [previousTags, setPreviousTags] = useState(initialTags);

  // 计算当前用户已投票数
  const userVoteCount = tags.filter(t => t.hasVoted).length;
  const remainingVotes = 2 - userVoteCount;

  const handleVote = async (tagName: string) => {
    if (!session) {
      setError("请先登录");
      return;
    }
    if (remainingVotes <= 0 && !tags.find(t => t.name === tagName && t.hasVoted)) {
      setError("每篇文章最多标记 2 个标签");
      return;
    }

    setError("");
    setPreviousTags(tags);

    // 乐观更新
    const existingTagIndex = tags.findIndex(t => t.name === tagName);
    let newTags;
    if (existingTagIndex !== -1) {
      if (tags[existingTagIndex].hasVoted) return;
      newTags = [...tags];
      newTags[existingTagIndex] = { ...newTags[existingTagIndex], count: newTags[existingTagIndex].count + 1, hasVoted: true };
      newTags.sort((a, b) => b.count - a.count);
    } else {
      // 新标签，添加到列表
      const newTag: Tag = {
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
        // 发生错误时回滚状态
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

      <div className="mb-8 bg-fbc-gray border border-fbc-border p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleVote(tag.name)}
              disabled={tag.hasVoted || remainingVotes <= 0}
              className={`group relative flex items-center gap-2 px-3 py-1 text-sm font-mono border transition-all
                ${tag.hasVoted
                  ? "border-fbc-yellow text-fbc-yellow bg-fbc-yellow/10"
                  : "border-fbc-border text-fbc-muted hover:border-fbc-text hover:text-fbc-text"
                }
              `}
            >
              <span>#{tag.name}</span>
              <span className={`text-xs ${tag.hasVoted ? "text-fbc-yellow" : "text-fbc-border group-hover:text-fbc-text"}`}>
                {tag.count}
              </span>
              {/* 角标效果 */}
              {tag.hasVoted && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-fbc-yellow rounded-full"></span>
              )}
            </button>
          ))}
        </div>

        {session && remainingVotes > 0 && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="新建标签..."
                maxLength={10}
                className="bg-fbc-dark border border-fbc-border px-3 py-1 text-xs text-fbc-text focus:border-fbc-red focus:outline-none w-full font-mono"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVote(input);
                  }
                }}
              />
              <button
                onClick={() => handleVote(input)}
                disabled={!input.trim() || isPending}
                className="bg-fbc-text text-fbc-dark px-2 py-1 text-sm hover:bg-fbc-yellow transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-fbc-red text-xs mt-2 font-mono">{error}</p>}
            <div className="mt-2 text-xs text-fbc-border font-mono">
              剩余投票: {session ? remainingVotes : 0} / 2
            </div>
          </>
        )}
      </div>

      {!session && error && <p className="text-fbc-red text-xs mt-2 font-mono">{error}</p>}
    </div>
  );
}

