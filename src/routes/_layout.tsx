import { createFileRoute, Outlet } from "@tanstack/react-router";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";

export const Route = createFileRoute("/_layout")({
  component: () => (
    <div className="layout">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
});
