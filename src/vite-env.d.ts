import "@tanstack/react-router";

// 兼容路由自定义静态数据
declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    title?: string;
  }
}

// 让 TypeScript 认识并允许你把 SVG 图片当作一个原生的 React 组件来引入和使用。
declare module "*.svg?react" {
  import React from "react";
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
