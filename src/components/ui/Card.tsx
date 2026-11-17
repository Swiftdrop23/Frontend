import type { ReactNode } from "react";
import "./ui.css";

interface CardProps {
  title?: string;
  actions?: ReactNode; // e.g. a Button shown at the right of the title
  narrow?: boolean;
  children?: ReactNode;
}

export default function Card({ title, actions, narrow, children }: CardProps) {
  return (
    <section className={narrow ? "card narrow" : "card"}>
      {(title || actions) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
