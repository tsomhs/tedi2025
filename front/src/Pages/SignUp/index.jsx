import styles from "./SignUp.module.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../../Components/FormField/index.jsx";
import { useNavigate } from "react-router-dom";
import { RegisterApi } from "../../axios/auth.jsx";

function SignUp() {
  const navigate = useNavigate();

  const [usernameExists, setUsernameExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    id: "",
    role: "",
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    country: "",
    location: "",
    vatNumber: "",
    password: "",
    confirmedPassword: "",
    status: "",
  });

  const handleChange = (e) => {
    if (Object.keys(errors).length > 0) {
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
    setUsernameExists(false);

    // Use trimmedForm directly
    const trimmedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    setForm(trimmedForm);

    const newErrors = {};
    for (const [key, value] of Object.entries(form)) {
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

    setLoading(true);

    console.log("Sending body to backend:", {
      username: form.username,
      password: form.password,
      email: form.email,
      first_name: form.firstName,
      last_name: form.lastName,
      phone_number: form.phoneNumber,
      country: form.country,
      location: form.location,
      vat_number: form.vatNumber,
      role: form.role,
    });

    try {
      const result = await RegisterApi({
        username: form.username,
        password: form.password,
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: form.phoneNumber,
        country: form.country,
        location: form.location,
        vat_number: form.vatNumber,
        role: form.role || "buyer",
      });

      if (result === 0) {
        navigate("/pending-approval");
      } else if (result === 1) {
        setUsernameExists(true);
      } else {
        console.log("Registration failed");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false); // <---- stop loading
    }
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
            label="Location"
            name="location"
            value={form.Location}
            onChange={handleChange}
            error={errors.location}
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

          <button className={styles.button} disabled={loading}>
            {loading ? "Registering..." : "SIGN UP"}
          </button>
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
