import { useLocation } from "react-router-dom";

// Shown for every page nobody has built yet.
export default function Placeholder() {
  const { pathname } = useLocation();
  return (
    <div className="card">
      <p className="hint" style={{ margin: 0 }}>Page content for <code>{pathname}</code> goes here.</p>
    </div>
  );
}
