import type { HTMLAttributes, ReactNode } from "react";
import "./ui.css";

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: "section" | "aside";
  title?: string;
  actions?: ReactNode; // e.g. a Button shown at the right of the title
  narrow?: boolean;
  children?: ReactNode;
}

export default function Card({ as: Component = "section", title, actions, narrow, children, className, ...props }: CardProps) {
  return (
    <Component {...props} className={["card", narrow ? "narrow" : "", className].filter(Boolean).join(" ")}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </Component>
  );
}
