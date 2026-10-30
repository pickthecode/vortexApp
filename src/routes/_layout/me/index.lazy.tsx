import { createLazyFileRoute } from "@tanstack/react-router";
import MeIndex from "../../../pages/MeIndex/MeIndex";

export const Route = createLazyFileRoute("/_layout/me/")({
  component: MeIndex
});
