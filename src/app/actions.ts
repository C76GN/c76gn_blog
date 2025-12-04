"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// 增加文章浏览量 (含 IP 防刷逻辑)
export async function incrementView(slug: string) {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    // 检查该 IP 在过去 24 小时内是否已浏览过
    const existingView = await tx.postView.findFirst({
      where: {
        postSlug: slug,
        ip: ip,
        viewedAt: {
          gte: oneDayAgo,
        },
      },
    });

    if (existingView) {
      return;
    }

    // 更新浏览量统计
    await tx.postStat.upsert({
      where: { slug },
      create: { slug, views: 1 },
      update: { views: { increment: 1 } },
    });

    // 记录本次浏览
    await tx.postView.create({
      data: {
        postSlug: slug,
        ip: ip,
      },
    });
  });
}

// 获取文章动态数据
export async function getPostStats(slug: string) {
  const session = await auth();

  const stat = await prisma.postStat.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { likes: true },
      },
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

// 切换点赞状态
export async function toggleLike(slug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("未授权");

  // 确保主表记录存在
  await prisma.postStat.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  const userId = session.user.id;

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_postSlug: {
        userId,
        postSlug: slug,
      },
    },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });
  } else {
    await prisma.like.create({
      data: {
        userId,
        postSlug: slug,
      },
    });
  }

  revalidatePath(`/${slug}`);
}

// 发表评论（支持回复）
export async function postComment(slug: string, content: string, parentId?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("未授权");
  if (!content.trim()) return;

  // 确保主表记录存在
  await prisma.postStat.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  // 如果有 parentId，验证其是否存在
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

// 获取评论列表（包含用户信息）
export async function getComments(slug: string) {
  const comments = await prisma.comment.findMany({
    where: { postSlug: slug },
    include: {
      user: {
        select: { name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return comments;
}

// 获取文章的所有标签
export async function getPostTags(slug: string) {
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

// 标签投票逻辑 (每人每文限投 2 票)
export async function voteTag(slug: string, tagName: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("需登录后操作");

  const userId = session.user.id;
  const cleanTagName = tagName.trim().slice(0, 10);

  if (!cleanTagName) return;

  // 检查用户在这篇文章下已经投了多少票（限制最多 2 个）
  const userVotesCount = await prisma.userTagVote.count({
    where: {
      postTag: { postSlug: slug },
      userId: userId
    }
  });

  if (userVotesCount >= 2) {
    throw new Error("每篇文章最多只能添加或支持 2 个标签");
  }

  // 确保主表记录存在
  await prisma.postStat.upsert({
    where: { slug },
    create: { slug },
    update: {},
  });

  // 查找或创建标签
  const tag = await prisma.tag.upsert({
    where: { name: cleanTagName },
    create: { name: cleanTagName },
    update: {},
  });

  // 查找或创建文章与标签的关联
  const postTag = await prisma.postTag.upsert({
    where: {
      postSlug_tagId: {
        postSlug: slug,
        tagId: tag.id
      }
    },
    create: {
      postSlug: slug,
      tagId: tag.id,
      count: 0
    },
    update: {}
  });

  // 检查是否已经投过票，防止重复请求
  const existingVote = await prisma.userTagVote.findUnique({
    where: {
      userId_postTagId: {
        userId,
        postTagId: postTag.id
      }
    }
  });

  if (existingVote) return;

  // 创建投票并增加计数
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
  revalidatePath(`/`);
}

