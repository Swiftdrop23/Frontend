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
  return (
    <label className="field">
      <span>{label}</span>
      {select ? (
        <select {...(props as unknown as SelectHTMLAttributes<HTMLSelectElement>)}>{children}</select>
      ) : (
        <input {...(props as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error && <small className="err">{error}</small>}
    </label>
  );
}
