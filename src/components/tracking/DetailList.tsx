import type { ReactNode } from "react";
import "./tracking.css";

/** Label / value rows used on the details, receipt and live tracking cards. */
export default function DetailList({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <dl className="detail-list">
      {rows.map(([label, value]) => (
        <div key={label} className="detail-row">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
