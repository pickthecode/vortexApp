import { createFileRoute } from "@tanstack/react-router";
import NotFound from "../pages/NotFound/NotFound";

export const Route = createFileRoute("/$")({
  component: NotFound
});
