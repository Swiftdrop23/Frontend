import type { TimelineStep } from "../../types/tracking";
import { formatDateTime } from "./format";
import "./tracking.css";

/** Vertical status timeline: filled dot = reached, empty dot = pending. */
export default function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="timeline" aria-label="Delivery timeline">
      {steps.map((step) => {
        const state = step.reached ? (step.status === "FAILED" || step.status === "CANCELLED" ? "failed" : "done") : "pending";
        return (
          <li key={step.status} className={`timeline-step ${state}`} aria-current={step.current ? "step" : undefined}>
            <span className="timeline-dot" aria-hidden="true" />
            <div>
              <strong>{step.label}</strong>
              <span className="timeline-time">{step.reached ? formatDateTime(step.at) || "time not recorded" : "pending"}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
