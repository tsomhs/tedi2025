import styles from "./SignUp.module.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../../Components/FormField/index.jsx";
import { useNavigate } from "react-router-dom";
import UserStruct from "../../constants/userStruct.js";

function SignUp() {
  const navigate = useNavigate();

  const [usernameExists, setUsernameExists] = useState(false);

  const [form, setForm] = useState({ ...UserStruct });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUsernameExists(false);

    // Use trimmedForm directly
    const trimmedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    setForm(trimmedForm);

    const newErrors = {};
    for (const [key, value] of Object.entries(trimmedForm)) {
      if (key === "id" || key === "role" || key === "status") continue;
      if (!value) {
        newErrors[key] = true;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.error("Form has errors");
      console.log("Errors:", newErrors);
      return;
    }

    //TODO Use API CALL to check existing username
    if (form.username === "existingUser") {
      setUsernameExists(true);
      return;
    }

    console.log("Form submitted:", trimmedForm);
    navigate("/pending-approval");
  };

  return (
    <>
      <div className={styles.title}>Welcome to Cash Or Trash</div>
      <div className={styles.signUpContainer}>
        <div className={styles.signUpText}>Sign Up</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField
            label="USERNAME"
            name="username"
            value={form.username}
            onChange={handleChange}
            field="Create a username"
            error={errors.username}
          />
          <FormField
            type="email"
            label="EMAIL"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />

          <FormField
            label="FIRST NAME"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <FormField
            label="COUNTRY"
            name="country"
            value={form.country}
            onChange={handleChange}
            error={errors.country}
          />

          <FormField
            label="LAST NAME"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
          <FormField
            label="ADDRESS"
            name="address"
            value={form.address}
            onChange={handleChange}
            error={errors.address}
          />
          <FormField
            type="tel"
            label="PHONE NUMBER"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleChange}
            error={errors.phoneNumber}
          />
          <FormField
            label="VAT NUMBER"
            name="vatNumber"
            value={form.vatNumber}
            onChange={handleChange}
            error={errors.vatNumber}
          />

          <FormField
            label="PASSWORD"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            field="Create a password"
            error={errors.password}
          />

          <FormField
            label="CONFIRMED PASSWORD"
            type="password"
            name="confirmedPassword"
            value={form.confirmedPassword}
            onChange={handleChange}
            field="Confirm your password"
            error={errors.confirmedPassword}
          />

          <div className={styles.errorContainer}>
            {form.password &&
              form.confirmedPassword &&
              form.password !== form.confirmedPassword && (
                <span className={styles.errorText}>
                  Please ensure both passwords match.
                </span>
              )}
            {form.password.length >= 1 && form.password.length < 8 && (
              <span className={styles.errorText}>
                Password must be at least 8 characters long.
              </span>
            )}
            {usernameExists && (
              <span className={styles.errorText}>Username already exists.</span>
            )}
          </div>

          <button className={styles.button}>SIGN UP</button>
        </form>

        <div className={styles.signInText}>
          Already have an account?&nbsp;
          <Link to="/" className={styles.signInLink}>
            Sign In
          </Link>
        </div>
      </div>
    </>
  );
}

export default SignUp;
