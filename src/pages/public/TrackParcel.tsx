import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, StatusBadge } from "../../components/ui";
import Timeline from "../../components/tracking/Timeline";
import { trackPublic, NOT_FOUND_MESSAGE } from "../../api/tracking";
import { getUser } from "../../api/auth";
import { homePath } from "../../config/navigation";
import { errMessage } from "../../utils/errors";
import type { PublicTracking } from "../../types/tracking";
import "../../components/tracking/tracking.css";
import "./publicTrack.css";

/** Public, mobile-first tracking page. Routes: /track and /track/:trackingNumber. No login. */
export default function TrackParcel() {
  const { trackingNumber: fromUrl = "" } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(fromUrl);
  const [result, setResult] = useState<PublicTracking | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);

  useEffect(() => {
    setInput(fromUrl);
    if (!fromUrl) { setResult(null); setError(""); return; }
    const id = ++request.current;
    setBusy(true);
    setError("");
    trackPublic(fromUrl)
      .then((r) => { if (id === request.current) setResult(r); })
      .catch((e) => { if (id === request.current) { setResult(null); setError(errMessage(e)); } })
      .finally(() => { if (id === request.current) setBusy(false); });
  }, [fromUrl]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const value = input.trim().toUpperCase();
    if (!value) { setResult(null); setError("Enter a tracking number."); return; }
    navigate(`/track/${encodeURIComponent(value)}`);
  }

  const notFound = error === NOT_FOUND_MESSAGE;
  const user = getUser();

  return (
    <div className="public-track">
      <header className="public-bar">
        <Link to="/track">SwiftDrop</Link>
        <nav className="public-nav" aria-label="SwiftDrop">
          <Link to="/get-a-quote">Get a quote</Link>
          {user
            ? <Link className="primary" to={homePath(user.role)}>My dashboard</Link>
            : <Link className="primary" to="/login">Log in</Link>}
        </nav>
      </header>
      <main className="public-body">
        <h1>Track your parcel</h1>
        <form className="public-search" onSubmit={submit} role="search">
          <label className="sr-only" htmlFor="tracking-input">Tracking number</label>
          <input id="tracking-input" value={input} placeholder="Tracking number" autoComplete="off"
            autoCapitalize="characters" spellCheck={false} maxLength={40} onChange={(e) => setInput(e.target.value)} />
          <Button type="submit" variant="primary" loading={busy}>Track</Button>
        </form>
        <p className="public-hint">Your tracking number is on your receipt, for example SD-1A2B3C4D.</p>

        {error && (notFound ? (
          <div className="public-missing" role="alert">
            <strong>We could not find that parcel</strong>
            <p>Check the tracking number and try again.</p>
          </div>
        ) : (
          <div className="notice error" role="alert">{error}</div>
        ))}

        {result && !error && (
          <section className="public-result" aria-live="polite">
            <span className="tracking-label">Tracking number</span>
            <span className="tracking-number">{result.trackingNumber}</span>
            <StatusBadge status={result.status} />
            <Timeline steps={result.timeline} />
            <p className="public-more">
              Sent this parcel? <Link to={user ? homePath(user.role) : "/login"}>{user ? "Open your dashboard" : "Log in"}</Link> to
              see delivery details and follow the courier live.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
