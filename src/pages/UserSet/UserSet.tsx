import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUserStore } from "../../store/userStore";
import http from "../../utils/http";

import styles from "./UserSet.module.scss";

const userSetSchema = z.object({
  username: z
    .string()
    .min(1, "用户名不能为空")
    .max(12, "用户名最多12个字符")
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "只能包含中英文、数字或下划线"),
  gender: z.enum(["male", "female", "secret"]),
  interests: z.array(z.string()).optional()
});
// 自动推导form value的类型
type UserSetFormValues = z.infer<typeof userSetSchema>;

const ALL_INTERESTS_OPTIONS = ["ai", "design", "db", "os"];

type Role = "admin" | "premium" | "user";

// 保留中文标签映射
const ROLE_CONFIG: Record<Role, string> = {
  admin: "管理员",
  premium: "会员",
  user: "用户"
};

export default function UserSet() {
  const userInfo = useUserStore((state) => state.userInfo);
  const updateLocalPreferences = useUserStore((state) => state.updateLocalPreferences);
  const {
    register, // 替代了原生的 value 和 onChange
    handleSubmit, // 替代了原生的 e.preventDefault()
    watch, // 用来监听当前表单的值
    setValue, // 用来手动修改表单的值
    reset,
    //getValues,
    formState: { errors, isDirty, isValid } // 自动提取错误信息和表单状态
  } = useForm<UserSetFormValues>({
    resolver: zodResolver(userSetSchema),
    mode: "onChange", // 只有当输入框失去焦点时才报错，不打扰用户打字
    defaultValues: {
      username: userInfo?.username || "",
      gender: userInfo?.gender || "secret",
      interests: userInfo?.interests || [] // 多选框自动转成数组
    }
  });

  useEffect(() => {
    reset({
      username: userInfo?.username || "",
      gender: userInfo?.gender || "secret",
      interests: userInfo?.interests || []
    });
  }, [userInfo, reset]);

  const onSubmit = async (data: UserSetFormValues) => {
    try {
      await http.patch(
        `${import.meta.env.VITE_API_BASE_URL}/me`,
        { username: data.username },
        { withCredentials: true }
      );
      updateLocalPreferences({
        ...data,
        gender: data.gender,
        interests: data.interests
      });
      alert("保存成功！");
    } catch (err: any) {
      alert(err.response?.data?.message || "请稍后再试");
    }
  };

  // 实时获取当前已选中的兴趣（如果没有选中任何东西，默认给个空数组）
  const currentInterests = watch("interests") || [];

  // 算一下是不是已经全选了（当前选中的数量 == 总选项的数量）
  const isAllSelected = currentInterests.length === ALL_INTERESTS_OPTIONS.length;

  // 点击全选框时触发的方法
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setValue("interests", ALL_INTERESTS_OPTIONS, { shouldDirty: true, shouldValidate: true });
    } else {
      setValue("interests", [], { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className={styles.formRow}>
            <span className={styles.label}>账&nbsp;&nbsp;&nbsp;&nbsp;号:</span>
            <span>{userInfo?.account}</span>
          </label>
          <div className={styles.formRow}>
            <span className={styles.label}>用户名:</span>
            <div className={styles.inputWrapper}>
              <input type="text" {...register("username")} autoCapitalize="" />
              {errors.username && <span className={styles.errorTip}>{errors.username.message}</span>}
            </div>
          </div>
          <label className={styles.formRow}>
            <span className={styles.label}>用户组:</span>
            {userInfo?.roles?.map((roleKey) => (
              <span key={roleKey}>{ROLE_CONFIG[roleKey as Role] || roleKey}</span>
            ))}
          </label>
          <label className={styles.formRow}>
            <span className={styles.label}>邮&nbsp;&nbsp;&nbsp;&nbsp;箱:</span>
            <span>{userInfo?.email}</span>
          </label>
          <div className={styles.formRow}>
            <span className={styles.label}>性&nbsp;&nbsp;&nbsp;&nbsp;别:</span>
            <div className={styles.radioGroup}>
              <label>
                <input type="radio" value="male" {...register("gender")} />
                <span>男</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="female" {...register("gender")} />
                <span>女</span>
              </label>
              <label className={styles.radioLabel}>
                <input type="radio" value="secret" {...register("gender")} />
                <span>保密</span>
              </label>
            </div>
          </div>
          <div className={styles.formRow}>
            <span className={styles.label}>兴&nbsp;&nbsp;&nbsp;&nbsp;趣:</span>
            <div className={styles.checkboxGroup}>
              <label>
                <input type="checkbox" value="ai" {...register("interests")} />
                <span>人工智能</span>
              </label>
              <label>
                <input type="checkbox" value="design" {...register("interests")} />
                <span>界面设计</span>
              </label>
              <label>
                <input type="checkbox" value="db" {...register("interests")} />
                <span>数据库</span>
              </label>
              <label>
                <input type="checkbox" value="os" {...register("interests")} />
                <span>操作系统</span>
              </label>
              <label>
                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAllChange} />
                <span>全选</span>
              </label>
            </div>
          </div>
          <div className={styles.buttonWrapper}>
            <button type="submit" disabled={!isDirty || !isValid} className={styles.submitBtn}>
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
