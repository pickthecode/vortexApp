import React, { useState, useEffect, type ChangeEvent } from "react";
import { z } from "zod";
import http from "../../utils/http";
import useDebounce from "../../customHook/useDebounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "@tanstack/react-router";
import { useUserStore } from "../../store/userStore";
import axios from "axios";

import styles from "./RegisterForm.module.scss";

// 接收父组件的切换方法
interface Props {
  onSwitchMode: () => void;
}

// 定义zod基础的字段格式校验（用来做格式拦截）
const baseSchema = z.object({
  account: z
    .string()
    .min(6, "账号至少6位数")
    .max(12, "账号最多12位数")
    .regex(/^[a-zA-Z0-9_]+$/, "账号格式错误"),
  password: z.string().min(9, "密码至少9位"),
  confirmPassword: z.string(),
  email: z.email("邮箱地址无效"),
  captcha: z.string().min(6, { message: "验证码格式有误" })
});

// 拓展出完整的注册校验（包含两次密码对比，用于提交拦截）
const registerSchema = baseSchema.refine((data) => data.password === data.confirmPassword, {
  message: "两次输入不一致",
  path: ["confirmPassword"]
});

// 自动推导出表单数据的类型
// type FormData = {
//   account: string;
//   password: string;
//   confirmPassword: string;
//   email: string;
//   captcha: string;
// };
type FormData = z.infer<typeof baseSchema>;

// 映射FormData 的所有键，并生成一个结构一模一样的新对象类型
// ?为可选属性,既可以有也可以是undefined
// type FormErrors = {
//   account?: string | React.ReactNode;
//   password?: string | React.ReactNode;
//   confirmPassword?: string | React.ReactNode;
//   email?: string | React.ReactNode;
//   captcha?: string | React.ReactNode;
// };
type FormErrors = {
  [K in keyof FormData]?: string | React.ReactNode;
};

