// src/auth.ts
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  trustHost: true, // 信任主机配置
  session: {
    strategy: "database", // 使用数据库存储会话
  },
  callbacks: {
    async session({ session, user }) {
      // 注入用户 ID 到 session 对象
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
})

