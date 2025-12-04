"use client";

import { useContext, useRef } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * 路由冻结器组件
 * 解决 Next.js App Router 在页面切换动画时，旧页面内容瞬间变成新页面的问题
 * 原理：拦截 LayoutRouterContext，在页面退出时强制保留上一个路由的 Context 值
 */
export default function FrozenRoute({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;

  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

