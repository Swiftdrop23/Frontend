import { useId } from "react";

export default function Field({ label, error, select, children, ...props }) {
  const errorId = useId();
  const describedBy = [props["aria-describedby"], error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const inputProps = { ...props, "aria-invalid": error ? true : props["aria-invalid"], "aria-describedby": describedBy };
  return (
    <label className="field">
      <span>{label}</span>
      {select ? <select {...inputProps}>{children}</select> : <input {...inputProps} />}
      {error && <small id={errorId} className="err">{error}</small>}
    </label>
  );
}