export default function RegisterForm({ onSwitchMode }: Props) {
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  const navigate = useNavigate();
  // 设置了一个不随着页面刷新而重新渲染(不等于f5刷新)的值
  const lastPassedAccount = React.useRef<string>("");
  const [countdown, setCountdown] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    account: "",
    password: "",
    confirmPassword: "",
    email: "",
    captcha: ""
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const isFormValid = registerSchema.safeParse(formData).success;
  // 遍历errors的键值对,第一个符合条件的值就返回true,拓展every()所有键值对的值都符合条件才返回true
  const hasRealError = Object.values(errors).some((err) => typeof err === "string");
  const canSubmit = isFormValid && !hasRealError;
  // 验证码倒计时定时器
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    // 组件销毁或值改变时自动清理，不会内存泄漏
    return () => clearTimeout(timer);
  }, [countdown]);
  // 对整个表单状态进行统一防抖
  const debouncedFormData = useDebounce(formData, 450);
  // 设置动态错误
  useEffect(() => {
    const controller = new AbortController();

    const checkFormAndAsyncRules = async () => {
      const localErrors: FormErrors = {};

      //  严格基于防抖后的数据（debouncedFormData）进行 Zod 本地格式检查
      const result = registerSchema.safeParse(debouncedFormData);
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          if (issue.path && issue.path[0]) {
            const fieldName = issue.path[0] as keyof FormData;
            if (touchedFields[fieldName] && debouncedFormData[fieldName] !== "") {
              localErrors[fieldName] = issue.message;
            }
          }
        });
      }

      // 检查是否已经成功验证过
      // 此时条件并不成立 当debouncedFormData.account === 不受重新渲染影响的lastPassedAccount.current才成立
      const isAsyncPassed = debouncedFormData.account !== "" && debouncedFormData.account === lastPassedAccount.current;

      //  同步更新本地格式错误。如果账号已经成功过，保留它的绿勾
      setErrors((prev) => {
        // 逻辑复杂的时候 需要一个临时变量 整理好后再更新
        const updated = { ...localErrors };

        // 只有当账号通过了验证，且用户“目前没有在键盘上输入新内容”时，才保留绿勾
        const isUserStopTyping = debouncedFormData.account === formData.account;
        // 当账号已验证通过时（跳过网络请求），即使其他字段变化触发组件更新，
        // 每次赋的值也完全相同。依靠 React 的 diff 机制，它不会触发真实 DOM 的擦除和重绘，从而稳住绿勾。
        if (isAsyncPassed && isUserStopTyping) {
          updated.account = <FontAwesomeIcon icon={faCircleCheck} size="lg" style={{ color: "rgb(161, 196, 54)" }} />;
        } else if (!isUserStopTyping && prev.account && typeof prev.account !== "string") {
          // 如果用户正在打字，且之前是绿勾或 loading，先把它隐去，防止残影
          updated.account = undefined;
        }
        return updated;
      });

      // 只有当防抖后的账号和当前输入框的真实账号一致，才说明用户停下敲击了
      const isUserStopTyping = debouncedFormData.account === formData.account;

      // 去后端查 account 是否重复
      if (
        !localErrors.account &&
        touchedFields.account &&
        debouncedFormData.account !== "" &&
        !isAsyncPassed &&
        isUserStopTyping // 只有停下打字后，才允许向后端发请求或闪烁 loading
      ) {
        try {
          // 显示 loading 动画
          setErrors((prev) => ({
            ...prev,
            account: <FontAwesomeIcon icon={faSpinner} spin style={{ color: "#ffffff" }} />
          }));

          // 制造 250ms 的视觉缓冲（避免 localhost 秒回导致看不到动画）
          await new Promise((resolve) => setTimeout(resolve, 250));

          // 发送 Axios 请求
          const response = await http.post(
            `${import.meta.env.VITE_API_BASE_URL}/users/check`,
            { account: debouncedFormData.account },
            { signal: controller.signal, _skipRefresh: true }
          );
          if (response.data?.exists) {
            lastPassedAccount.current = "";
            setErrors((prev) => ({ ...prev, account: "用户名已存在" }));
          } else {
            // 正确格式的account以不受重新渲染影响的ref保存下来
            lastPassedAccount.current = debouncedFormData.account;
            setErrors((prev) => ({
              ...prev,
              account: <FontAwesomeIcon icon={faCircleCheck} size="lg" style={{ color: "rgb(161, 196, 54)" }} />
            }));
          }
        } catch (error: any) {
          // 配合上面的controller.abort()主动掐断2个请求中最先的请求 防止请求
          if (axios.isCancel(error)) return;
          lastPassedAccount.current = "";
          setErrors((prev) => ({
            ...prev,
            account: error.response?.data?.message || "请稍后再试"
          }));
        }
      }
    };

    checkFormAndAsyncRules();
    return () => controller.abort();

    // 必须把 formData.account 加上，以便实时对比用户是否正在输入
  }, [debouncedFormData, touchedFields, formData.account]);
  // 处理用户输入
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouchedFields((prev) => ({ ...prev, [name]: true }));

    //  只有当用户彻底清空输入框时，才同步抹除报错，不需要卡防抖
    if (value === "") {
      if (name === "account") {
        lastPassedAccount.current = "";
      }
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      setTouchedFields((prev) => ({ ...prev, [name]: false }));
    }
  };
  // 发送验证码
  const handleSendCaptcha = async () => {
    // shape 单独拆分一个字段校验
    const emailResult = baseSchema.shape.email.safeParse(formData.email);
    if (!emailResult.success) {
      setErrors((prev) => ({ ...prev, email: emailResult.error.issues[0]?.message }));
      return;
    }
    try {
      await http.post(
        `${import.meta.env.VITE_API_BASE_URL}/captcha/email`,
        { email: formData.email },
        { _skipRefresh: true }
      );
      alert("验证码已发送,请查收");
      setCountdown(60);
    } catch (error: any) {
      alert(error.response?.data?.message || "网络错误,请稍后再试");
    }
  };
  // 提交表单
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const { account, password, email, captcha } = formData;
      const res = await http.post(
        `${import.meta.env.VITE_API_BASE_URL}/users`,
        {
          account,
          password,
          email,
          captcha
        },
        // 必须允许携带凭证，否则后端的 httpOnly Cookie（refreshToken）根本写不进浏览器
        { withCredentials: true, _skipRefresh: true }
      );
      const { accessToken, user } = res.data;
      localStorage.setItem("accessToken", accessToken);
      setUserInfo(user);
      alert("注册成功");
      navigate({ to: "/", replace: true });
    } catch (error: any) {
      alert(error.response?.data?.message || "网络错误,请稍后再试");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <h1 className={styles.title}>创建您的账户</h1>
        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>账号:</span>
            <input type="text" name="account" value={formData.account} onChange={handleChange} />
          </label>
          <div className={styles.errorZone}>
            {errors.account && (
              <span className={typeof errors.account === "string" ? styles.errorTip : ""}>{errors.account}</span>
            )}
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>密码:</span>
            <input type="password" name="password" value={formData.password} onChange={handleChange} />
          </label>
          <div className={styles.errorZone}>
            {errors.password && <span className={styles.errorTip}>{errors.password}</span>}
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>确认密码:</span>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
          </label>
          <div className={styles.errorZone}>
            {errors.confirmPassword && <span className={styles.errorTip}>{errors.confirmPassword}</span>}
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>邮箱:</span>
            <input type="text" name="email" value={formData.email} onChange={handleChange} />
          </label>
          <div className={styles.errorZone}>
            {errors.email && <span className={styles.errorTip}>{errors.email}</span>}
          </div>
        </div>
        <div className={styles.formRow}>
          <label className={styles.formItem}>
            <span className={styles.labelSpan}>邮箱验证码:</span>
            <div className={styles.captchaWrapper}>
              <input type="text" name="captcha" value={formData.captcha} onChange={handleChange} />
              <button
                type="button"
                className={countdown > 0 ? styles.sendBtnD : styles.sendBtn}
                onClick={handleSendCaptcha}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s后重发` : "发送验证码"}
              </button>
            </div>
          </label>
          <div className={styles.errorZone}>
            {errors.captcha && <span className={styles.errorTip}>{errors.captcha}</span>}
          </div>
        </div>
        <div className={styles.buttonWrapper}>
          <button type="submit" className={styles.submitBtn} disabled={!canSubmit}>
            立即注册
          </button>
        </div>
      </form>
      <span className={styles.toLogin} onClick={onSwitchMode}>
        转到登录
      </span>
    </>
  );
}
