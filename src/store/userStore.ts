import { create } from "zustand";
import { persist } from "zustand/middleware";

// 定义数据类型
interface UserInfo {
  uuid: string;
  account: string;
  username: string;
  email: string;
  roles: string[];
  // 本地偏好设置
  gender?: "male" | "female" | "secret";
  interests: string[];
}

interface UserStore {
  userInfo: UserInfo | null;
  setUserInfo: (user: Partial<UserInfo>) => void;
  clearUserInfo: () => void;
  updateLocalPreferences: (prefs: { gender?: "male" | "female" | "secret"; interests?: string[] }) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      userInfo: null,
      // 登录/修改资料时调用
      setUserInfo: (user) =>
        set((state) => ({
          userInfo: {
            ...state.userInfo!,
            ...user
          }
        })),
      // 更新本地偏好调用
      updateLocalPreferences: (prefs) =>
        set((state) => ({
          userInfo: {
            // !断言一定有值
            ...state.userInfo!,
            ...prefs
          }
        })),
      // 退出登录时调用
      clearUserInfo: () => set({ userInfo: null })
    }),
    {
      name: "user-storage" // 这个名字就是存在 localStorage 里的 key
    }
  )
);
