import { createFileRoute, redirect } from "@tanstack/react-router";
import { useUserStore } from "../../store/userStore";
// 路由守卫与路由懒加载需要分开写
export const Route = createFileRoute("/_layout/me")({
  beforeLoad: ({ location }) => {
    const userInfo = useUserStore.getState().userInfo;
    if (!userInfo) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.pathname }
      });
    }
  }
});