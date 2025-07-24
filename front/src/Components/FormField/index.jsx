import styles from "./FormField.module.css";

function FormField({
  label,
  type = "text",
  name,
  value,
  onChange,
  field = "",
  error = false,
}) {
  let fieldText = `Enter your ${label.toLowerCase()}`;

  if (field) {
    fieldText = field;
  }

  return (
    <div className={styles.formField}>
      <label className={styles.label}>{label}</label>

      <input
        className={`${styles.field} ${error ? styles.error : ""}`}
        type={type}
        name={name}
        placeholder={fieldText}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default FormField;
