import type { ReactNode } from "react";
import "./ui.css";

interface EmptyStateProps {
  title?: string;
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ title = "Nothing here yet", message, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p style={{ margin: "0 0 12px" }}>{message}</p>
      {action}
    </div>
  );
}
