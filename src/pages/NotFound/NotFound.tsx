import { Link } from "@tanstack/react-router";

export default function NotFound() {
  return (
    <div>
      <h1>哎呀！漂流到荒岛了</h1>
      <p>你访问的页面并不存在。</p>
      <Link to="/">回到首页</Link>
    </div>
  );
}