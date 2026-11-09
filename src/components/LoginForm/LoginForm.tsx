import styles from "./LoginForm.module.scss";
import http from "../../utils/http";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "../../store/userStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface Props {
  onSwitchMode: () => void;
}

const loginSchema = z.object({
  account: z.string().min(1),
  password: z.string().min(9)
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm({ onSwitchMode }: Props) {
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    // 默认就是 onSubmit 校验，这里不用显式声明 mode
    reValidateMode: "onSubmit"
  });

  const onSubmit = async (data: LoginValues) => {
    try {
      const res = await http.post(`${import.meta.env.VITE_API_BASE_URL}/auth`, data, {
        withCredentials: true,
        // 发这个 Ajax 请求的时候，把相关的 Cookie 一起打包带给服务器
        _skipRefresh: true
      });

      const { accessToken, user } = res.data;
      localStorage.setItem("accessToken", accessToken);
      setUserInfo(user);
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      // 处理后端返回的错误
      setError("root.serverError", {
        type: "manual",
        message: err.response?.data?.message || "用户名或密码错误"
      });
    }
  };

  const hasFormatError = !!errors.account || !!errors.password;

  return (
    <>
      {/*  巧妙利用事件冒泡：只要表单内任意输入框发生改变，立刻清空所有错误状态 */}
      <form onSubmit={handleSubmit(onSubmit)} className={styles.loginForm} onChange={() => clearErrors()}>
        <h1 className={styles.title}>欢迎回来</h1>

        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>账号:</span>
            <input type="text" {...register("account")} />
          </label>
        </div>

        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>密码:</span>
            <input type="password" {...register("password")} />
          </label>
        </div>

        {/* 统一错误展示区：优先展示前端格式错误，其次展示后端接口错误 */}
        {(hasFormatError || errors.root?.serverError) && (
          <div className={styles.errorTip}>
            {hasFormatError ? "用户名或密码格式错误" : errors.root?.serverError?.message}
          </div>
        )}

        <div className={styles.buttonWrapper}>
          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? "登 录 中..." : "登 录"}
          </button>
        </div>
      </form>
      <span className={styles.toLogin} onClick={onSwitchMode}>
        转到注册
      </span>
    </>
  );
}
