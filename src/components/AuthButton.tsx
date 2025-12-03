"use client";

import { signIn, signOut } from "next-auth/react";

export function LoginButton() {
  return (
    <button
      onClick={() => signIn("github")}
      className="px-4 py-2 bg-fbc-gray border border-fbc-border text-fbc-text font-mono text-xs hover:border-fbc-yellow hover:text-fbc-yellow transition-colors uppercase tracking-wider"
    >
      [ 使用 GitHub 登录 ]
    </button>
  );
}

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="text-xs font-mono text-fbc-red hover:underline uppercase"
    >
      登出
    </button>
  );
}

