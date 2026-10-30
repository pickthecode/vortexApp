import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/me/set")({
  staticData: { title: "用户资料" },
});
