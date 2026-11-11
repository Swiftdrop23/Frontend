import DeliveryIcon from "./DeliveryIcon";

export default function DeliverySteps({ labels, current, label }: { labels: string[]; current: number; label: string }) {
  return (
    <ol className="delivery-steps" aria-label={label}>
      {labels.map((text, index) => <li key={text} aria-current={index === current ? "step" : undefined} className={index < current ? "is-complete" : undefined}>
        <span className="delivery-step-number" aria-hidden="true">{index < current ? <DeliveryIcon name="check" /> : index + 1}</span>
        <span>{text}</span>
      </li>)}
    </ol>
  );
}
