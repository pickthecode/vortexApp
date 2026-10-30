import { useState } from "react";
import styles from "./Auth.module.scss";
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import LoginForm from "../../components/LoginForm/LoginForm";

type AuthMode = "login" | "register";

export default function Auth() {
  const [mode, setmode] = useState<AuthMode>("register");

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        {mode === "register" ? (
          <RegisterForm onSwitchMode={() => setmode("login")} />
        ) : (
          <LoginForm onSwitchMode={() => setmode("register")} />
        )}
      </div>
    </div>
  );
}
