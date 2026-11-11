import { useId } from "react";
import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export type FieldChange = ChangeEvent<HTMLInputElement | HTMLSelectElement>;

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  label: string;
  error?: string;
  select?: boolean;
  children?: ReactNode;
  onChange?: (e: FieldChange) => void;
};

export default function Field({ label, error, select, children, ...props }: FieldProps) {
  const errorId = useId();
  const describedBy = [props["aria-describedby"], error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const inputProps = { ...props, "aria-invalid": error ? true : props["aria-invalid"], "aria-describedby": describedBy };
  return (
    <label className="field">
      <span>{label}</span>
      {select ? (
        <select {...(inputProps as unknown as SelectHTMLAttributes<HTMLSelectElement>)}>{children}</select>
      ) : (
        <input {...(inputProps as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error && <small id={errorId} className="err">{error}</small>}
    </label>
  );
}
