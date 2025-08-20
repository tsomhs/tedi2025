import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Login.module.css";
import FormField from "../../Components/FormField/index.jsx";
import { useNavigate } from "react-router-dom";
import { LoginApi } from "../../axios/auth.jsx";
function Login() {
  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    if (errors.username || errors.password) {
      setErrors({});
    }
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Use trimmedForm directly
    const trimmedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    setForm(trimmedForm);

    const newErrors = {};
    for (const [key, value] of Object.entries(trimmedForm)) {
      if (!value) {
        newErrors[key] = true;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const { code, role } = await LoginApi(form.username, form.password);

    if (code === 0) {
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/user-role");
      }
    } else {
      if (code === 1 || code === 2) {
        setErrors({ username: true, password: true });
      } else if (code === 3) {
        setForm({ username: "", password: "" });
        alert("User not approved by admin.");
      } else {
        setForm({ username: "", password: "" });
        alert("Unknown error occurred.");
      }
    }
  };

  //   const handleForgotPassword = () => {
  //     console.log("Forgot Password clicked");
  //   };

  return (
    <>
      <div className={styles.title}>Welcome to Cash Or Trash</div>
      <div className={styles.signInContainer}>
        <div className={styles.signInText}>Sign In</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField
            label="USERNAME"
            name="username"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
          />

          <FormField
            label="PASSWORD"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <span
            className={styles.errorText}
            style={{
              visibility:
                errors.username || errors.password ? "visible" : "hidden",
            }}
          >
            Wrong credentials.
          </span>

          <button className={styles.button}>SIGN IN</button>
        </form>

        {/* <div className={styles.orText}>OR</div>

        <button
          className={styles.forgotPassword}
          onClick={handleForgotPassword}
        >
          {" "}
          Forgot Password?
        </button> */}

        <div className={styles.signUpText}>
          Don't have an account?&nbsp;
          <Link to="/sign-up" className={styles.signUpLink}>
            Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}

export default Login;
