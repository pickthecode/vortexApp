import { Outlet, Link, useMatches } from "@tanstack/react-router";
import styles from "./MeLayout.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse } from "@fortawesome/free-solid-svg-icons";

export default function MeLayout() {
  //  获取当前匹配到的所有路由节点
  const matches = useMatches();

  //  过滤并提取出需要的面包屑数据,当然返回的是数组
  const breadcrumbs = matches
    // 只保留配置了 staticData.title 的路由节点
    .filter((match) => match.staticData?.title)
    .map((match) => ({
      title: match.staticData.title as string,
      path: match.pathname
    }));

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.breadcrumbs}>
          <FontAwesomeIcon icon={faHouse} size="lg" className={styles.home} />
          <Link to="/me" style={{ textDecoration: "none", color: "inherit" }}>
            用户主页
          </Link>
          {/* 3. 动态渲染提取出的节点 */}
          {breadcrumbs.map((crumb, index) => {
            // 判断是否是最后一级下标
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span key={crumb.path}>
                <span style={{ margin: "0 8px" }}>/</span>
                {isLast ? (
                  // 最后一级只显示文字，不可点击
                  <span>{crumb.title}</span>
                ) : (
                  // 前面的层级可以点击跳转
                  <Link to={crumb.path}>{crumb.title}</Link>
                )}
              </span>
            );
          })}
        </div>
        <div className={styles.main}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
