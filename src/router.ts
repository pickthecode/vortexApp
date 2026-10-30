import React from "react";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: React.lazy(() => import("./pages/NotFound/NotFound"))
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
