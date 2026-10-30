import { createLazyFileRoute } from "@tanstack/react-router";
import Recommend from "../../pages/Recommend/Recommend";

export const Route = createLazyFileRoute("/_layout/recommend")({
  component: Recommend
});
