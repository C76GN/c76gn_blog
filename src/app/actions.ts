"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function incrementView(slug: string) {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  try {
    const existingView = await prisma.postView.findFirst({
      where: {
        postSlug: slug,
        ip: ip,
        viewedAt: { gte: oneDayAgo },
      },
      select: { id: true },
    });

    if (existingView) return;

    await prisma.$transaction([
      prisma.postStat.upsert({
        where: { slug },
        create: { slug, views: 1 },
        update: { views: { increment: 1 } },
      }),
      prisma.postView.create({
        data: { postSlug: slug, ip: ip },
      }),
    ]);
  } catch (error) {
    console.error("View increment failed:", error);
  }
}

export type PostStatsData = {
  views: number;
  likes: number;
  hasLiked: boolean;
};

export async function getPostStats(slug: string): Promise<PostStatsData> {
  const session = await auth();

  const stat = await prisma.postStat.findUnique({
    where: { slug },
    include: {
      _count: { select: { likes: true } },
    },
  });

  let hasLiked = false;
  if (session?.user?.id) {
    const like = await prisma.like.findUnique({
      where: {
        userId_postSlug: {
          userId: session.user.id,
          postSlug: slug,
        },
      },
    });
    hasLiked = !!like;
  }

  return {
    views: stat?.views ?? 0,
    likes: stat?._count.likes ?? 0,
    hasLiked,
  };
}

export async function toggleLike(slug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("未授权");

  const userId = session.user.id;

  await prisma.postStat.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postSlug: { userId, postSlug: slug },
    },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
  } else {
    await prisma.like.create({
      data: { userId, postSlug: slug },
    });
  }

  revalidatePath(`/${slug}`);
}

export async function postComment(slug: string, content: string, parentId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("未授权");
  if (!content.trim()) return;

  await prisma.postStat.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } });
    if (!parent) throw new Error("回复的评论不存在");
  }

  await prisma.comment.create({
    data: {
      content,
      userId: session.user.id,
      postSlug: slug,
      parentId: parentId || null,
    },
  });

  revalidatePath(`/${slug}`);
}

export type CommentData = {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  user: { name: string | null; image: string | null };
};

export async function getComments(slug: string): Promise<CommentData[]> {
  const comments = await prisma.comment.findMany({
    where: { postSlug: slug },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return comments.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));
}

export type TagData = {
  id: string;
  name: string;
  count: number;
  hasVoted: boolean;
};

export async function getPostTags(slug: string): Promise<TagData[]> {
  const session = await auth();
  const userId = session?.user?.id;

  const tags = await prisma.postTag.findMany({
    where: { postSlug: slug },
    include: {
      tag: true,
      votes: userId ? { where: { userId } } : false,
    },
    orderBy: { count: 'desc' },
  });

  return tags.map(pt => ({
    id: pt.id,
    name: pt.tag.name,
    count: pt.count,
    hasVoted: pt.votes?.length > 0 || false,
  }));
}

export async function voteTag(slug: string, tagName: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("需登录后操作");

  const userId = session.user.id;
  const cleanTagName = tagName.trim().slice(0, 10);

  if (!cleanTagName) return;

  const userVotesCount = await prisma.userTagVote.count({
    where: {
      postTag: { postSlug: slug },
      userId: userId
    }
  });

  if (userVotesCount >= 2) {
    throw new Error("每篇文章最多只能添加或支持 2 个标签");
  }

  await prisma.postStat.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  const tag = await prisma.tag.upsert({
    where: { name: cleanTagName },
    create: { name: cleanTagName },
    update: {},
  });

  const postTag = await prisma.postTag.upsert({
    where: {
      postSlug_tagId: { postSlug: slug, tagId: tag.id }
    },
    create: { postSlug: slug, tagId: tag.id, count: 0 },
    update: {}
  });

  const existingVote = await prisma.userTagVote.findUnique({
    where: {
      userId_postTagId: { userId, postTagId: postTag.id }
    }
  });

  if (existingVote) return;

  await prisma.$transaction([
    prisma.userTagVote.create({
      data: { userId, postTagId: postTag.id }
    }),
    prisma.postTag.update({
      where: { id: postTag.id },
      data: { count: { increment: 1 } }
    })
  ]);

  revalidatePath(`/${slug}`);
}

