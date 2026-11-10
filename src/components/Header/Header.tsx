import styles from "./Header.module.scss";
import Logo from "./Logo/Logo";
import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import { useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faCircleUser,
  faArrowRightFromBracket,
  faCloudArrowUp,
  faFolder
} from "@fortawesome/free-solid-svg-icons";

import { useUserStore } from "../../store/userStore";
import http from "../../utils/http";

const Header = () => {
  const [seachWord, setSeachword] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = useUserStore((state) => state.userInfo);
  const clearUserInfo = useUserStore((state) => state.clearUserInfo);

  const handleRegisterClick = () => {
    navigate({ to: "/auth" });
  };
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && seachWord.trim()) {
      // 假设你之后会有个搜索结果页
      //navigate(`/search?q=${keyword}`);
    }
  };
  const handleLogout = async () => {
    try {
      await http.post(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error("后端注销异常，执行本地强制清理", error);
    } finally {
      localStorage.removeItem("accessToken");
      clearUserInfo();
      alert("已退出登录");
      navigate({ to: "/" });
    }
  };
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Logo />
        <ul>
          <li>
            <Link to="/" className={location.pathname === "/" ? styles.active : ""}>
              首页
            </Link>
          </li>
          <li>
            <Link to="/sort" className={location.pathname === "/sort" ? styles.active : ""}>
              分类
            </Link>
          </li>
          <li>
            <Link to="/recommend" className={location.pathname === "/recommend" ? styles.active : ""}>
              推荐
            </Link>
          </li>
        </ul>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="搜索"
            value={seachWord}
            onChange={(e) => setSeachword(e.target.value)}
            onKeyDown={handleSearch}
          />
          <button
            className={styles.searchIcon}
            onClick={() => handleSearch({ key: "Enter" } as React.KeyboardEvent<HTMLInputElement>)}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </nav>
      {userInfo ? (
        <div className={styles.userbar}>
          <Link
            to="/me/files"
            className={location.pathname === "/me/files" ? styles.active : styles.iconLink}
            title="我的文件"
          >
            <FontAwesomeIcon icon={faFolder} size="xl" />
          </Link>
          <Link
            to="/me/upload"
            className={location.pathname === "/me/upload" ? styles.active : styles.iconLink}
            title="快速上传"
          >
            <FontAwesomeIcon icon={faCloudArrowUp} size="xl" />
          </Link>
          <Link to="/me" className={location.pathname === "/me" ? styles.active : styles.iconLink} title="个人中心">
            <FontAwesomeIcon size="xl" icon={faCircleUser} />
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout} title="退出登录">
            <FontAwesomeIcon icon={faArrowRightFromBracket} size="xl" />
          </button>
        </div>
      ) : (
        <div className={location.pathname === '/auth' ? styles.loginbarActive : styles.loginbar} onClick={handleRegisterClick}>
          注册 / 登录
        </div>
      )}
    </header>
  );
};

export default Header;
