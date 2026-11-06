import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Field from "../components/Field";
import { login, saveSession } from "../api/auth";
import { homePath } from "../config/navigation";
import { isEmail } from "../utils/validate";

export default function Login() {
  const nav = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (e) => setF({ ...f, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const er = {};
    if (!isEmail(f.email)) er.email = "Enter a valid email address.";
    if (!f.password) er.password = "Enter your password.";
    setErrors(er);
    setMsg("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const session = await login(f.email.trim(), f.password);
      saveSession(session);
      nav(homePath(session.user.role), { replace: true });
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Welcome back">
      {msg && <div className="notice error" role="alert">{msg}</div>}
      <form onSubmit={submit} noValidate>
        <Field label="Email" name="email" type="email" placeholder="you@example.com" autoComplete="email" value={f.email} onChange={set} error={errors.email} />
        <Field label="Password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" value={f.password} onChange={set} error={errors.password} />
        <Link className="forgot" to="/forgot-password">Forgot password?</Link>
        <button className="btn primary" disabled={busy}>{busy ? "Logging in..." : "Login"}</button>
      </form>
      <p className="or">or</p>
      <button type="button" className="btn" onClick={() => setMsg("Google sign-in will be connected once the backend is ready.")}>Continue with Google</button>
      <div className="links">
        <Link to="/get-a-quote">Get a Quote</Link>
        <Link to="/register">New here? Create an account</Link>
      </div>
    </AuthLayout>
  );
}
