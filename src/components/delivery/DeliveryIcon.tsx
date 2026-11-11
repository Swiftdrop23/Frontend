type IconName = "parcel" | "route" | "person" | "check" | "search" | "shield" | "arrow" | "close";

const paths: Record<IconName, string> = {
  parcel: "m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v9M7.5 5.5l9 5v4",
  route: "M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 8v6a3 3 0 0 0 3 3h4M10 5h6a3 3 0 0 1 3 3v5",
  person: "M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  check: "m6 12 4 4 8-8",
  search: "M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0Zm-2 5 6 6",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  close: "m7 7 10 10M7 17 17 7",
};

/** Decorative only: each icon accompanies a visible text label. */
export default function DeliveryIcon({ name, className = "" }: { name: IconName; className?: string }) {
  return <svg className={`delivery-icon ${className}`} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
