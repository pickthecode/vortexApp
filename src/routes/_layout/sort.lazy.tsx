import { createLazyFileRoute } from "@tanstack/react-router";
import Sort from "../../pages/Sort/Sort";

export const Route = createLazyFileRoute("/_layout/sort")({
  component: Sort
});
