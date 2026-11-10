import type { ButtonHTMLAttributes } from "react";
import "./ui.css";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean; // full-width button
  loading?: boolean;
}

// type defaults to "button". Use type="submit" for form submit buttons.
export default function Button({
  variant = "secondary",
  block = false,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const classes = ["btn", block ? "" : "inline", variant === "secondary" ? "" : variant, className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? "Please wait..." : children}
    </button>
  );
}
