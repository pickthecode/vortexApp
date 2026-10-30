import { createLazyFileRoute } from "@tanstack/react-router";
import MeLayout from "../../pages/MeLayout/UserLayout";

export const Route = createLazyFileRoute("/_layout/me")({
  component: MeLayout
});