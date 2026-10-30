import axios from "axios";
import { router } from "../router";
import { useUserStore } from "../store/userStore";

// 创造一个类型继承继承axios的请求配置
// 给typescript参照,说明我要夹带私货😂
// 一次请求中_retry只能重试一次 _retry=true便切断链接
// 第一次失败 (401) 还没重试过，我来帮它换票 第二次失败 (401)：假设新票还是不管用，请求再次被退回 把用户踢回首页
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _skipRefresh?: boolean;
  }
}

// 创建全站通用的 Axios 实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // 请求超时时间
  // Axios 会抛出一个特定的错误（通常错误码是 ECONNABORTED，错误信息类似 timeout of 10000ms exceeded
  // 进入拦截器：代码会立刻进入你下面写的响应拦截器的 error 分支中。
  timeout: 10000,
  // 开通跨域 否则httpOnly Cookie（refreshToken）永远传不过去
  withCredentials: true
});

// 状态控制锁：防止多个并发请求同时过期时，疯狂重复调用后端的 /refresh 接口
let isRefreshing = false;
// 定义了一个专门用来存放 Promise resolve 和 reject 函数的队列数组 数组里的每一个元素，都是一个对象
let requestsQueue: Array<{ resolve: (value: string) => void; reject: (reason?: any) => void }> = [];

// 请求拦截器 每次请求都带accessToken
http.interceptors.request.use(
  // config 就是你发起请求时所有设置的集合体
  // 拦截它的目的，是为了让我们可以在每次请求发出去之前，自动往里面添加accessToken
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  // error会在组件调用方法的try{const res = await http.get("/api/user/info")}catch(error){"捕获"}
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
http.interceptors.response.use(
  // 响应时所有设置的集合
  (response) => {
    return response;
  },
  async (error) => {
    const { config, response } = error;
    // const customConfig = config as CustomAxiosRequestConfig;
    // 当后端返回了 接口401（说明短票到期了或者登录信息错误），且当前请求没有经历过重试（防止死循环）
    if (response && response.status === 401 && !config._retry) {
      // 只要请求带了免死金牌，直接抛出，绝不续期！
      if (config._skipRefresh) {
        return Promise.reject(error);
      }
      // 如果是换票接口本身 (/refresh) 报 401，说明长票彻底死透！
      if (config.url && config.url.includes("/auth/refresh")) {
        // 清空本地票据
        localStorage.removeItem("accessToken");
        useUserStore.getState().clearUserInfo();
        // 强制踢回登录页（或首页），并抛出错误终止流程
        router.navigate({ to: "/auth" });
        return Promise.reject(error);
      }
      // 如果当前已经有一个请求去后台调 /refresh了剩下的所有请求全部原地立正，塞进队列里，不要重复去轰炸后端的限流器
      if (isRefreshing) {
        // 如果第一个请求在换票isRefreshing=true(下面的代码会改),那么剩下的请求会暂时塞到队列里
        return (
          new Promise((resolve, reject) => {
            requestsQueue.push({ resolve, reject });
          })
            // 新建一个Promise默认状态是pending,resolve函数不执行不会执行then(),然而我们把resolve偷偷放进requestQueue里面了
            // 当requestsQueue.forEach(({ resolve }) => resolve(accessToken));执行后我们才一个个的执行then()
            .then((newToken) => {
              if (config.headers) {
                config.headers.Authorization = `Bearer ${newToken}`;
              }
              // 拿着刚刚换上新 Token 的配置单，再给我重新发一次一模一样的请求
              return http(config);
            })
            .catch((error) => {
              return Promise.reject(error);
            })
        );
      }
      // 没在换票？说明我是第一个发现过期的“吹哨人”，立刻上锁并向后端发起换票
      config._retry = true;
      isRefreshing = true;
      try {
        // 调用你刚刚在后端写好的 handleRefresh 换票接口
        // 后端会通过 Cookie 自动读取旧的长票，并进行 Redis 白名单与 10秒断后缓冲区 的核对
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true
          }
        );
        const { accessToken } = res.data;
        // 换票成功！把后端吐出来的全新短票存入本地
        localStorage.setItem("accessToken", accessToken);
        // 刷新成功：执行resolve函数 通知队列里的兄弟们带上新票重新一次性发起请求
        requestsQueue.forEach(({ resolve }) => resolve(accessToken));
        // 清空队列
        requestsQueue = [];
        // 把自己（第一个发现过期的请求）也带上新票重新发射，完成无缝承接
        if (config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return http(config);
      } catch (refreshError) {
        // 如果连 /refresh 换票都彻底失败了（例如超过7天没用、或者被管理员通过 Redis 白名单强踢了）
        // 刷新失败：通知队列里的兄弟们就地解散，抛出错误防止永久 pending
        requestsQueue.forEach(({ reject }) => reject(refreshError));
        requestsQueue = [];
        localStorage.removeItem("accessToken");
        // router.navigate()调用需要填写类型
        useUserStore.getState().clearUserInfo();
        router.navigate({ to: "/auth" });
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
export default http;
