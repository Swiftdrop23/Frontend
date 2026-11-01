import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import { forgotPassword } from "../api/auth";
import { isEmail } from "../utils/validate";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!isEmail(email)) return setError("Enter a valid email address.");
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      setMsg({ type: "ok", text: "If an account exists for this email, a reset link is on its way." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we will send you a reset link.">
      {msg.text && <div className={`notice ${msg.type}`} role="alert">{msg.text}</div>}
      <form onSubmit={submit} noValidate>
        <Field label="Email" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <button className="btn primary" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
      </form>
      <div className="links">
        <Link to="/login">Back to login</Link>
      </div>
    </AuthLayout>
  );
}
